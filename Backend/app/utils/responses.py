from flask import jsonify

def success_response(message, data=None, status_code=200):
    """Creates a standardized success JSON response."""
    response = {
        "success": True,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code

def error_response(message, status_code=400):
    """Creates a standardized error JSON response."""
    response = {
        "success": False,
        "message": message
    }
    return jsonify(response), status_code