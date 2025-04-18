from flask import send_from_directory, current_app, request
from app.extensions import db
from app.models import Category
from app.utils.responses import success_response, error_response
from app.middleware.auth_middleware import token_required # Import if needed for category creation/admin
from . import general_bp
import os

@general_bp.route("/categories", methods=["GET"])
def get_categories():
    """Get all available course categories"""
    try:
        categories = Category.query.order_by(Category.category_name).all()
        categories_list = [category.to_dict() for category in categories]
        return success_response("Categories fetched successfully.", data={'categories': categories_list})
    except Exception as e:
        current_app.logger.error(f"Error fetching categories: {e}", exc_info=True)
        return error_response("Failed to fetch categories.", 500)


@general_bp.route("/categories", methods=["POST"])
@token_required # Consider restricting this to admin roles in a real app
def create_category():
    data = request.get_json()
    name = data.get('category_name')
    if not name:
        return error_response("Category name is required.", 400)
    if Category.query.filter(Category.category_name.ilike(name)).first(): # Case-insensitive check
        return error_response(f"Category '{name}' already exists.", 409) # Conflict

    try:
        new_category = Category(
            category_name=name,
            category_description=data.get('category_description')
        )
        db.session.add(new_category)
        db.session.commit()
        current_app.logger.info(f"Category created: {name} (ID: {new_category.category_id})")
        return success_response("Category created successfully.", data=new_category.to_dict(), status_code=201)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating category '{name}': {e}", exc_info=True)
        return error_response("Failed to create category.", 500)


@general_bp.route('/media/<path:subfolder>/<path:filename>')
def serve_media_file(subfolder, filename):
    """
    Serves files from the media directory (e.g., profile images, course thumbnails).
    Handles subfolders like 'images/profile_image' or 'images/course_thumbnail_image'.
    """
    # IMPORTANT: In production, this is highly inefficient.
    # Use Nginx or a dedicated CDN to serve static/media files directly.
    # This route is primarily for development convenience.

    # Basic security: prevent directory traversal
    if '..' in subfolder or subfolder.startswith('/') or '..' in filename or filename.startswith('/'):
        current_app.logger.warning(f"Potential directory traversal attempt: subfolder='{subfolder}', filename='{filename}'")
        return error_response("Invalid path.", 400)

    # Construct the full path to the media subfolder within the base MEDIA_FOLDER
    # subfolder is expected to be like 'images/profile_image'
    media_subfolder_path = os.path.normpath(os.path.join(current_app.config['MEDIA_FOLDER'], subfolder))

    # Security Check: Ensure the resolved path is still within the MEDIA_FOLDER
    if not media_subfolder_path.startswith(os.path.normpath(current_app.config['MEDIA_FOLDER'])):
        current_app.logger.error(f"Attempt to access file outside MEDIA_FOLDER: Resolved path '{media_subfolder_path}'")
        return error_response("Access denied.", 403)


    # Check if the subfolder exists
    if not os.path.isdir(media_subfolder_path):
         current_app.logger.info(f"Media directory not found: {media_subfolder_path}")
         return error_response("Directory not found.", 404)

    # Use send_from_directory for safer file serving
    # It expects the directory *containing* the file.
    try:
        # Double check file existence before sending
        file_path = os.path.join(media_subfolder_path, filename)
        if not os.path.isfile(file_path):
             current_app.logger.info(f"Media file not found: {file_path}")
             return error_response("File not found.", 404)

        current_app.logger.debug(f"Serving file: {filename} from directory: {media_subfolder_path}")
        return send_from_directory(media_subfolder_path, filename)
    except Exception as e:
        current_app.logger.error(f"Error serving media file '{filename}' from '{subfolder}': {e}", exc_info=True)
        return error_response("Could not serve file.", 500)

# Example usage in user.to_dict would generate URLs like:
# f"{current_app.config['APP_BASE_URL']}/api/general/media/images/profile_image/{self.profile_image_original}"
# Make sure the APP_BASE_URL and blueprint prefix match this structure.