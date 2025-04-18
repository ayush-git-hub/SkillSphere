from app.extensions import db
from app.services.minio_service import get_presigned_url # Import service function

class Lesson(db.Model):
    __tablename__ = 'lessons'

    lesson_id = db.Column(db.Integer, primary_key=True)
    lesson_title = db.Column(db.String(200), nullable=False)
    lesson_description = db.Column(db.Text, nullable=True)
    # Store filenames from MinIO, not links/URLs
    lesson_video_name = db.Column(db.String(500), nullable=True)
    lesson_assignment_name = db.Column(db.String(500), nullable=True)
    # lesson_order = db.Column(db.Integer, nullable=False) # REMOVED
    duration = db.Column(db.Integer, nullable=True, default=0) # Duration in seconds or minutes? Assume seconds.

    # Foreign Key
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)

    # Relationship
    # Many-to-One: Lesson to Course
    course = db.relationship("Course", back_populates="lessons")

    def __repr__(self):
        return f'<Lesson {self.lesson_title} (Course ID: {self.course_id})>'

    def to_dict(self, generate_urls=True):
        """Returns lesson data. Optionally generates presigned URLs."""
        data = {
            'lesson_id': self.lesson_id,
            'lesson_title': self.lesson_title,
            'lesson_description': self.lesson_description,
            # 'lesson_order': self.lesson_order, # REMOVED
            'duration': self.duration,
            'course_id': self.course_id
        }
        if generate_urls:
            data['lesson_video_url'] = get_presigned_url(self.lesson_video_name) if self.lesson_video_name else None
            data['lesson_assignment_url'] = get_presigned_url(self.lesson_assignment_name) if self.lesson_assignment_name else None
        else:
            # Include names if not generating URLs (useful for internal processing)
            data['lesson_video_name'] = self.lesson_video_name
            data['lesson_assignment_name'] = self.lesson_assignment_name
        return data