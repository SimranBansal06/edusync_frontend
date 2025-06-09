import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
    const { currentUser, isInstructor, isStudent, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If the auth context is still loading, wait
        if (loading) {
            return;
        }

        // If no user is logged in, redirect to login
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Redirect based on role
        if (isInstructor()) {
            navigate('/instructor');
        } else if (isStudent()) {
            // For students, stay on dashboard or redirect to student-specific page
            // For now, just showing the dashboard content below
        } else {
            // If role can't be determined, go to login
            navigate('/login');
        }
    }, [currentUser, navigate, isInstructor, isStudent, loading]);

    // Show a simple loading state while redirecting or loading
    if (!currentUser || loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <h2>Loading...</h2>
                <p>Please wait while we prepare your dashboard.</p>
            </div>
        );
    }

    // If we're still here and have a student user, show student content
    return (
        <div className="container" style={{ padding: '30px 20px' }}>
            <h1>Student Dashboard</h1>
            <p>Welcome, {currentUser.name}!</p>
            <p>Browse your courses and assessments from the navigation menu.</p>
        </div>
    );
};

export default DashboardPage;