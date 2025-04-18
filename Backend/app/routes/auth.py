import jwt
from datetime import datetime, timedelta, timezone # Use timezone-aware datetime
from flask import request, current_app, g
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models import User
from app.utils.responses import success_response, error_response
from app.utils.image_processor import save_profile_image
from . import auth_bp # Import the blueprint instance

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """User Signup Endpoint"""
    # Use request.form for multipart/form-data which includes files
    data = request.form
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    profile_image_file = request.files.get("profile_image") # Get file from request.files

    if not name or not email or not password:
        return error_response("Name, email, and password are required.", 400)

    # Basic email validation (consider using a library like email-validator for robust check)
    if '@' not in email or '.' not in email:
        return error_response("Invalid email format.", 400)

    if len(password) < 6: # Example minimum password length
        return error_response("Password must be at least 6 characters long.", 400)

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return error_response(f"User with email '{email}' already exists.", 400)

    # Handle profile image upload
    original_filename = None # Only need original filename now
    if profile_image_file:
        original_filename = save_profile_image(profile_image_file) # Expects single return value
        if original_filename is None:
             # save_profile_image handles logging, return generic error
             current_app.logger.error(f"Signup failed for {email}: Profile image processing error.")
             return error_response("Failed to process profile image.", 400)
        else:
             current_app.logger.info(f"Profile image received and processed for signup: {original_filename}")


    try:
        new_user = User(
            name=name,
            email=email,
            profile_image_original=original_filename
            # profile_image_thumbnail removed
        )
        new_user.set_password(password) # Hash password

        db.session.add(new_user)
        db.session.commit()
        current_app.logger.info(f"User signed up successfully: {email} (ID: {new_user.user_id})")

        # Optionally generate a token immediately upon signup
        # token = _generate_jwt_token(new_user.user_id)

        return success_response(
            "User signed up successfully.",
            data={'user': new_user.to_dict()}, # Use to_dict method
            status_code=201 # 201 Created
        )

    except IntegrityError as e:
        db.session.rollback()
        # This might happen due to race conditions if the email check passed but insert failed
        current_app.logger.error(f"Database integrity error during signup for {email}: {e}")
        return error_response("Could not create user due to a database conflict.", 409) # 409 Conflict
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during signup for {email}: {e}", exc_info=True)
        return error_response("An unexpected error occurred during signup.", 500)


@auth_bp.route("/login", methods=["POST"])
def login():
    """User Login Endpoint"""
    data = request.get_json()
    if not data:
        return error_response("Request body must be JSON.", 400)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return error_response("Email and password are required.", 400)

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        # Password matches, generate JWT token
        token = _generate_jwt_token(user.user_id)
        current_app.logger.info(f"User login successful: {email} (ID: {user.user_id})")
        return success_response(
            "Login successful.",
            data={
                'token': token,
                'user': user.to_dict() # Return user info as well
            },
            status_code=200
        )
    else:
        # Invalid credentials (user not found or password incorrect)
        current_app.logger.warning(f"Failed login attempt for email: {email}")
        return error_response("Invalid email or password.", 401) # 401 Unauthorized

# --- Helper Function ---
def _generate_jwt_token(user_id):
    """Generates a JWT token for a given user ID."""
    try:
        payload = {
            'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'iat': datetime.now(timezone.utc),
            'sub': str(user_id) # Subject of the token is the user ID
        }
        token = jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        return token
    except Exception as e:
        current_app.logger.error(f"Error generating JWT token for user ID {user_id}: {e}", exc_info=True)
        return None # Or raise an exception