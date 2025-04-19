from datetime import datetime
from app.extensions import db

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    __table_args__ = (db.UniqueConstraint('learner_id', 'course_id', name='uq_learner_course'),) # Ensure user enrolls only once

    enrollment_id = db.Column(db.Integer, primary_key=True)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)

    # --- NEW FIELDS for Progress Tracking ---
    lessons_completed = db.Column(db.Integer, default=0, nullable=False)
    # Placeholder for time tracking - needs dedicated mechanism to update accurately
    time_spent_seconds = db.Column(db.Integer, default=0, nullable=False)
    # progress = db.Column(db.Integer, default=0) # Removed old progress field

    # Foreign Keys
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.payment_id'), nullable=True, unique=True) # Nullable if enrollment is free or pending payment
    learner_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)

    # Relationships
    # One-to-One: Enrollment to Payment
    payment = db.relationship("Payment", back_populates="enrollment")
    # Many-to-One: Enrollment to User (Learner)
    learner = db.relationship("User", back_populates="enrollments")
    # Many-to-One: Enrollment to Course
    course = db.relationship("Course", back_populates="enrollments")

    def __repr__(self):
        return f'<Enrollment User ID:{self.learner_id} Course ID:{self.course_id}>'

    def calculate_progress_percentage(self):
        """Calculates progress percentage based on completed lessons."""
        if self.course:
            total_lessons = self.course.lessons.count() # Get total lessons in the course
            if total_lessons > 0:
                return round((self.lessons_completed / total_lessons) * 100)
        return 0 # Return 0 if no course or no lessons

    def to_dict(self):
        """Returns enrollment data including progress."""
        total_lessons = self.course.lessons.count() if self.course else 0
        progress_percentage = self.calculate_progress_percentage()

        return {
            'enrollment_id': self.enrollment_id,
            'enrollment_date': self.enrollment_date.isoformat() + 'Z',
            'learner_id': self.learner_id,
            'course_id': self.course_id,
            'payment_id': self.payment_id,
            # Progress Info
            'lessons_completed': self.lessons_completed,
            'total_lessons': total_lessons,
            'progress_percentage': progress_percentage,
            'time_spent_seconds': self.time_spent_seconds 
        }