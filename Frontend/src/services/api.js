import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const getAuthToken = () => localStorage.getItem('authToken');

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

const handleResponse = (response) => {
    if (response.data && response.data.success) {
        return response.data.data;
    } else {
        const message = response.data?.message || 'An unknown error occurred';
        const error = new Error(message);
        error.status = response.status;
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

export const signinUser = async (credentials) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const signupUser = async (formData) => {
    try {
        const response = await apiClient.post('/auth/signup', formData);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

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

export const fetchCategories = async () => {
    try {
        const response = await apiClient.get('/general/categories');
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

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
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

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

export const markLessonComplete = async (courseId, lessonId, timeSpentIncrement = null) => {
    try {
        const payload = {};
        if (timeSpentIncrement !== null && typeof timeSpentIncrement === 'number' && timeSpentIncrement >= 0) {
            payload.timeSpentIncrement = Math.round(timeSpentIncrement); // Send integer seconds
        } else {
        }
        const config = { headers: { 'Content-Type': 'application/json' } };
        const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`, payload, config);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};