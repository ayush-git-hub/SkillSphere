import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useToast } from '../hooks/useToast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const { error: showErrorToast } = useToast();

    useEffect(() => {
        const checkAuth = () => {
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
                        localStorage.removeItem('authToken'); localStorage.removeItem('userData');
                        setIsAuthenticated(false); setUser(null);
                    }
                } catch (e) {
                    console.error("Failed to parse user data from localStorage", e);
                    localStorage.removeItem('authToken'); localStorage.removeItem('userData');
                    setIsAuthenticated(false); setUser(null);
                }
            } else {
                setIsAuthenticated(false); setUser(null);
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
            console.log("AuthContext: User state updated in context and localStorage:", updatedUserData);
        } else {
            console.error("AuthContext: Attempted to update user state with invalid data:", updatedUserData);
            showErrorToast("Failed to update user session data correctly.");
        }
    }, [showErrorToast]);

    const value = { isLoading, isAuthenticated, user, login, logout, updateUserState };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};