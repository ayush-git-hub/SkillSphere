from flask import Blueprint

# Create Blueprint instances
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
users_bp = Blueprint('users', __name__, url_prefix='/users')
courses_bp = Blueprint('courses', __name__, url_prefix='/courses')
general_bp = Blueprint('general', __name__, url_prefix='/general') # For categories, file serving etc.

from . import auth, users, courses, general