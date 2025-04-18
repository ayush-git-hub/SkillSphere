import os
from dotenv import load_dotenv

# Load environment variables from .env file before importing the app
# Useful especially for configurations needed before app creation
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    print("Warning: .env file not found.")


# Now import the app factory
from app import create_app

# Get config name from environment or use default
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

if __name__ == "__main__":
    # Use host='0.0.0.0' to make it accessible externally (e.g., from Docker)
    port = int(os.environ.get("PORT", 8000)) # Use PORT env var if set, else default
    app.run(host='0.0.0.0', port=port)