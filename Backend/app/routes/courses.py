# BACKEND/app/routes/courses.py
import os
import uuid
from flask import request, g, current_app
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from sqlalchemy import func, desc # Import func and desc
from datetime import datetime

from app.extensions import db
from app.models import Course, Lesson, Category, Enrollment, Review, User, Payment # Import necessary models
from app.utils.responses import success_response, error_response
from app.utils.image_processor import save_course_thumbnail
from app.services.minio_service import (
    upload_file_to_minio,
    get_video_duration,
    get_presigned_url,
    delete_file_from_minio # Import delete function
)
from app.middleware.auth_middleware import token_required
from . import courses_bp

# --- Utility function for Category Handling (used in create and update) ---
def get_or_create_category(category_name):
    """Finds an existing category by name or creates a new one."""
    if not category_name:
        return None, "Category name cannot be empty."

    # Use case-insensitive search first
    category = Category.query.filter(func.lower(Category.category_name) == func.lower(category_name)).first()

    if category:
        return category, None # Found existing

    # Create new category if not found
    try:
        new_category = Category(category_name=category_name.strip()) # Ensure trimmed name
        db.session.add(new_category)
        # Flush to ensure it gets an ID temporarily in case of later errors,
        # but full commit happens with the course.
        db.session.flush()
        current_app.logger.info(f"Prepared new category '{new_category.category_name}' for creation.")
        return new_category, None # Return new category instance
    except IntegrityError: # Catch potential unique constraint violation on commit
         db.session.rollback()
         # Try fetching again in case of race condition
         category = Category.query.filter(func.lower(Category.category_name) == func.lower(category_name)).first()
         if category:
             return category, None
         else:
             current_app.logger.error(f"Integrity error creating category '{category_name}' even after re-check.")
             return None, f"Failed to create category '{category_name}' due to conflict."
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating category '{category_name}': {e}", exc_info=True)
        return None, f"Failed to create category '{category_name}'."

# --- Utility function for MinIO file upload (used in add and update lesson) ---
def handle_minio_upload(file_storage, base_path, content_type):
    """Handles secure filename generation and upload to MinIO."""
    if not file_storage or not file_storage.filename:
        return None, "File is missing or has no filename."

    # Sanitize filename
    filename_secure = secure_filename(file_storage.filename)
    if not filename_secure: # Handle cases where secure_filename returns empty string
         filename_secure = "uploaded_file"

    # Create a unique name using UUID and sanitized filename
    unique_filename = f"{base_path}/{uuid.uuid4().hex}_{filename_secure}"

    # Ensure the stream is reset before upload
    try:
        file_storage.stream.seek(0)
    except Exception as e:
        current_app.logger.warning(f"Could not seek file stream for {filename_secure}: {e}. Upload might fail.")
        # Consider reading into BytesIO as a fallback if seek fails often
        # data = file_storage.stream.read()
        # file_storage.stream = io.BytesIO(data)


    uploaded_name = upload_file_to_minio(
        file_stream=file_storage.stream, # Pass the stream directly
        object_name=unique_filename,
        content_type=content_type or 'application/octet-stream' # Provide default content type
    )

    if not uploaded_name:
        return None, f"Failed to upload {filename_secure} to storage."

    return uploaded_name, None


# --- Course Creation ---
@courses_bp.route("/", methods=["POST"])
@token_required
def create_new_course():
    """Create a new course. Handles category creation/selection."""
    current_user = g.current_user
    data = request.form
    thumbnail_image = request.files.get('thumbnail_image')

    required_fields = ['course_title', 'price', 'difficulty_level', 'language', 'category_name']
    if not all(field in data for field in required_fields):
        missing = [field for field in required_fields if field not in data]
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    if not thumbnail_image:
        return error_response("Course thumbnail image is required.", 400)

    try:
        price = float(data['price'])
        if price < 0: raise ValueError("Price cannot be negative.")
    except ValueError:
        return error_response("Invalid price format.", 400)

    # --- Thumbnail Processing ---
    thumbnail_filename = save_course_thumbnail(thumbnail_image)
    if not thumbnail_filename:
        return error_response("Failed to process course thumbnail image.", 400)

    # --- Get or Create Category ---
    category_name = data['category_name'].strip()
    category, error = get_or_create_category(category_name)
    if error:
        # Clean up saved thumbnail if category fails
        try: os.remove(os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], thumbnail_filename))
        except OSError: pass
        return error_response(error, 400 if "empty" in error else 500)

    # --- Create Course ---
    try:
        new_course = Course(
            course_title=data['course_title'],
            course_description=data.get('course_description'),
            price=price,
            thumbnail_filename=thumbnail_filename, # Local filename
            difficulty_level=data['difficulty_level'],
            language=data['language'],
            creator_id=current_user.user_id,
            category_id=category.category_id
        )
        db.session.add(new_course)
        # If category was new, it's already added to the session in get_or_create_category
        db.session.commit()
        current_app.logger.info(f"Course created successfully: ID {new_course.course_id}, Title: {new_course.course_title}")
        return success_response(
            "Course created successfully.",
            data={'course': new_course.to_dict(include_category=True, include_creator=True)},
            status_code=201
        )
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Database integrity error creating course: {e}")
        try: os.remove(os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], thumbnail_filename))
        except OSError: pass
        return error_response("Could not create course due to a database conflict.", 409)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating course: {e}", exc_info=True)
        try: os.remove(os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], thumbnail_filename))
        except OSError: pass
        return error_response("An unexpected error occurred.", 500)


# --- Update Course ---
@courses_bp.route("/<int:course_id>", methods=["PUT"])
@token_required
def update_course(course_id):
    """Update course details."""
    current_user = g.current_user
    course = Course.query.filter_by(course_id=course_id, creator_id=current_user.user_id).first_or_404()

    data = request.form
    thumbnail_image = request.files.get('thumbnail_image')
    updated = False

    # Update simple fields
    if 'course_title' in data and data['course_title'] != course.course_title:
        course.course_title = data['course_title']; updated = True
    if 'course_description' in data and data['course_description'] != course.course_description:
        course.course_description = data.get('course_description'); updated = True
    if 'difficulty_level' in data and data['difficulty_level'] != course.difficulty_level:
        course.difficulty_level = data['difficulty_level']; updated = True
    if 'language' in data and data['language'] != course.language:
        course.language = data['language']; updated = True

    # Update Price
    if 'price' in data:
        try:
            new_price = float(data['price'])
            if new_price < 0: return error_response("Price cannot be negative.", 400)
            if new_price != course.price: course.price = new_price; updated = True
        except ValueError: return error_response("Invalid price format.", 400)

    # Update Category
    if 'category_name' in data:
        new_category_name = data['category_name'].strip()
        # Check if category name changed or if course has no category yet
        if new_category_name and (not course.category or new_category_name != course.category.category_name):
            category, error = get_or_create_category(new_category_name)
            if error: return error_response(error, 400 if "empty" in error else 500)
            course.category_id = category.category_id
            updated = True

    # Update Thumbnail
    old_thumbnail_filename = course.thumbnail_filename
    new_thumbnail_filename = None
    if thumbnail_image:
        new_thumbnail_filename = save_course_thumbnail(thumbnail_image)
        if not new_thumbnail_filename:
            return error_response("Failed to process new course thumbnail image.", 400)
        course.thumbnail_filename = new_thumbnail_filename
        updated = True

    if not updated:
        return error_response("No changes detected.", 400)

    course.updated_date = datetime.utcnow()

    try:
        db.session.commit()
        current_app.logger.info(f"Course updated successfully: ID {course_id}")

        # Clean up old local thumbnail *after* successful commit
        if new_thumbnail_filename and old_thumbnail_filename and old_thumbnail_filename != new_thumbnail_filename:
            old_thumbnail_path = os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], old_thumbnail_filename)
            if os.path.exists(old_thumbnail_path):
                try:
                    os.remove(old_thumbnail_path)
                    current_app.logger.info(f"Removed old local course thumbnail: {old_thumbnail_path}")
                except OSError as e:
                    current_app.logger.error(f"Error removing old local thumbnail {old_thumbnail_path}: {e}")
            # Note: Thumbnails aren't in MinIO in this setup, only lesson files are.

        return success_response(
            "Course updated successfully.",
            data={'course': course.to_dict(include_category=True, include_creator=True)}
        )
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Database integrity error updating course ID {course_id}: {e}")
        # Clean up newly saved local thumbnail if commit fails
        if new_thumbnail_filename:
            new_thumbnail_path = os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], new_thumbnail_filename)
            if os.path.exists(new_thumbnail_path): 
                try: os.remove(new_thumbnail_path)
                except OSError: pass
        return error_response("Could not update course due to a database conflict.", 409)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating course ID {course_id}: {e}", exc_info=True)
        if new_thumbnail_filename:
             new_thumbnail_path = os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], new_thumbnail_filename)
             if os.path.exists(new_thumbnail_path):
                try: os.remove(new_thumbnail_path)
                except OSError: pass
        return error_response("An unexpected error occurred while updating the course.", 500)


# --- Get Created Courses ---
@courses_bp.route("/created", methods=["GET"])
@token_required
def get_created_courses():
    """Get all courses created by the logged-in user"""
    current_user = g.current_user
    courses = Course.query.filter_by(creator_id=current_user.user_id).order_by(Course.updated_date.desc()).all()
    courses_list = [course.to_dict(include_category=True) for course in courses]
    return success_response("Fetched created courses successfully.", data={'courses': courses_list})

# --- Get Created Course Detail (for Management) ---
@courses_bp.route("/<int:course_id>/manage", methods=["GET"])
@token_required
def get_created_course_detail_for_manage(course_id):
    """Get full details of a specific course created by the user for management"""
    current_user = g.current_user
    course = Course.query.filter_by(course_id=course_id, creator_id=current_user.user_id).first_or_404()

    # Generate presigned URLs for lessons here
    lessons_data = [lesson.to_dict(generate_urls=True) for lesson in course.lessons]

    course_data = course.to_dict(include_category=True, include_creator=True, include_stats=True)

    return success_response(
        "Fetched created course details successfully.",
        data={
            "course": course_data,
            "lessons": lessons_data
        }
    )


# --- Add Lesson ---
@courses_bp.route("/<int:course_id>/lessons", methods=["POST"])
@token_required
def add_lesson_to_course(course_id):
    """Add a new lesson to a course owned by the user"""
    current_user = g.current_user
    course = Course.query.filter_by(course_id=course_id, creator_id=current_user.user_id).first_or_404()

    data = request.form
    video_file = request.files.get('lesson_video')
    assignment_file = request.files.get('lesson_assignment')

    if 'lesson_title' not in data or not data['lesson_title']:
        return error_response("Lesson title is required.", 400)

    # Handle Video Upload
    video_duration = 0
    unique_video_filename = None
    if video_file:
        video_duration = get_video_duration(video_file) # Calculate duration first
        # video_duration could be 0 if moviepy isn't installed or processing fails

        video_base_path = f"course_{course_id}/lessons"
        uploaded_name, error = handle_minio_upload(video_file, video_base_path, video_file.content_type)
        if error: return error_response(error, 500)
        unique_video_filename = uploaded_name

    # Handle Assignment Upload
    unique_assignment_filename = None
    if assignment_file:
        assignment_base_path = f"course_{course_id}/lessons"
        uploaded_name, error = handle_minio_upload(assignment_file, assignment_base_path, assignment_file.content_type)
        if error:
            # Cleanup uploaded video if assignment fails
            if unique_video_filename: delete_file_from_minio(unique_video_filename)
            return error_response(error, 500)
        unique_assignment_filename = uploaded_name

    # Create and save the new lesson
    try:
        new_lesson = Lesson(
            course_id=course_id,
            lesson_title=data['lesson_title'],
            lesson_description=data.get('lesson_description'),
            lesson_video_name=unique_video_filename,
            lesson_assignment_name=unique_assignment_filename,
            duration=video_duration # Store duration in seconds
        )
        db.session.add(new_lesson)

        # Update course's estimated duration and timestamp
        course.estimated_duration = (course.estimated_duration or 0) + video_duration
        course.updated_date = datetime.utcnow()

        db.session.commit()
        current_app.logger.info(f"Lesson added to course {course_id}: ID {new_lesson.lesson_id}")

        return success_response(
            "Lesson added successfully.",
            data={'lesson': new_lesson.to_dict(generate_urls=True)}, # Return with presigned URLs
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding lesson to course {course_id}: {e}", exc_info=True)
        # Cleanup uploaded files from MinIO on DB error
        if unique_video_filename: delete_file_from_minio(unique_video_filename)
        if unique_assignment_filename: delete_file_from_minio(unique_assignment_filename)
        return error_response("An unexpected error occurred while adding the lesson.", 500)


# --- Update Lesson ---
@courses_bp.route("/<int:course_id>/lessons/<int:lesson_id>", methods=["PUT"])
@token_required
def update_lesson(course_id, lesson_id):
    """Update details of an existing lesson, including replacing files."""
    current_user = g.current_user
    course = Course.query.filter_by(course_id=course_id, creator_id=current_user.user_id).first_or_404()
    lesson = Lesson.query.filter_by(lesson_id=lesson_id, course_id=course_id).first_or_404()

    data = request.form
    video_file = request.files.get('lesson_video')
    assignment_file = request.files.get('lesson_assignment')
    updated = False
    duration_change = 0
    old_video_name = lesson.lesson_video_name
    old_assignment_name = lesson.lesson_assignment_name
    new_video_name = None
    new_assignment_name = None

    # Update Text Fields
    if 'lesson_title' in data and data['lesson_title'] != lesson.lesson_title:
        lesson.lesson_title = data['lesson_title']; updated = True
    if 'lesson_description' in data and data.get('lesson_description') != lesson.lesson_description:
        lesson.lesson_description = data.get('lesson_description'); updated = True

    # Handle Video Update
    if video_file:
        current_app.logger.info(f"Processing video update for lesson {lesson_id}")
        old_duration = lesson.duration or 0
        new_duration = get_video_duration(video_file)

        video_base_path = f"course_{course_id}/lessons"
        uploaded_name, error = handle_minio_upload(video_file, video_base_path, video_file.content_type)
        if error: return error_response(error, 500)

        new_video_name = uploaded_name
        lesson.lesson_video_name = new_video_name
        lesson.duration = new_duration
        duration_change = new_duration - old_duration
        updated = True
        current_app.logger.info(f"Video updated for lesson {lesson_id}. New name: {new_video_name}")

    # Handle Assignment Update
    if assignment_file:
        current_app.logger.info(f"Processing assignment update for lesson {lesson_id}")
        assignment_base_path = f"course_{course_id}/lessons"
        uploaded_name, error = handle_minio_upload(assignment_file, assignment_base_path, assignment_file.content_type)
        if error:
            # Cleanup newly uploaded video if assignment fails
            if new_video_name and new_video_name != old_video_name: delete_file_from_minio(new_video_name)
            return error_response(error, 500)

        new_assignment_name = uploaded_name
        lesson.lesson_assignment_name = new_assignment_name
        updated = True
        current_app.logger.info(f"Assignment updated for lesson {lesson_id}. New name: {new_assignment_name}")

    if not updated:
        return error_response("No changes detected.", 400)

    # Update Course Timestamp and Duration
    if duration_change != 0:
        course.estimated_duration = max(0, (course.estimated_duration or 0) + duration_change)
    course.updated_date = datetime.utcnow()

    # Commit Changes
    try:
        db.session.commit()
        current_app.logger.info(f"Lesson {lesson_id} updated successfully.")

        # Clean up old MinIO files AFTER successful commit
        if new_video_name and old_video_name and new_video_name != old_video_name:
            if delete_file_from_minio(old_video_name):
                 current_app.logger.info(f"Deleted old video file from MinIO: {old_video_name}")
        if new_assignment_name and old_assignment_name and new_assignment_name != old_assignment_name:
            if delete_file_from_minio(old_assignment_name):
                 current_app.logger.info(f"Deleted old assignment file from MinIO: {old_assignment_name}")

        return success_response(
            "Lesson updated successfully.",
            data={'lesson': lesson.to_dict(generate_urls=True)}
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating lesson {lesson_id}: {e}", exc_info=True)
        # Cleanup newly uploaded files if commit fails
        if new_video_name and new_video_name != old_video_name: delete_file_from_minio(new_video_name)
        if new_assignment_name and new_assignment_name != old_assignment_name: delete_file_from_minio(new_assignment_name)
        return error_response("An unexpected error occurred while updating the lesson.", 500)


# --- Delete Lesson ---
@courses_bp.route("/<int:course_id>/lessons/<int:lesson_id>", methods=["DELETE"])
@token_required
def delete_lesson(course_id, lesson_id):
    """Deletes a lesson and its associated files from MinIO"""
    current_user = g.current_user
    course = Course.query.filter_by(course_id=course_id, creator_id=current_user.user_id).first_or_404()
    lesson = Lesson.query.filter_by(lesson_id=lesson_id, course_id=course_id).first_or_404()

    lesson_duration = lesson.duration or 0
    video_name_to_delete = lesson.lesson_video_name
    assignment_name_to_delete = lesson.lesson_assignment_name

    try:
        # Update Course Duration and Timestamp before deleting lesson
        course.estimated_duration = max(0, (course.estimated_duration or 0) - lesson_duration)
        course.updated_date = datetime.utcnow()

        # Delete Lesson from DB
        db.session.delete(lesson)
        db.session.commit()
        current_app.logger.info(f"Lesson {lesson_id} deleted from DB for course {course_id}.")

        # Clean up MinIO files AFTER successful DB commit
        if video_name_to_delete:
            if delete_file_from_minio(video_name_to_delete):
                 current_app.logger.info(f"Deleted video file from MinIO: {video_name_to_delete}")
        if assignment_name_to_delete:
            if delete_file_from_minio(assignment_name_to_delete):
                 current_app.logger.info(f"Deleted assignment file from MinIO: {assignment_name_to_delete}")

        return success_response("Lesson deleted successfully.", status_code=200)

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting lesson {lesson_id}: {e}", exc_info=True)
        return error_response("An unexpected error occurred while deleting the lesson.", 500)


# --- Explore Courses ---
@courses_bp.route("/explore", methods=["GET"])
@token_required
def explore_courses():
    """Get courses available for enrollment (excluding user's own and already enrolled)"""
    current_user = g.current_user

    enrolled_course_ids = db.session.query(Enrollment.course_id).filter(
        Enrollment.learner_id == current_user.user_id
    ).scalar_subquery() # Use scalar_subquery for IN clause

    courses = Course.query.filter(
        Course.creator_id != current_user.user_id,
        Course.course_id.notin_(enrolled_course_ids) # Use notin_
    ).order_by(Course.date_of_creation.desc()).all()

    courses_list = [
        course.to_dict(include_category=True, include_creator=True, include_stats=True) # Include avg rating
        for course in courses
    ]
    return success_response("Fetched explore courses successfully.", data={'courses': courses_list})


# --- Explore Course Detail ---
@courses_bp.route("/<int:course_id>/explore-detail", methods=["GET"])
# No token required here, public view
def get_explore_course_detail(course_id):
    """Get public details of a specific course for exploration"""
    course = Course.query.get_or_404(course_id)

    # Basic lesson info (ID, title, duration)
    lessons_data = [
        { 'lesson_id': lesson.lesson_id, 'lesson_title': lesson.lesson_title, 'duration': lesson.duration }
        for lesson in course.lessons # Already ordered by ID in model relationship
    ]

    course_data = course.to_dict(include_category=True, include_creator=True, include_stats=True) # Include avg rating
    creator_data = course.creator.to_dict() if course.creator else None

    return success_response(
        "Fetched course details for exploration.",
        data={
            "course": course_data,
            "lessons_overview": lessons_data,
            "creator": creator_data
        }
    )


# --- Enroll in Course ---
@courses_bp.route("/<int:course_id>/enroll", methods=["POST"])
@token_required
def enroll_in_course(course_id):
    """Enroll the logged-in user in a specific course"""
    current_user = g.current_user
    course = Course.query.get_or_404(course_id)

    if course.creator_id == current_user.user_id:
        return error_response("You cannot enroll in your own course.", 400)

    existing_enrollment = Enrollment.query.filter_by(
        learner_id=current_user.user_id, course_id=course_id
    ).first()
    if existing_enrollment:
        return error_response("You are already enrolled in this course.", 400)

    payment = None
    payment_id = None
    if course.price > 0:
        # --- Placeholder Payment Logic ---
        transaction_id_stub = f"MOCKTXN-{course_id}-{current_user.user_id}-{uuid.uuid4().hex[:8]}"
        try:
            payment = Payment(
                amount=course.price, payment_method="Mock Gateway",
                transaction_id=transaction_id_stub, status="successful", # Assume success
                user_id=current_user.user_id
            )
            db.session.add(payment)
            db.session.flush() # Get payment_id
            payment_id = payment.payment_id
            current_app.logger.info(f"Mock payment record created (ID: {payment_id}) for user {current_user.user_id}, course {course_id}")
        except Exception as pay_err:
            db.session.rollback()
            current_app.logger.error(f"Error creating mock payment record: {pay_err}", exc_info=True)
            return error_response("Payment processing failed.", 500)
        # --- End Placeholder ---

    # Create Enrollment record
    try:
        enrollment = Enrollment(
            learner_id=current_user.user_id, course_id=course_id, payment_id=payment_id
        )
        db.session.add(enrollment)
        if payment: # Link payment back to enrollment if created
            payment.enrollment = enrollment

        db.session.commit()
        current_app.logger.info(f"User {current_user.user_id} enrolled in course {course_id}.")

        return success_response(
            "Successfully enrolled in course.",
            data={
                "enrollment": enrollment.to_dict(),
                "payment": payment.to_dict() if payment else None
            },
            status_code=201
        )
    except IntegrityError:
        db.session.rollback()
        current_app.logger.warning(f"Enrollment race condition for user {current_user.user_id}, course {course_id}")
        return error_response("Enrollment failed (concurrent request?). Please try again.", 409)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during enrollment commit for user {current_user.user_id}, course {course_id}: {e}", exc_info=True)
        return error_response("An unexpected error occurred during enrollment.", 500)


# --- Get Enrolled Courses ---
@courses_bp.route("/enrolled", methods=["GET"])
@token_required
def get_enrolled_courses():
    """Get all courses the logged-in user is enrolled in"""
    current_user = g.current_user
    # Use joinedload for efficiency
    enrollments = Enrollment.query.options(
        joinedload(Enrollment.course).joinedload(Course.category),
        joinedload(Enrollment.course).joinedload(Course.creator)
    ).filter_by(learner_id=current_user.user_id).order_by(desc(Enrollment.enrollment_date)).all() # Order by most recent enrollment

    enrolled_courses_list = []
    for enrollment in enrollments:
        if enrollment.course:
            course_data = enrollment.course.to_dict(include_category=True, include_creator=True, include_stats=True) # Include avg rating
            course_data['enrollment_details'] = enrollment.to_dict() # Add enrollment info (progress %)
            enrolled_courses_list.append(course_data)

    return success_response("Fetched enrolled courses successfully.", data={'courses': enrolled_courses_list})


# --- Get Enrolled Course Detail ---
# @courses_bp.route("/<int:course_id>/enrolled-detail", methods=["GET"])
# @token_required
# def get_enrolled_course_detail(course_id):
#     """Get full details of an enrolled course, including progress and lesson URLs"""
#     current_user = g.current_user

#     enrollment = Enrollment.query.options(
#         joinedload(Enrollment.course).joinedload(Course.lessons), # Eager load lessons
#         joinedload(Enrollment.course).joinedload(Course.category),
#         joinedload(Enrollment.course).joinedload(Course.creator)
#     ).filter_by(
#         learner_id=current_user.user_id, course_id=course_id
#     ).first_or_404(description="You are not enrolled in this course or it does not exist.")

#     course = enrollment.course

#     # Get lessons with generated presigned URLs (ordered by ID via relationship)
#     lessons_data = [lesson.to_dict(generate_urls=True) for lesson in course.lessons]

#     course_data = course.to_dict(include_category=True, include_creator=True, include_stats=True) # Include rating
#     # Add the detailed enrollment info, including progress
#     course_data['enrollment_details'] = enrollment.to_dict()

#     return success_response(
#         "Fetched enrolled course details.",
#         data={
#             "course": course_data,
#             "lessons": lessons_data
#         }
#     )
@courses_bp.route("/<int:course_id>/enrolled-detail", methods=["GET"])
@token_required
def get_enrolled_course_detail(course_id):
    """Get full details of an enrolled course, including progress and lesson URLs"""
    current_user = g.current_user

    # --- CORRECTED QUERY ---
    # Remove the joinedload for Course.lessons
    enrollment = Enrollment.query.options(
        # Eager load the course itself, its category, and its creator
        joinedload(Enrollment.course).joinedload(Course.category),
        joinedload(Enrollment.course).joinedload(Course.creator)
        # REMOVED: joinedload(Enrollment.course).joinedload(Course.lessons)
    ).filter_by(
        learner_id=current_user.user_id, course_id=course_id
    ).first_or_404(description="You are not enrolled in this course or it does not exist.")
    # --- END CORRECTION ---

    course = enrollment.course # Get the course object (category and creator are eager loaded)

    # Get lessons with generated presigned URLs
    # Accessing course.lessons here will trigger the lazy load (dynamic query)
    # The order_by in the relationship definition still applies.
    lessons_data = [lesson.to_dict(generate_urls=True) for lesson in course.lessons]

    course_data = course.to_dict(include_category=True, include_creator=True, include_stats=True) # Include rating
    # Add the detailed enrollment info, including progress
    course_data['enrollment_details'] = enrollment.to_dict()

    return success_response(
        "Fetched enrolled course details.",
        data={
            "course": course_data,
            "lessons": lessons_data
        }
    )

# --- NEW ROUTE: Mark Lesson as Completed ---
@courses_bp.route("/<int:course_id>/lessons/<int:lesson_id>/complete", methods=["POST"])
@token_required
def mark_lesson_complete(course_id, lesson_id):
    """Marks a specific lesson as completed for the enrolled user."""
    current_user = g.current_user

    # 1. Verify enrollment
    enrollment = Enrollment.query.filter_by(
        learner_id=current_user.user_id, course_id=course_id
    ).first()
    if not enrollment:
        return error_response("You are not enrolled in this course.", 403)

    # 2. Verify lesson exists in the course
    lesson = Lesson.query.filter_by(lesson_id=lesson_id, course_id=course_id).first()
    if not lesson:
        return error_response("Lesson not found in this course.", 404)

    # 3. Update progress (simple increment - needs improvement for idempotency)
    #    A more robust system would store completed lesson IDs in a separate table or JSON field.
    #    For simplicity, we increment, but this isn't safe if called multiple times.
    #    Let's assume frontend prevents multiple calls for now.
    #    A better approach: Check if lesson already marked complete before incrementing.

    # --- Better Approach (Conceptual - requires schema change or different tracking) ---
    # if lesson_id not in enrollment.completed_lesson_ids: # Assuming completed_lesson_ids is a list/set
    #    enrollment.completed_lesson_ids.append(lesson_id)
    #    enrollment.lessons_completed = len(enrollment.completed_lesson_ids)
    #    # Update time spent? Needs mechanism.
    #    # enrollment.time_spent_seconds += calculate_time_spent()
    #    db.session.commit()
    #    return success_response("Lesson progress updated.", data=enrollment.to_dict())
    # else:
    #    return success_response("Lesson already marked as complete.", data=enrollment.to_dict(), status_code=200)
    # --- End Better Approach ---

    # --- Simple Increment (Less Safe) ---
    try:
        # Ideally, check if already completed before incrementing
        # For now, just increment, capped at total lessons
        total_lessons = enrollment.course.lessons.count()
        if enrollment.lessons_completed < total_lessons:
             enrollment.lessons_completed += 1
             # Add placeholder time update logic if needed
             # enrollment.time_spent_seconds += lesson.duration or 60 # Add lesson duration or default
             db.session.commit()
             current_app.logger.info(f"Lesson {lesson_id} marked complete for user {current_user.user_id} in course {course_id}. Progress: {enrollment.lessons_completed}/{total_lessons}")
             return success_response("Lesson marked as complete.", data={'enrollment': enrollment.to_dict()})
        else:
             # Already completed all or more than total (data issue?)
             current_app.logger.warning(f"Attempt to mark lesson {lesson_id} complete, but progress already {enrollment.lessons_completed}/{total_lessons}")
             return success_response("Progress already at maximum.", data={'enrollment': enrollment.to_dict()}, status_code=200)

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking lesson complete: {e}", exc_info=True)
        return error_response("Failed to update progress.", 500)
    # --- End Simple Increment ---


# --- Reviews ---
@courses_bp.route("/<int:course_id>/review", methods=["POST"])
@token_required
def add_or_update_review(course_id):
    # (No changes needed here based on requirements)
    current_user = g.current_user
    data = request.get_json()
    if not data or 'rating' not in data: return error_response("Rating is required.", 400)
    try:
        rating = int(data['rating'])
        if not 1 <= rating <= 5: raise ValueError("Rating must be between 1 and 5.")
    except (ValueError, TypeError): return error_response("Invalid rating value.", 400)
    comment = data.get('comment', None)
    enrollment = Enrollment.query.filter_by(learner_id=current_user.user_id, course_id=course_id).first()
    if not enrollment: return error_response("You must be enrolled to review.", 403)
    existing_review = Review.query.filter_by(user_id=current_user.user_id, course_id=course_id).first()
    try:
        if existing_review:
            existing_review.rating = rating; existing_review.comment = comment
            existing_review.review_date = datetime.utcnow()
            message = "Review updated."; review_to_return = existing_review; status_code = 200
        else:
            new_review = Review(user_id=current_user.user_id, course_id=course_id, rating=rating, comment=comment)
            db.session.add(new_review)
            message = "Review added."; review_to_return = new_review; status_code = 201
        db.session.commit()
        return success_response(message, data={'review': review_to_return.to_dict()}, status_code=status_code)
    except Exception as e:
        db.session.rollback(); current_app.logger.error(f"Error saving review: {e}", exc_info=True)
        return error_response("Error saving review.", 500)

@courses_bp.route("/<int:course_id>/review", methods=["GET"])
@token_required
def get_my_review(course_id):
    # (No changes needed here)
    current_user = g.current_user
    review = Review.query.filter_by(user_id=current_user.user_id, course_id=course_id).first()
    if review: return success_response("Review fetched.", data={'review': review.to_dict()})
    else: return success_response("No review found.", data={'review': None}, status_code=200)


@courses_bp.route("/<int:course_id>/reviews", methods=["GET"])
def get_course_reviews(course_id):
    # (No changes needed here)
    course = Course.query.get_or_404(course_id)
    reviews = Review.query.filter_by(course_id=course_id).order_by(Review.review_date.desc()).all()
    reviews_data = [review.to_dict() for review in reviews]
    return success_response("Fetched course reviews.", data={'reviews': reviews_data})


# --- NEW ROUTE: Course Enrollment Details (for Creator) ---
@courses_bp.route("/<int:course_id>/enrollment-details", methods=["GET"])
@token_required
def get_course_enrollment_details(course_id):
    """Fetches enrollment details for a specific course, intended for the course creator."""
    current_user = g.current_user
    course = Course.query.get_or_404(course_id)

    # Permission Check: Only creator can access this
    if course.creator_id != current_user.user_id:
        return error_response("Forbidden: You do not have permission to view these details.", 403)

    # --- Fetch Data ---
    # Enrollments with related User and Payment
    enrollments = Enrollment.query.options(
        joinedload(Enrollment.learner).joinedload(User.reviews), # Load learner and their reviews
        joinedload(Enrollment.payment)
    ).filter(Enrollment.course_id == course_id).all()

    # Calculate Stats
    total_users = len(enrollments)
    total_income = sum(e.payment.amount for e in enrollments if e.payment and e.payment.status == 'successful')
    average_rating = course.average_rating # Use property from Course model

    # Prepare User List
    enrolled_users_details = []
    for enrollment in enrollments:
        user = enrollment.learner
        if user:
            # Find the specific review for this course by this user
            user_review = next((r for r in user.reviews if r.course_id == course_id), None)

            enrolled_users_details.append({
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "time_spent_seconds": enrollment.time_spent_seconds, # Get from enrollment
                "rating": user_review.rating if user_review else None,
                "review_comment": user_review.comment if user_review else None,
                "enrollment_date": enrollment.enrollment_date.isoformat() + 'Z',
                "progress_percentage": enrollment.calculate_progress_percentage() # Add progress
            })

    # --- Prepare Response ---
    response_data = {
        "course_id": course.course_id,
        "course_title": course.course_title,
        "total_enrolled_users": total_users,
        "average_course_rating": average_rating,
        "total_income": round(total_income, 2),
        "enrollments": enrolled_users_details
    }

    return success_response("Enrollment details fetched successfully.", data=response_data)