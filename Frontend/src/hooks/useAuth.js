// src/hooks/useAuth.js (Extracted logic from App.jsx for clarity)
// You would import this into App.jsx: import useAuth from './hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            // Simulate async check if needed, otherwise just check localStorage
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            if (token && userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    // Basic validation: check if essential fields exist
                    if (parsedUser && parsedUser.user_id && parsedUser.email) {
                        setUser(parsedUser);
                        setIsAuthenticated(true);
                    } else {
                        // Invalid data, clear storage
                        logout();
                    }
                } catch (e) {
                    console.error("Failed to parse user data from localStorage", e);
                    logout(); // Clear invalid data
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []); // Run only once on mount

    const login = useCallback((token, userData) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    // Function to update user state AND localStorage after profile update
    const updateUserState = useCallback((updatedUserData) => {
        // updatedUserData should be the user object returned by the backend API
        if (updatedUserData && updatedUserData.user_id) {
            // Update React state
            setUser(updatedUserData);
            // Update localStorage
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            console.log("User state and localStorage updated:", updatedUserData);
        } else {
            console.error("Attempted to update user state with invalid data:", updatedUserData);
            // Optionally show an error toast here
        }
    }, []);


    return { isLoading, isAuthenticated, user, login, logout, updateUserState }; // Expose updateUserState
};

export default useAuth;