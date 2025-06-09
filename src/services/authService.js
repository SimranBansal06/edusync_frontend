// // src/services/authService.js
// import axios from 'axios';

// const API_BASE_URL = "https://localhost:7278/api";

// // Create axios instance with base configuration
// const authApi = axios.create({
//     baseURL: API_BASE_URL,
//     headers: {
//         'Content-Type': 'application/json'
//     }
// });

// export const registerUser = async (userData) => {
//     try {
//         const response = await authApi.post('/UserModels', userData);
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const loginUser = async (credentials) => {
//     try {
//         const response = await authApi.post('/UserModels/login', credentials);
//         // Store token if your API returns one
//         if (response.data.token) {
//             localStorage.setItem('token', response.data.token);
//         }
//         return response.data;
//     } catch (error) {
//         throw error;
//     }
// };

// export const logoutUser = () => {
//     localStorage.removeItem('token');
// };

// export const getCurrentUser = () => {
//     return JSON.parse(localStorage.getItem('user'));
// };

// export const isAuthenticated = () => {
//     return localStorage.getItem('token') !== null;
// };
import axios from 'axios';

// Hardcoded URL for Azure deployment
const API_URL = 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net/api/auth/';

// Create axios instance with interceptors for JWT
const axiosInstance = axios.create();

// Request interceptor to add JWT to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const login = async (email, password) => {
    try {
        const response = await axios.post(API_URL + 'login', {
            email,
            password,
        });

        if (response.data.token) {
            sessionStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        throw error;
    }
};

const logout = () => {
    sessionStorage.removeItem('user');
};

const getCurrentUser = () => {
    return JSON.parse(sessionStorage.getItem('user'));
};

const isInstructor = () => {
    const user = getCurrentUser();
    return user && user.role && user.role.toLowerCase() === 'instructor';
};

const isStudent = () => {
    const user = getCurrentUser();
    return user && user.role && user.role.toLowerCase() === 'student';
};

/**
 * Get the current logged in user from storage
 * @returns {Object|null} The logged in user or null
 */
export const getUser = () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        return user;
    } catch (error) {
        console.error("Error parsing user from sessionStorage:", error);
        return null;
    }
};

const authService = {
    login,
    logout,
    getCurrentUser,
    isInstructor,
    isStudent,
    axiosInstance,
    getUser
};

export default authService;