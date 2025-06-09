// // src/components/common/ProtectedRoute.jsx
// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

// const ProtectedRoute = ({ children, allowedRoles = [] }) => {
//     const { currentUser, isInstructor, isStudent } = useAuth();

//     // If user is not logged in, redirect to login
//     if (!currentUser) {
//         return <Navigate to="/login" replace />;
//     }

//     // If specific roles are required, check if user has permission
//     if (allowedRoles.length > 0) {
//         const hasPermission = allowedRoles.some(role => {
//             if (role === 'Instructor') return isInstructor();
//             if (role === 'Student') return isStudent();
//             return false;
//         });

//         if (!hasPermission) {
//             // Redirect to appropriate dashboard based on role
//             const redirectPath = isInstructor() ? '/instructor' : '/student';
//             return <Navigate to={redirectPath} replace />;
//         }
//     }

//     // User is authenticated and authorized, render the protected component
//     return children;
// };

// export default ProtectedRoute;

// src/components/common/ProtectedRoute.jsx
// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';

// const ProtectedRoute = ({ children, allowedRoles = [] }) => {
//     const { currentUser, isInstructor, isStudent } = useAuth();

//     // If user is not logged in, redirect to login
//     if (!currentUser) {
//         return <Navigate to="/login" replace />;
//     }

//     // If specific roles are required, check permissions
//     if (allowedRoles.length > 0) {
//         let hasPermission = false;

//         for (const role of allowedRoles) {
//             if (role === 'Instructor' && isInstructor()) {
//                 hasPermission = true;
//                 break;
//             } else if (role === 'Student' && isStudent()) {
//                 hasPermission = true;
//                 break;
//             }
//         }

//         if (!hasPermission) {
//             // Redirect to appropriate dashboard based on role
//             if (isInstructor()) {
//                 return <Navigate to="/instructor" replace />;
//             } else if (isStudent()) {
//                 return <Navigate to="/student" replace />;
//             } else {
//                 return <Navigate to="/dashboard" replace />;
//             }
//         }
//     }

//     // User is authenticated and authorized, render the protected component
//     return children;
// };

// export default ProtectedRoute;

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { currentUser, loading, isInstructor, isStudent } = useAuth();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // First check if we already have currentUser from context
        if (currentUser) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return;
        }

        // If context is still loading, wait for it
        if (loading) {
            // If not loaded yet but we have a token in storage, consider it authenticated
            // but wait for the loading to finish
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
            setIsChecking(false);
            return;
        }

        // If no currentUser but we have one in sessionStorage, we should be authenticated
        // This prevents the login redirect flash on page refresh
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setIsAuthenticated(true);
        }

        setIsChecking(false);
    }, [currentUser, loading]);

    // Don't render anything while we're checking authentication
    if (isChecking) {
        return null;
    }

    // If not authenticated, redirect to login WITH the current location
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // If specific roles are required, check permissions
    if (allowedRoles.length > 0) {
        let hasPermission = false;

        // Check if user has one of the allowed roles
        if (allowedRoles.includes('Instructor') && isInstructor()) {
            hasPermission = true;
        } else if (allowedRoles.includes('Student') && isStudent()) {
            hasPermission = true;
        }

        if (!hasPermission) {
            // Redirect to appropriate dashboard based on role
            if (isInstructor()) {
                return <Navigate to="/instructor" replace />;
            } else if (isStudent()) {
                return <Navigate to="/dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    // User is authenticated and authorized, render the protected component
    return children;
};

export default ProtectedRoute;