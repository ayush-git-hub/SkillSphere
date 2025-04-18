# BACKEND/app/routes/users.py
import os
from flask import request, g, current_app
from sqlalchemy.orm import joinedload
from app.extensions import db, bcrypt
from app.models import User, Course, Enrollment, Review # Import necessary models
from app.utils.responses import success_response, error_response
from app.middleware.auth_middleware import token_required
from app.utils.image_processor import save_profile_image
from app.services.minio_service import delete_file_from_minio # Import delete function
from . import users_bp # Import the blueprint

@users_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    """Get current logged-in user's profile"""
    current_user = g.current_user
    return success_response("Profile fetched successfully.", data=current_user.to_dict())

# --- MODIFIED Route for Update ---
@users_bp.route("/profile/update", methods=["PUT"])
@token_required
def update_details():
    """
    Update user details (name, password, profile image).
    Expects multipart/form-data if image is included.
    """
    current_user = g.current_user
    # Use request.form for text fields, request.files for image
    data = request.form
    profile_image_file = request.files.get("profile_image")

    updated = False
    fields_to_update_on_user_object = {}
    new_image_filename = None
    old_image_filename = current_user.profile_image_original # Store old name for deletion

    # --- Handle Name Update ---
    if 'name' in data:
        new_name = data['name'].strip()
        if not new_name:
            return error_response("Name cannot be empty.", 400)
        if new_name != current_user.name:
            fields_to_update_on_user_object['name'] = new_name
            updated = True

    # --- Handle Password Update ---
    if 'password' in data and data['password']:
        new_password = data['password']
        if len(new_password) < 6:
            return error_response("New password must be at least 6 characters long.", 400)
        current_user.set_password(new_password)
        updated = True
        current_app.logger.info(f"Password hash updated for user ID {current_user.user_id}")

    # --- Handle Profile Image Update ---
    if profile_image_file:
        current_app.logger.info(f"Received new profile image for user {current_user.user_id}")
        # Save the new image (save_profile_image handles validation and saving)
        new_image_filename = save_profile_image(profile_image_file)
        if new_image_filename is None:
            current_app.logger.error(f"Profile image processing failed for user {current_user.user_id}")
            return error_response("Failed to process profile image.", 400)

        # Update the user model field (but don't commit yet)
        current_user.profile_image_original = new_image_filename
        updated = True
        current_app.logger.info(f"New profile image filename set for user {current_user.user_id}: {new_image_filename}")
    # --- End Profile Image Update ---

    # --- Handle Forbidden Fields ---
    if 'email' in data:
        return error_response("Email address cannot be changed via this endpoint.", 400)

    # --- Check if any valid changes were made ---
    if not updated:
         return error_response("No changes detected or no valid fields provided for update.", 400)

    # --- Apply updates and Commit ---
    try:
        # Apply direct field updates (like name)
        for field, value in fields_to_update_on_user_object.items():
             setattr(current_user, field, value)

        db.session.commit()
        current_app.logger.info(f"User profile updated successfully in DB for user ID {current_user.user_id}")

        # --- Clean up old image AFTER successful DB commit ---
        # Delete from local storage
        if new_image_filename and old_image_filename and new_image_filename != old_image_filename:
            old_image_path = os.path.join(current_app.config['PROFILE_IMAGE_FOLDER'], old_image_filename)
            if os.path.exists(old_image_path):
                try:
                    os.remove(old_image_path)
                    current_app.logger.info(f"Removed old local profile image: {old_image_path}")
                except OSError as e:
                    current_app.logger.error(f"Error removing old local profile image {old_image_path}: {e}")

            # --- Delete old image from MinIO (if using MinIO for profile pics) ---
            # Construct the object name based on how it's stored (e.g., just the filename)
            # Assuming profile images are stored directly in the bucket or a subfolder
            # minio_object_name = f"profile_images/{old_image_filename}" # Example if using a subfolder
            minio_object_name = old_image_filename # If stored at root of bucket
            if delete_file_from_minio(minio_object_name):
                 current_app.logger.info(f"Deleted old profile image from MinIO: {minio_object_name}")
            # else: # delete_file_from_minio logs errors
                 # pass

        # Return the updated user data
        # The to_dict method will generate the URL for the *new* image filename
        updated_user_data = current_user.to_dict()
        return success_response("Profile updated successfully.", data={'user': updated_user_data})

    except Exception as e:
        db.session.rollback() # Rollback in case of error during commit
        current_app.logger.error(f"Error during profile update commit for user ID {current_user.user_id}: {e}", exc_info=True)

        # If a new image was saved locally but DB commit failed, clean it up
        if new_image_filename:
            new_image_path = os.path.join(current_app.config['PROFILE_IMAGE_FOLDER'], new_image_filename)
            if os.path.exists(new_image_path):
                try:
                    os.remove(new_image_path)
                    current_app.logger.info(f"Cleaned up new local profile image due to DB error: {new_image_path}")
                except OSError as rm_err:
                     current_app.logger.error(f"Error removing new local file {new_image_path} after DB error: {rm_err}")
            # Also attempt cleanup from MinIO if it was uploaded before commit failed
            # delete_file_from_minio(new_image_filename) # Assuming filename is object name

        return error_response("Failed to update profile due to a server error.", 500)


# # --- NEW ROUTE: User Detail ---
# @users_bp.route("/<int:user_id>/details", methods=["GET"])
# @token_required # Protect this route, adjust permissions as needed
# def get_user_details(user_id):
#     """
#     Get complete details of a user, including personal details,
#     enrolled courses, and created courses.
#     Currently only accessible by the user themselves or potentially admins.
#     """
#     current_user = g.current_user

#     # --- Permission Check (Example: Allow self or admin) ---
#     # is_admin = False # Add admin role check logic if needed
#     if current_user.user_id != user_id: # and not is_admin:
#          return error_response("Forbidden: You can only view your own details.", 403)

#     # --- Fetch User ---
#     user = User.query.get(user_id)
#     if not user:
#         return error_response("User not found.", 404)

#     # --- Fetch Enrolled Courses ---
#     # Use joinedload to efficiently load related course and category
#     enrollments = Enrollment.query.options(
#         joinedload(Enrollment.course).joinedload(Course.category),
#         joinedload(Enrollment.course).joinedload(Course.creator) # Load creator too if needed
#     ).filter(Enrollment.learner_id == user_id).all()

#     enrolled_courses_list = []
#     for enrollment in enrollments:
#         if enrollment.course: # Ensure course exists
#             course_data = enrollment.course.to_dict(include_category=True, include_creator=True)
#             # Add enrollment specific details like progress to the course data for this context
#             course_data['enrollment_details'] = enrollment.to_dict() # Includes progress % etc.
#             enrolled_courses_list.append(course_data)

#     # --- Fetch Created Courses ---
#     created_courses = Course.query.options(
#         joinedload(Course.category) # Load category
#     ).filter(Course.creator_id == user_id).order_by(Course.updated_date.desc()).all()

#     created_courses_list = [
#         course.to_dict(include_category=True, include_stats=True) # Include avg rating maybe?
#         for course in created_courses
#     ]

#     # --- Prepare Response ---
#     response_data = {
#         "user": user.to_dict(), # Basic user details
#         "enrolled_courses": enrolled_courses_list,
#         "created_courses": created_courses_list
#     }

#     return success_response("User details fetched successfully.", data=response_data)


@users_bp.route("/<int:user_id>/details", methods=["GET"])
@token_required # Keep @token_required to ensure only logged-in users can access
def get_user_details(user_id):
    """
    Get complete details of a user, including personal details,
    enrolled courses, and created courses.
    Accessible by any logged-in user.
    """
    current_user = g.current_user # Still useful to know who is asking, maybe for logging

    # --- REMOVED/MODIFIED Permission Check ---
    # The original check prevented viewing other users' profiles.
    # If you need specific admin restrictions later, add them here.
    # if current_user.user_id != user_id: # and not is_admin:
    #      return error_response("Forbidden: You can only view your own details.", 403)
    # --- END REMOVED/MODIFIED CHECK ---

    # --- Fetch User ---
    # Use joinedload for efficiency when fetching the user's created courses/enrollments directly
    # if needed later, but the current implementation fetches them separately.
    user = User.query.get(user_id)
    if not user:
        current_app.logger.warning(f"User details request for non-existent user ID: {user_id}")
        return error_response("User not found.", 404)

    # --- Fetch Enrolled Courses (for the requested user_id) ---
    enrollments = Enrollment.query.options(
        joinedload(Enrollment.course).joinedload(Course.category),
        joinedload(Enrollment.course).joinedload(Course.creator)
    ).filter(Enrollment.learner_id == user_id).all() # Fetch for the user specified in URL

    enrolled_courses_list = []
    for enrollment in enrollments:
        if enrollment.course:
            course_data = enrollment.course.to_dict(include_category=True, include_creator=True)
            course_data['enrollment_details'] = enrollment.to_dict()
            enrolled_courses_list.append(course_data)

    # --- Fetch Created Courses (for the requested user_id) ---
    created_courses = Course.query.options(
        joinedload(Course.category)
    ).filter(Course.creator_id == user_id).order_by(Course.updated_date.desc()).all() # Fetch for the user specified in URL

    created_courses_list = [
        course.to_dict(include_category=True, include_stats=True)
        for course in created_courses
    ]

    # --- Prepare Response ---
    response_data = {
        "user": user.to_dict(), # Basic user details of the requested user
        # Ensure these lists contain courses relevant to the requested user_id, not current_user
        "enrolled_courses": enrolled_courses_list,
        "created_courses": created_courses_list
    }

    current_app.logger.info(f"User {current_user.user_id} successfully fetched details for user {user_id}")
    return success_response("User details fetched successfully.", data=response_data)
