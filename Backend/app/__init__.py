# import os
# from flask import Flask
# from flask_cors import CORS

# from .config import config_by_name
# from .extensions import db, bcrypt
# from .services.minio_service import initialize_minio # Import minio initializer
# from .models import User, Course, Category, Lesson, Enrollment, Payment, Review

# def create_app(config_name=None):
#     """Application Factory Function"""
#     if config_name is None:
#         config_name = os.getenv('FLASK_ENV', 'default')

#     app = Flask(__name__)
#     app.config.from_object(config_by_name[config_name])

#     # Initialize extensions
#     db.init_app(app)
#     bcrypt.init_app(app)
#     CORS(app) # Enable CORS for all routes, configure origins in production

#     with app.app_context():
#         # Create database tables if they don't exist
#         # In production, use migrations (Flask-Migrate) instead of create_all
#         db.create_all()

#         # Initialize MinIO client after app context and config are ready
#         initialize_minio()

#         # Import and register blueprints
#         from .routes import auth_bp, users_bp, courses_bp, general_bp
#         # Adjust URL prefixes if needed
#         app.register_blueprint(auth_bp, url_prefix='/api/auth')
#         app.register_blueprint(users_bp, url_prefix='/api/users')
#         app.register_blueprint(courses_bp, url_prefix='/api/courses')
#         app.register_blueprint(general_bp, url_prefix='/api/general') # For categories, media serving etc.

#         # Optional: Add a simple health check endpoint
#         @app.route('/health')
#         def health_check():
#             return "OK", 200

#     # Configure logging (optional, Flask has basic logging)
#     # import logging
#     # if not app.debug:
#     #     # Configure production logging (e.g., RotatingFileHandler)
#     #     pass

#     return app

# BACKEND/app/__init__.py

import os
from flask import Flask
from flask_cors import CORS

# Import configurations and extensions
from .config import config_by_name
from .extensions import db, bcrypt
from .services.minio_service import initialize_minio # Import minio initializer

# Import models to ensure they are known to SQLAlchemy before create_all
# Although not strictly necessary for create_all if they are imported elsewhere
# (like in routes), it's good practice to have them accessible here.
from .models import User, Course, Category, Lesson, Enrollment, Payment, Review

def create_app(config_name=None):
    """
    Application Factory Function.
    Creates and configures the Flask application instance.
    """
    if config_name is None:
        # Get configuration name from environment variable or default to 'development'
        config_name = os.getenv('FLASK_ENV', 'development') # Changed default to development

    # Create the Flask app instance
    app = Flask(__name__, instance_relative_config=True) # instance_relative_config=True allows loading config from instance folder

    # Load configuration from the config object
    try:
        app.config.from_object(config_by_name[config_name])
        print(f" * Loading configuration: {config_name}")
    except KeyError:
        print(f" ! Configuration '{config_name}' not found. Using default.")
        app.config.from_object(config_by_name['default'])

    # Load configuration from instance folder if it exists (e.g., instance/config.py)
    # This can override settings from the default config object.
    # app.config.from_pyfile('config.py', silent=True)

    # Initialize Flask extensions
    db.init_app(app)
    bcrypt.init_app(app)

    # Enable CORS - configure allowed origins properly in production
    CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allow all origins for /api/* routes for development

    # Application context is necessary for operations like db.create_all() and initializing services
    with app.app_context():
        # Database Initialization:
        # In a production environment, use Flask-Migrate for managing database schema changes.
        # db.create_all() is suitable for development or initial setup.
        # Consider adding a check or command to handle migrations.
        try:
            db.create_all()
            print(" * Database tables checked/created.")
        except Exception as e:
            print(f" ! Error during db.create_all(): {e}")
            # Depending on the error, you might want to exit or log more details

        # Initialize MinIO client (requires app context for config)
        try:
            initialize_minio()
            # You could add a check here if minio_client is still None and log/warn
        except Exception as e:
             print(f" ! Error during MinIO initialization: {e}")


        # Import and register Blueprints for different parts of the API
        # Blueprints help organize routes. Prefixes define the base URL for routes within the blueprint.
        try:
            from .routes import auth_bp, users_bp, courses_bp, general_bp

            # Register blueprints with their respective URL prefixes
            app.register_blueprint(auth_bp, url_prefix='/api/auth')
            app.register_blueprint(users_bp, url_prefix='/api/users')
            app.register_blueprint(courses_bp, url_prefix='/api/courses')
            app.register_blueprint(general_bp, url_prefix='/api/general') # For categories, media serving etc.

            print(" * Blueprints registered successfully.")
        except ImportError as e:
             print(f" ! Error importing or registering blueprints: {e}")
             # This might indicate a structural problem or missing files.


        # Optional: Add a simple health check endpoint (outside /api prefix usually)
        @app.route('/health')
        def health_check():
            # Can add checks here (e.g., database connection)
            return "OK", 200

    # Configure logging further if needed (Flask provides basic logging)
    if not app.debug and not app.testing:
        # Example: Configure more robust logging for production
        # import logging
        # from logging.handlers import RotatingFileHandler
        # file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        # file_handler.setFormatter(logging.Formatter(
        #     '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        # ))
        # file_handler.setLevel(logging.INFO)
        # app.logger.addHandler(file_handler)
        # app.logger.setLevel(logging.INFO)
        # app.logger.info('Application startup')
        pass # Placeholder for production logging config


    # Return the configured app instance
    return app