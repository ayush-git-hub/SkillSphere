from flask import Blueprint

# Create Blueprint instances
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
users_bp = Blueprint('users', __name__, url_prefix='/users')
courses_bp = Blueprint('courses', __name__, url_prefix='/courses')
general_bp = Blueprint('general', __name__, url_prefix='/general') # For categories, file serving etc.

# Import routes to register them with the blueprints
# Do this *after* blueprint creation to avoid circular imports
from . import auth, users, courses, general