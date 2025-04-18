from datetime import datetime
from app.extensions import db, bcrypt
from flask import current_app # Import moved here

class User(db.Model):
    __tablename__ = 'users' # Explicit table name is good practice

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False) # Store hash, not plain password
    profile_image_original = db.Column(db.String(255), nullable=True) # Store filename/path
    # profile_image_thumbnail = db.Column(db.String(255), nullable=True) # Removed thumbnail column
    date_of_joining = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    # One-to-Many: User (creator) to Course
    created_courses = db.relationship("Course", back_populates='creator', foreign_keys='Course.creator_id')
    # One-to-Many: User (learner) to Enrollment
    enrollments = db.relationship('Enrollment', back_populates='learner', foreign_keys='Enrollment.learner_id')
    # One-to-Many: User to Review
    reviews = db.relationship('Review', back_populates='user', foreign_keys='Review.user_id')
    # One-to-Many: User to Payment
    payments = db.relationship('Payment', back_populates='user', foreign_keys='Payment.user_id')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self, include_sensitive=False):
        """Returns user data as a dictionary."""
        # Need current_app context for config access in to_dict, import locally inside function is fine
        # Or ensure called within app context
        # from flask import current_app
        base_url = current_app.config.get('APP_BASE_URL', '')
        profile_image_url = None
        if self.profile_image_original:
             # Construct URL using the single profile image folder
             profile_image_url = f"{base_url}/api/general/media/images/profile_image/{self.profile_image_original}"

        data = {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'profile_image_original_url': profile_image_url,
            # 'profile_image_thumbnail_url': None, # Removed thumbnail URL
            'date_of_joining': self.date_of_joining.isoformat() + 'Z', # ISO 8601 format
        }
        # Never include password hash by default
        return data