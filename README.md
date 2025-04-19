# SkillSphere

Skillsphere is a platform where users can create their own courses and learn from those created by others.

## 1. Overview

This project implements a Learning Management System (LMS) featuring a Python/Flask backend API and a React/Tailwind CSS frontend (specification). It allows users to register, create courses, enroll in courses, manage lessons (including video and assignment uploads), track progress, and leave reviews.

The backend provides a RESTful API for all core functionalities, utilizes a relational database (configurable, PostgreSQL recommended), integrates with MinIO for object storage of large media files, and employs JWT for secure authentication.

## 2. Features

*   **User Management:**
    *   User Registration (Signup) with optional profile picture.
    *   User Login with JWT-based authentication.
    *   User Profile Viewing and Updating (name, password, profile picture).
    *   View detailed user information (profile, enrolled/created courses).
*   **Course Management (Creators):**
    *   Create new courses with title, description, price, category, thumbnail, difficulty, etc.
    *   Update existing course details.
    *   Delete courses.
    *   Manage course categories (Create/List).
    *   View courses created by the user.
    *   View creator analytics (enrollment stats, income, ratings, user progress).
*   **Lesson Management (Creators):**
    *   Add lessons (title, description, video, assignment) to courses.
    *   Update lesson details, including replacing video/assignment files.
    *   Delete lessons.
    *   Video duration automatically calculated on upload.
*   **Course Discovery & Enrollment (Learners):**
    *   Explore available courses.
    *   View detailed course information before enrolling.
    *   Enroll in courses (basic payment placeholder included).
    *   View enrolled courses with progress overview.
*   **Learning & Progress Tracking (Learners):**
    *   Access course content (lessons, videos, assignments) via secure, temporary URLs.
    *   Mark lessons as complete (**Note:** Current implementation requires review for idempotency).
    *   Track time spent on courses.
*   **Reviews & Ratings (Learners):**
    *   Add/Update ratings and comments for enrolled courses.
    *   View all reviews for a course.
*   **Content Delivery:**
    *   Secure serving of local media (profile pics, thumbnails) via dedicated endpoint.
    *   Secure, direct access to lesson files (videos, assignments) from MinIO using presigned URLs.

## 3. Technology Stack

### 3.1. Backend (Implemented)

*   **Programming Language:** Python (3.x)
*   **Web Framework:** Flask (with Blueprints for modularity)
*   **Database ORM:** SQLAlchemy
*   **Database:** Configurable (PostgreSQL recommended, SQLite default for dev) - *Schema is 3NF compliant.*
*   **Authentication:** JWT (PyJWT) for stateless tokens, Bcrypt (Flask-Bcrypt) for password hashing.
*   **Object Storage:** MinIO (S3-Compatible, managed via `minio-py`) for lesson videos/assignments.
*   **Containerization:** Docker & Docker Compose (Used for running MinIO service).
*   **API Design:** RESTful, JSON data interchange (+ `multipart/form-data` for uploads).
*   **CORS Handling:** Flask-CORS.
*   **Video Processing:** Moviepy (Optional, for video duration).
*   **Environment Management:** `.env` files (python-dotenv).
*   **WSGI Server (Production):** Gunicorn or uWSGI (Recommended).

### 3.2. Frontend (Specified)

*   **Core Library:** React (Latest Version, e.g., 18+)
*   **Styling:** Tailwind CSS (v3, Utility-First).
*   **Language:** JavaScript (ES6+) or TypeScript (Recommended).
*   **Package Manager:** npm or yarn.
*   **Build Tool:** Vite (Recommended).
*   **Routing:** React Router.
*   **State Management:** React Context API / Redux Toolkit / Zustand / etc.
*   **API Communication:** Fetch API or Axios.
*   **Form Handling:** React Hook Form / Formik (Recommended).
*   **Component Libraries (Optional):** Headless UI / Radix UI / Shadcn/ui / Material UI / etc.
*   **Testing:** Jest / React Testing Library / Cypress / Playwright (Recommended).

## 4. Architecture & Design Notes

*   **Backend Structure:** Uses Flask's Application Factory pattern (`create_app`). API routes are organized into modular Blueprints (`auth`, `users`, `courses`, `general`).
*   **API Design:** Follows REST principles. Standardized JSON responses are used.
*   **Database:** Uses SQLAlchemy for ORM. The schema is compliant with Third Normal Form (3NF).
*   **Object Storage (MinIO):** Integrated via `app/services/minio_service.py`, handles connections, uploads, deletes, and presigned URLs. Managed via Docker Compose.
*   **Containerization (Docker):** Docker Compose (`docker-compose.yaml`) runs the MinIO service in an isolated container with persistent storage (`./minio_storage` volume).
*   **Authentication Flow:** Standard JWT Bearer token flow. `@token_required` middleware validates tokens.
*   **Media Handling:** Local media (profile pics, thumbnails) saved locally and served via API. Lesson files uploaded to MinIO, accessed via presigned URLs.

## 5. Getting Started - Development Setup

### 5.1. Prerequisites

*   Python (3.8+ recommended) & pip
*   Node.js (LTS, e.g., 18.x or 20.x) & npm (or yarn)
*   Docker & Docker Compose
*   Git
*   Text Editor/IDE (e.g., VS Code)

### 5.2. Backend Setup (Flask API)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ayush-git-hub/SkillSphere.git
    cd SkillSphere/BACKEND
    ```

2.  **Create & Activate Python Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
    *(Prompt should show `(venv)` prefix)*

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables (`.env` file):**
    *   Create a file named `.env` in the `BACKEND` directory.
    *   Populate it with necessary settings.

    ```dotenv
    FLASK_APP=run.py
    FLASK_ENV=development
    SECRET_KEY=your_strong_random_secret_key
    JWT_SECRET_KEY=your_strong_random_jwt_secret
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES=600

    SQLALCHEMY_DATABASE_URI=postgresql://lmsuser:lmspassword@localhost:5432/lmsdb

    MINIO_ENDPOINT=localhost:9000
    MINIO_ACCESS_KEY=admin
    MINIO_SECRET_KEY=adminpassword
    MINIO_BUCKET=lmsbucket
    MINIO_SECURE=False
    MINIO_ENDPOINT_PORT=9000

    APP_BASE_URL=http://localhost:8000
    ```
    **Important:** Change secrets. Ensure the PostgreSQL database (`lmsdb` owned by `lmsuser` in the example) exists, or configure for SQLite (`SQLALCHEMY_DATABASE_URI=sqlite:///../instance/lms.db`).

5.  **Start MinIO Service (using Docker):**
    *   Ensure Docker Daemon is running.
    *   In the `BACKEND` directory:
    ```bash
    docker-compose up -d
    ```
    *   Data persists in `./minio_storage`. Console: `http://localhost:9001`.

6.  **Initialize Database:**
    *   The first run of the Flask app should create tables via `db.create_all()`.
    *   Ensure the target database exists if using PostgreSQL.
    *   **Note:** Use Flask-Migrate for production/migrations.

7.  **Run the Backend Server:**
    ```bash
    flask run --host=0.0.0.0 --port=8000
    ```
    *   Backend API runs at `http://localhost:8000`.

### 5.3. Frontend Setup (React + Tailwind)

1.  **Navigate to Frontend Project:**
    ```bash
    cd ../FRONTEND # Assuming FRONTEND dir is sibling to BACKEND
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Backend API URL:**
    *   The base URL for the backend API is configured in the file `src/config/apiConfig.js`.
    *   Modify the `API_BASE_URL` constant in this file if your backend is running on a different URL.

    ```javascript
    // Example content of src/config/apiConfig.js
    export const API_BASE_URL = 'http://localhost:8000/api';
    ```
    *   Import `API_BASE_URL` from this file wherever you make API calls in your frontend code.

4.  **Run the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    *   Frontend runs at `http://localhost:5173`.

## 6. Running the Full Application

1.  **Start MinIO:** `docker-compose up -d` (in `BACKEND` directory, if not running).
2.  **Start Backend:** Open a terminal, navigate to `BACKEND`, activate `venv`, run `flask run --host=0.0.0.0 --port=8000`.
3.  **Start Frontend:** Open a *separate* terminal, navigate to `FRONTEND`, run `npm run dev`.
4.  **Access:** Open your browser to `http://localhost:5173`.

## 7. API Endpoints Overview

The backend exposes a RESTful API under the `/api` prefix.

*   `/api/auth/`: Signup, Login.
*   `/api/users/`: Profile management, User details.
*   `/api/courses/`: Course & Lesson CRUD, enrollment, progress, reviews, discovery, analytics.
*   `/api/general/`: Category management, local media serving.

Refer to route files in `BACKEND/app/routes/` for details.

## 8. Contributors

*   Anshuman
*   Ayush Chaurasia
*   Manveer Anand
*   Pawan Meena
*   Solanki Kuldip
