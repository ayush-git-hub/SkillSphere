import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env file
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '..', '.env')) # Load .env from parent directory

# Define media folders relative to the app directory's parent
MEDIA_FOLDER = os.path.join(basedir, '..', 'media')
PROFILE_IMAGE_FOLDER = os.path.join(MEDIA_FOLDER, 'images', 'profile_image')
# THUMBNAIL_IMAGE_FOLDER removed
COURSE_THUMBNAIL_IMAGE_FOLDER = os.path.join(MEDIA_FOLDER, 'images', 'course_thumbnail_image') # Renamed folder

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_fallback_secret_key')
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///lms_default.db')

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'AyushChaurasia')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', 6000)))

    # Media Folders
    MEDIA_FOLDER = MEDIA_FOLDER
    PROFILE_IMAGE_FOLDER = PROFILE_IMAGE_FOLDER
    # THUMBNAIL_IMAGE_FOLDER attribute removed
    COURSE_THUMBNAIL_IMAGE_FOLDER = COURSE_THUMBNAIL_IMAGE_FOLDER # Updated attribute name
    # Ensure media directories exist
    os.makedirs(PROFILE_IMAGE_FOLDER, exist_ok=True)
    # os.makedirs(THUMBNAIL_IMAGE_FOLDER, exist_ok=True) # Removed
    os.makedirs(COURSE_THUMBNAIL_IMAGE_FOLDER, exist_ok=True) # Updated path

    # MinIO Configuration
    MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT')
    MINIO_ACCESS_KEY = os.environ.get('MINIO_ACCESS_KEY')
    MINIO_SECRET_KEY = os.environ.get('MINIO_SECRET_KEY')
    MINIO_BUCKET = os.environ.get('MINIO_BUCKET')
    MINIO_SECURE = os.environ.get('MINIO_SECURE', 'False').lower() == 'true'

    # App Base URL
    APP_BASE_URL = os.environ.get('APP_BASE_URL', 'http://localhost:8000')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = False # Set to True to see SQL queries


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False


# Dictionary to access configurations by name
config_by_name = dict(
    development=DevelopmentConfig,
    production=ProductionConfig,
    default=DevelopmentConfig
)