# BACKEND/app/models/course.py
from datetime import datetime
from app.extensions import db
from flask import current_app
from sqlalchemy import func # Import func for calculations

class Course(db.Model):
    __tablename__ = 'courses'

    course_id = db.Column(db.Integer, primary_key=True)
    course_title = db.Column(db.String(200), nullable=False)
    course_description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False, default=0.0)
    date_of_creation = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    thumbnail_filename = db.Column(db.String(500), nullable=True) # Store filename, not URL
    difficulty_level = db.Column(db.String(50), nullable=False)
    estimated_duration = db.Column(db.Integer, nullable=True, default=0) # Total seconds from lessons
    language = db.Column(db.String(50), nullable=False)

    # Foreign Keys
    creator_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)

    # Relationships
    creator = db.relationship("User", back_populates="created_courses")
    category = db.relationship("Category", back_populates="courses")
    enrollments = db.relationship('Enrollment', back_populates='course', lazy='dynamic', cascade="all, delete-orphan")
    # Order lessons by their ID for consistent display
    lessons = db.relationship('Lesson', back_populates='course', lazy='dynamic', order_by='Lesson.lesson_id', cascade="all, delete-orphan")
    reviews = db.relationship("Review", back_populates="course", lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Course {self.course_title}>'

    @property
    def thumbnail_url(self):
        if self.thumbnail_filename:
            base_url = current_app.config.get('APP_BASE_URL', '')
            # Ensure prefix and path match general route
            return f"{base_url}/api/general/media/images/course_thumbnail_image/{self.thumbnail_filename}"
        return None

    @property
    def total_lessons_count(self):
        # Efficiently count lessons using the dynamic relationship
        return self.lessons.count()

    @property
    def average_rating(self):
        """Calculates the average rating for the course."""
        # Avoid N+1 by doing calculation in DB if possible, or calculate here
        from app.models.review import Review # Local import to avoid circular dependency
        avg = db.session.query(func.avg(Review.rating)).filter(Review.course_id == self.course_id).scalar()
        return round(avg, 1) if avg is not None else 0.0

    def to_dict(self, include_lessons=False, include_creator=False, include_category=False, include_stats=False):
        data = {
            'course_id': self.course_id,
            'course_title': self.course_title,
            'course_description': self.course_description,
            'price': self.price,
            'date_of_creation': self.date_of_creation.isoformat() + 'Z',
            'updated_date': self.updated_date.isoformat() + 'Z',
            'thumbnail_url': self.thumbnail_url,
            'difficulty_level': self.difficulty_level,
            'estimated_duration_seconds': self.estimated_duration, # Renamed for clarity
            'language': self.language,
            'creator_id': self.creator_id,
            'category_id': self.category_id,
            'total_lessons_count': self.total_lessons_count, # Include total lesson count
        }
        if include_category and self.category:
            data['category_name'] = self.category.category_name
        if include_creator and self.creator:
            data['creator_name'] = self.creator.name
            # Optionally include creator's basic info if needed
            # data['creator'] = self.creator.to_dict() # Be careful about infinite recursion

        if include_lessons:
            # Generate URLs in the route usually, but can be done here if needed
            data['lessons'] = [lesson.to_dict(generate_urls=False) for lesson in self.lessons]

        if include_stats:
            data['average_rating'] = self.average_rating
            # Could add enrollment count here too
            # data['enrollment_count'] = self.enrollments.count()

        return data