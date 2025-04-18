import jwt
from functools import wraps
from flask import request, g, current_app 
from app.models.user import User 
from app.utils.responses import error_response 

# Decorator function to protect routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            # Standard format is "Bearer <token>"
            parts = auth_header.split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            else:
                # Log the incorrect format for debugging
                current_app.logger.warning(f"Invalid Authorization header format received: {auth_header}")
                return error_response("Invalid Authorization header format. Use 'Bearer <token>'.", 401)

        if not token:
            current_app.logger.warning("Token is missing from request.")
            return error_response("Token is missing.", 401)

        try:
            # Get the secret key from the application config
            secret_key_used = current_app.config.get('JWT_SECRET_KEY')
            if not secret_key_used:
                 # This should not happen if config is loaded correctly, but good to check
                 current_app.logger.error("JWT_SECRET_KEY is not configured in the application!")
                 return error_response("Server configuration error.", 500)

            # Log the token being verified (partially for security) and the key being used (partially)
            current_app.logger.info(f"Middleware attempting to verify token (first 10 chars): {token[:10]}...")
            # Avoid logging the full key in production logs if possible
            # Log first 5 characters for debugging identification
            current_app.logger.debug(f"Middleware using Secret Key (first 5 chars): {secret_key_used[:5]}...")

            # Decode the token using the secret key and HS256 algorithm
            # This step now expects 'sub' to be a string (fixed in token generation)
            data = jwt.decode(
                token,
                secret_key_used,
                algorithms=["HS256"]
            )
            current_app.logger.info(f"Middleware token DECODED successfully. Payload 'sub': {data.get('sub')}")

            # --- FIX APPLIED HERE ---
            # Get the subject (user ID) from the token payload, which should now be a string.
            user_id_str = data.get('sub')
            if not user_id_str:
                 current_app.logger.error(f"Token payload is missing 'sub' (user ID). Payload: {data}")
                 return error_response("Token payload invalid.", 401)

            try:
                # Convert the string user ID back to an integer for database lookup.
                user_id = int(user_id_str)
            except ValueError:
                # Handle case where 'sub' claim is unexpectedly not a valid integer string.
                current_app.logger.error(f"Could not convert 'sub' claim ('{user_id_str}') to integer.")
                return error_response("Invalid user identifier in token.", 401)
            # -----------------------

            # Find the user in the database using the integer user ID.
            current_user = User.query.get(user_id)
            if not current_user:
                 current_app.logger.warning(f"User with ID {user_id} from token not found in database.")
                 return error_response("User not found for the provided token.", 401)

            # Make the user object available globally for this request via Flask's 'g' object
            g.current_user = current_user
            current_app.logger.info(f"Authenticated user set in g: User ID {current_user.user_id}, Email {current_user.email}")

        except jwt.ExpiredSignatureError:
            current_app.logger.warning(f"Middleware caught EXPIRED token: {token[:10]}...")
            return error_response("Token has expired. Please log in again.", 401)
        except jwt.InvalidTokenError as e:
             # Catches various JWT validation errors, including signature mismatch, incorrect format, etc.
             # The "Subject must be a string" error should no longer happen if the token generation fix is applied.
             current_app.logger.error(f"Middleware caught INVALID TOKEN error: {e}. Token: {token[:10]}...")
             # Providing the specific error 'e' can be helpful for debugging other JWT issues.
             return error_response(f"Token is invalid: {e}", 401)
        except Exception as e:
            # Catch any other unexpected errors during token verification or user lookup
            current_app.logger.error(f"Middleware caught UNEXPECTED verification error: {e}", exc_info=True) # Log full traceback
            return error_response("Token verification failed.", 500)

        # If token is valid and user found, proceed with the original route function
        return f(*args, **kwargs)

    return decorated