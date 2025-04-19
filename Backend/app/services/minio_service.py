import logging
from minio import Minio
from minio.error import S3Error
from datetime import timedelta
from flask import current_app
import io
import tempfile
import os

try:
    from moviepy.editor import VideoFileClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    logging.warning("moviepy not installed. Video duration calculation disabled.")


# Configure logging
logger = logging.getLogger(__name__) # Use Flask's logger



minio_client = None



def initialize_minio():
    """Initializes the MinIO client using app config."""
    global minio_client
    if minio_client is None and current_app: 
        try:
            config = current_app.config
            if not all(k in config for k in ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET']):
                 logger.error("MinIO configuration missing in Flask app config.")
                 return

            minio_client = Minio(
                endpoint=config['MINIO_ENDPOINT'],
                access_key=config['MINIO_ACCESS_KEY'],
                secret_key=config['MINIO_SECRET_KEY'],
                secure=config.get('MINIO_SECURE', False) 
            )
            # Ensure bucket exists
            bucket_name = config['MINIO_BUCKET']
            found = minio_client.bucket_exists(bucket_name)
            if not found:
                minio_client.make_bucket(bucket_name)
                logger.info(f"MinIO Bucket '{bucket_name}' created.")
            else:
                logger.info(f"MinIO Bucket '{bucket_name}' already exists.")
        except S3Error as e:
            logger.error(f"MinIO S3 Error during initialization: {e}")
            minio_client = None # Reset client on error
        except Exception as e:
            logger.error(f"Failed to initialize MinIO client: {e}", exc_info=True)
            minio_client = None # Reset client on error
    elif minio_client is None:
        logger.warning("initialize_minio called outside of Flask app context or MinIO disabled.")



def get_minio_client():
    """Returns the initialized MinIO client. Tries to initialize if needed."""
    if minio_client is None:
         logger.warning("Attempting to get MinIO client before explicit initialization. Trying now...")
         initialize_minio() 
    if minio_client is None:
        logger.error("MinIO client is not configured or failed to initialize.")
    return minio_client



def upload_file_to_minio(file_stream, object_name, content_type, bucket_name=None):
    """Uploads a file stream to MinIO."""
    client = get_minio_client()
    if not client:
        logger.error("MinIO client not available for upload.")
        return None

    target_bucket = bucket_name or current_app.config.get('MINIO_BUCKET')
    if not target_bucket:
        logger.error("MINIO_BUCKET not configured.")
        return None

    try:
        # Ensure stream is at the beginning before getting length and uploading
        file_stream.seek(0, io.SEEK_SET)
        # Get length without consuming stream if possible, fallback to seek/tell
        try:
            length = file_stream.seek(0, io.SEEK_END)
            file_stream.seek(0, io.SEEK_SET) # Reset stream position
        except (AttributeError, io.UnsupportedOperation):
            # For streams that don't support seek/tell (like request streams sometimes)
            # Read into memory - Use with caution for large files!
            logger.warning(f"Stream for {object_name} doesn't support seek. Reading into memory.")
            data = file_stream.read()
            length = len(data)
            file_stream = io.BytesIO(data) # Replace stream with BytesIO

        if length == 0:
             logger.warning(f"Attempted to upload zero-byte file: {object_name}")
             # Decide if zero-byte files are allowed or should be an error
             # return None # Uncomment to prevent zero-byte uploads

        client.put_object(
            target_bucket,
            object_name,
            file_stream,
            length=length,
            content_type=content_type,
        )
        logger.info(f"Successfully uploaded '{object_name}' to bucket '{target_bucket}'.")
        return object_name # Return the object name (filename) on success
    except S3Error as e:
        logger.error(f"MinIO S3 Error uploading '{object_name}': {e}")
        return None
    except Exception as e:
        logger.error(f"Error uploading file '{object_name}' to MinIO: {e}", exc_info=True)
        return None



def delete_file_from_minio(object_name, bucket_name=None):
    """Deletes a file from MinIO."""
    client = get_minio_client()
    if not client:
        logger.error("MinIO client not available for deletion.")
        return False
    if not object_name:
        logger.warning("Attempted to delete file with empty object name.")
        return False

    target_bucket = bucket_name or current_app.config.get('MINIO_BUCKET')
    if not target_bucket:
        logger.error("MINIO_BUCKET not configured for deletion.")
        return False

    try:
        client.remove_object(target_bucket, object_name)
        logger.info(f"Successfully deleted '{object_name}' from bucket '{target_bucket}'.")
        return True
    except S3Error as e:
        # Handle 'NoSuchKey' gracefully if needed (file already deleted)
        if e.code == 'NoSuchKey':
            logger.warning(f"File '{object_name}' not found in bucket '{target_bucket}' for deletion (already deleted?).")
            return True # Treat as success if file doesn't exist
        logger.error(f"MinIO S3 Error deleting '{object_name}': {e}")
        return False
    except Exception as e:
        logger.error(f"Error deleting file '{object_name}' from MinIO: {e}", exc_info=True)
        return False

def get_presigned_url(object_name, expires_hours=24, bucket_name=None):
    """Generates a presigned URL for a MinIO object."""
    client = get_minio_client()
    if not client or not object_name:
        # Log only if an object name was expected but client is missing
        if object_name:
            logger.warning(f"Cannot generate presigned URL for '{object_name}'. MinIO client not available.")
        return None # Return None if client not ready or no object name

    target_bucket = bucket_name or current_app.config.get('MINIO_BUCKET')
    if not target_bucket:
        logger.error("MINIO_BUCKET not configured for presigned URL generation.")
        return None

    try:
        url = client.presigned_get_object(
            target_bucket,
            object_name,
            expires=timedelta(hours=expires_hours)
        )
        # logger.debug(f"Generated presigned URL for '{object_name}'") # Debug log if needed
        return url
    except S3Error as e:
        logger.error(f"MinIO S3 Error generating presigned URL for '{object_name}': {e}")
        return None
    except Exception as e:
       logger.error(f"Error generating presigned URL for '{object_name}': {e}", exc_info=True)
       return None



def get_video_duration(video_file_storage):
    """Calculates video duration using moviepy. Returns duration in seconds."""
    if not MOVIEPY_AVAILABLE:
        logger.warning("Cannot calculate video duration, moviepy not installed.")
        return 0 # Return 0 or None based on how you handle missing duration

    duration = 0
    temp_video_path = None
    try:
        # Save FileStorage to a temporary file
        # Use a secure directory if possible, default temp dir might have issues
        temp_dir = tempfile.gettempdir()
        temp_file_suffix = os.path.splitext(video_file_storage.filename)[1] or '.mp4'
        temp_fd, temp_video_path = tempfile.mkstemp(suffix=temp_file_suffix, dir=temp_dir)
        os.close(temp_fd) # Close file descriptor

        # Save the file stream to the temp path
        video_file_storage.save(temp_video_path)
        video_file_storage.stream.seek(0) # Reset stream for potential later use (e.g., upload)
        logger.debug(f"Video saved to temporary file: {temp_video_path}")

        # Calculate duration using moviepy
        with VideoFileClip(temp_video_path) as clip:
            duration = int(clip.duration) # Duration in seconds
            logger.info(f"Calculated video duration for {video_file_storage.filename}: {duration} seconds")

    except Exception as e:
        logger.error(f"Error calculating video duration for {video_file_storage.filename}: {e}", exc_info=True)
        duration = 0 # Default to 0 on error
    finally:
        # Clean up temporary file
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
                logger.debug(f"Removed temporary video file: {temp_video_path}")
            except OSError as e:
                logger.error(f"Error removing temporary video file {temp_video_path}: {e}")

    return duration