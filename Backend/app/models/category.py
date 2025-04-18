from app.extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), nullable=False, unique=True)
    category_description = db.Column(db.Text, nullable=True)

    # One-to-Many: Category to Course
    courses = db.relationship("Course", back_populates='category', lazy='dynamic') 

    def __repr__(self):
        return f'<Category {self.category_name}>'

    def to_dict(self):
        return {
            'category_id': self.category_id,
            'category_name': self.category_name,
            'category_description': self.category_description
        }