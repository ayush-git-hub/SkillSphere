import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            if (token && userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    if (parsedUser && parsedUser.user_id && parsedUser.email) {
                        setUser(parsedUser);
                        setIsAuthenticated(true);
                    } else {
                        logout();
                    }
                } catch (e) {
                    console.error("Failed to parse user data from localStorage", e);
                    logout();
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

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

    const updateUserState = useCallback((updatedUserData) => {
        if (updatedUserData && updatedUserData.user_id) {
            setUser(updatedUserData);
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            console.log("User state and localStorage updated:", updatedUserData);
        } else {
            console.error("Attempted to update user state with invalid data:", updatedUserData);
        }
    }, []);


    return { isLoading, isAuthenticated, user, login, logout, updateUserState };
};

export default useAuth;