from datetime import datetime
from app.extensions import db

class Payment(db.Model):
    __tablename__ = 'payments'

    payment_id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    date_of_payment = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.String(50), nullable=True) # e.g., 'stripe', 'razorpay', 'manual'
    transaction_id = db.Column(db.String(200), unique=True, nullable=True, index=True) # Can be null if not applicable immediately
    status = db.Column(db.String(50), nullable=False, default='pending') # e.g., 'pending', 'successful', 'failed'

    # Foreign Key
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)

    # Relationships
    # Many-to-One: Payment to User
    user = db.relationship("User", back_populates="payments")
    # One-to-One: Payment to Enrollment (can be established after payment confirmation)
    enrollment = db.relationship('Enrollment', back_populates='payment', uselist=False)

    def __repr__(self):
        return f'<Payment ID:{self.payment_id} User ID:{self.user_id} Amount:{self.amount}>'

    def to_dict(self):
        return {
            'payment_id': self.payment_id,
            'amount': self.amount,
            'date_of_payment': self.date_of_payment.isoformat() + 'Z',
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'status': self.status,
            'user_id': self.user_id,
            'enrollment_id': self.enrollment.enrollment_id if self.enrollment else None
        }