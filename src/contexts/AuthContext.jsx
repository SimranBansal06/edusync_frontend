import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Setup axios interceptor for authentication
const setupAuthInterceptors = () => {
    axios.interceptors.request.use(
        (config) => {
            try {
                const user = JSON.parse(sessionStorage.getItem('user'));
                if (user && user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch (error) {
                console.error("Error adding auth header:", error);
            }
            return config;
        },
        (error) => Promise.reject(error)
    );
};

// Initialize interceptors
setupAuthInterceptors();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if this is a page refresh by looking for a session flag
        const isPageRefresh = sessionStorage.getItem('app_initialized');

        // Check for existing user on component mount
        const loadUserFromStorage = () => {
            try {
                const storedUser = sessionStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    setCurrentUser(user);

                    // If it's a page refresh, don't show loading
                    if (isPageRefresh) {
                        setLoading(false);
                    } else {
                        // For first load, show brief loading to ensure UI is ready
                        setTimeout(() => {
                            setLoading(false);
                        }, 300);
                    }
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error loading user from sessionStorage:", error);
                // Clear invalid data
                sessionStorage.removeItem('user');
                setLoading(false);
            }
        };

        loadUserFromStorage();

        // Set session flag to indicate app has been initialized
        sessionStorage.setItem('app_initialized', 'true');

        // Add event listener to clear session when the window is closed or refreshed
        const handleBeforeUnload = () => {
            // We don't need to do anything here, because sessionStorage
            // will automatically be cleared when the browser is closed
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const login = (userData) => {
        try {
            sessionStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
            return userData;
        } catch (error) {
            console.error("Error saving user to sessionStorage:", error);
            return userData;
        }
    };

    const logout = () => {
        sessionStorage.removeItem('user');
        setCurrentUser(null);
    };

    const isInstructor = () => {
        if (!currentUser) {
            // Check sessionStorage directly as a fallback
            try {
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                if (storedUser && storedUser.role) {
                    return storedUser.role.toLowerCase() === 'instructor';
                }
            } catch (error) {
                console.error("Error checking role from sessionStorage:", error);
            }
            return false;
        }
        return currentUser.role && currentUser.role.toLowerCase() === 'instructor';
    };

    const isStudent = () => {
        if (!currentUser) {
            // Check sessionStorage directly as a fallback
            try {
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                if (storedUser && storedUser.role) {
                    return storedUser.role.toLowerCase() === 'student';
                }
            } catch (error) {
                console.error("Error checking role from sessionStorage:", error);
            }
            return false;
        }
        return currentUser.role && currentUser.role.toLowerCase() === 'student';
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                login,
                logout,
                isInstructor,
                isStudent,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);