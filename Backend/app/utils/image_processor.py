import os
import uuid
from PIL import Image
from werkzeug.utils import secure_filename
from flask import current_app



ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}



def allowed_file(filename):
    """Checks if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



def save_profile_image(image_file):
    """
    Saves the original profile image.
    Returns the original_filename or None on failure.
    """
    if not image_file or not allowed_file(image_file.filename):
        current_app.logger.warning("Profile image save failed: No file or disallowed extension.")
        return None

    try:
        filename = secure_filename(image_file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        unique_id = uuid.uuid4().hex
        original_filename = f"{unique_id}_original.{ext}"

        original_path = os.path.join(current_app.config['PROFILE_IMAGE_FOLDER'], original_filename)

        # Save original image
        # Ensure the stream is rewound before saving if it was read previously
        image_file.stream.seek(0)
        image_file.save(original_path)
        current_app.logger.info(f"Profile image saved to: {original_path}")

        return original_filename 
    except Exception as e:
        current_app.logger.error(f"Error processing profile image: {e}", exc_info=True)
        # Clean up potentially partially saved files if needed
        if 'original_path' in locals() and os.path.exists(original_path):
            try:
                os.remove(original_path)
                current_app.logger.info(f"Cleaned up partially saved profile image: {original_path}")
            except OSError as rm_err:
                current_app.logger.error(f"Error removing partially saved file {original_path}: {rm_err}")
        return None



def save_course_thumbnail(image_file):
    """
    Saves the course thumbnail image to the course_thumbnail_image folder.
    Returns the filename or None on failure.
    """
    if not image_file or not allowed_file(image_file.filename):
        current_app.logger.warning("Course thumbnail save failed: No file or disallowed extension.")
        return None

    try:
        filename = secure_filename(image_file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        unique_id = uuid.uuid4().hex
        thumbnail_filename = f"course_{unique_id}.{ext}"
        # Use the renamed config key for the save path
        save_path = os.path.join(current_app.config['COURSE_THUMBNAIL_IMAGE_FOLDER'], thumbnail_filename)

        # Save original size if no resizing
        # Ensure stream is rewound
        image_file.stream.seek(0)
        image_file.save(save_path)
        current_app.logger.info(f"Course thumbnail saved to: {save_path}")


        return thumbnail_filename
    except Exception as e:
        current_app.logger.error(f"Error processing course thumbnail: {e}", exc_info=True)
        if 'save_path' in locals() and os.path.exists(save_path):
            try:
                os.remove(save_path)
                current_app.logger.info(f"Cleaned up partially saved course thumbnail: {save_path}")
            except OSError as rm_err:
                 current_app.logger.error(f"Error removing partially saved file {save_path}: {rm_err}")
        return None