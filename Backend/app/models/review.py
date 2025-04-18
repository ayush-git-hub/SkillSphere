from flask import current_app
from datetime import datetime
from app.extensions import db

class Review(db.Model):
    __tablename__ = 'reviews'
    __table_args__ = (db.UniqueConstraint('user_id', 'course_id', name='uq_user_course_review'),) # One review per user per course

    review_id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False) # e.g., 1 to 5 stars
    comment = db.Column(db.Text, nullable=True)
    review_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)

    # Relationships
    # Many-to-One: Review to User
    user = db.relationship("User", back_populates="reviews")
    # Many-to-One: Review to Course
    course = db.relationship("Course", back_populates="reviews")

    # Add a check constraint for rating if your DB supports it
    # __table_args__ = (db.CheckConstraint('rating >= 1 AND rating <= 5', name='rating_check'),) # Example for PostgreSQL

    def __repr__(self):
        return f'<Review User ID:{self.user_id} Course ID:{self.course_id} Rating:{self.rating}>'

    def to_dict(self):
        base_url = current_app.config.get('APP_BASE_URL', '')
        profile_image_url = None
        if self.user and self.user.profile_image_original:
            profile_image_url = f"{base_url}/api/general/media/images/profile_image/{self.user.profile_image_original}"

        return {
            'review_id': self.review_id,
            'rating': self.rating,
            'comment': self.comment,
            'review_date': self.review_date.isoformat() + 'Z',
            'user_id': self.user_id,
            'course_id': self.course_id,
            'user_name': self.user.name if self.user else None , # Optionally include user name
            'user_profile_image_original_url': profile_image_url,
            # 'user_profile_image_thumbnail_url': None, # Removed thumbnail
        }