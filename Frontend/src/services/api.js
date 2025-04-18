// FRONTEND/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig'; // Your API base URL config

// Function to get the token from local storage
const getAuthToken = () => localStorage.getItem('authToken');

// Create an Axios instance with default headers
const apiClient = axios.create({
    baseURL: API_BASE_URL, // Should be 'http://localhost:8000/api' or similar
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token dynamically
apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper function to handle API responses and errors
const handleResponse = (response) => {
    // Check if the response has data and a success flag
    if (response.data && response.data.success) {
        // Return the nested 'data' field on success
        // This is the crucial part for consistency
        return response.data.data;
    } else {
        // Handle cases where success is false or structure is unexpected
        const message = response.data?.message || 'An unknown error occurred';
        const error = new Error(message);
        error.status = response.status;
        // Include backend data if available
        if (response.data) {
            error.data = response.data;
        }
        throw error;
    }
};

const handleError = (error) => {
    if (error.response) {
        console.error('API Error Response:', error.response.data);
        const message = error.response.data?.message || `Request failed with status code ${error.response.status}`;
        const apiError = new Error(message);
        apiError.status = error.response.status;
        throw apiError;
    } else if (error.request) {
        console.error('API No Response:', error.request);
        throw new Error('No response received from server. Check network connection.');
    } else {
        console.error('API Request Setup Error:', error.message);
        throw new Error(`Request setup failed: ${error.message}`);
    }
};

// --- Authentication ---
export const signinUser = async (credentials) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        // *** USE handleResponse HERE ***
        // Now it will return the nested { token: '...', user: {...} } object
        return handleResponse(response);
    } catch (error) {
        // handleError will catch issues thrown by handleResponse or network errors
        handleError(error);
    }
};

export const signupUser = async (formData) => { // Expects FormData
    try {
        const response = await apiClient.post('/auth/signup', formData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

// --- User ---
export const fetchUserProfile = async () => {
    try {
        const response = await apiClient.get('/users/profile');
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const updateUserDetails = async (updateData) => {
    try {
        let dataToSend = updateData;
        let config = {};
        if (!(updateData instanceof FormData)) {
            dataToSend = JSON.stringify(updateData);
            config.headers = { 'Content-Type': 'application/json' };
        }
        const response = await apiClient.put('/users/profile/update', dataToSend, config);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchUserDetails = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}/details`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

// --- Categories ---
export const fetchCategories = async () => {
    try {
        const response = await apiClient.get('/general/categories');
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

// --- Courses ---
export const createCourse = async (formData) => {
    try {
        const response = await apiClient.post('/courses/', formData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const updateCourse = async (courseId, formData) => {
    try {
        const response = await apiClient.put(`/courses/${courseId}`, formData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchCreatedCourses = async () => {
    try {
        const response = await apiClient.get('/courses/created');
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchCreatedCourseDetailForManage = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/manage`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchExploreCourses = async () => {
    try {
        const response = await apiClient.get('/courses/explore');
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchExploreCourseDetail = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/explore-detail`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchEnrolledCourses = async () => {
    try {
        const response = await apiClient.get('/courses/enrolled');
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchEnrolledCourseDetail = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/enrolled-detail`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const enrollInCourse = async (courseId) => {
    try {
        const response = await apiClient.post(`/courses/${courseId}/enroll`, {});
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchCourseEnrollmentDetails = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/enrollment-details`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

// --- Lessons ---
export const addLesson = async (courseId, formData) => {
    try {
        const response = await apiClient.post(`/courses/${courseId}/lessons`, formData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const updateLesson = async (courseId, lessonId, formData) => {
    try {
        const response = await apiClient.put(`/courses/${courseId}/lessons/${lessonId}`, formData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const deleteLesson = async (courseId, lessonId) => {
    try {
        const response = await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}`);
        // Check if backend sends data on delete, handleResponse might need adjustment if not
        // If delete returns only { success: true, message: '...' }, handleResponse might fail
        // For now, assume it might return empty data or specific message
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const markLessonComplete = async (courseId, lessonId) => {
    try {
        const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`, {});
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

// --- Reviews ---
export const addOrUpdateReview = async (courseId, reviewData) => {
    try {
        const response = await apiClient.post(`/courses/${courseId}/review`, reviewData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchMyReviewForCourse = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/review`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const fetchReviewsForCourse = async (courseId) => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/reviews`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};