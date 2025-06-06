import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/InstructorDashboard.css';
import {
    FaBook,
    FaClipboardList,
    FaEdit,
    FaTrashAlt,
    FaPlus,
    FaChartBar,
    FaExclamationTriangle,
    FaSync,
    FaGraduationCap,
    FaKey,
    FaEye,
    FaEyeSlash
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

// Define the API base URL
const API_BASE_URL = 'https://localhost:7278/api';

const InstructorDashboard = () => {
    // State management
    const [data, setData] = useState({
        courses: [],
        assessments: [],
        loading: true,  // Start with loading to prevent flash of empty content
        error: null,
        initialLoadComplete: false // Track if the initial load has been completed
    });
    const [deleteModal, setDeleteModal] = useState({ visible: false, courseId: null, courseTitle: '' });
    const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null });
    const [stats, setStats] = useState({
        students: 0,
        completions: 0,
        loading: true
    });
    const [deleteAssessmentModal, setDeleteAssessmentModal] = useState({
        visible: false,
        assessmentId: null,
        assessmentTitle: ''
    });
    const [deleteAssessmentStatus, setDeleteAssessmentStatus] = useState({
        loading: false,
        error: null
    });
    const { logout } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Toggle password visibility
    const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
    const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    // Change password field handler
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Submit password change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        // Validation
        if (passwordData.newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        setPasswordLoading(true);

        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            // Get instructor ID
            const instructorId = user.userId || user.UserId;

            // Get current user data to preserve other fields
            const getUserResponse = await axios.get(`${API_BASE_URL}/UserModels/${instructorId}`);
            const userData = getUserResponse.data;

            // Prepare update payload with new password
            const updatePayload = {
                ...userData,
                passwordHash: passwordData.newPassword // Backend will hash the password
            };

            // Update user with new password
            await axios.put(`${API_BASE_URL}/UserModels/${instructorId}`, updatePayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setPasswordSuccess("Password changed successfully!");

            // Reset form
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            // Close modal after delay
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess("");
            }, 2000);

        } catch (err) {
            console.error("Password update failed:", err);
            setPasswordError("Failed to update password. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    // Navigation and auth
    const user = JSON.parse(sessionStorage.getItem('user'));
    const navigate = useNavigate();

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        if (!user || user.role !== 'Instructor') {
            navigate(user ? '/dashboard' : '/login');
            return;
        }

        // Only show loading state on first load
        if (!data.initialLoadComplete) {
            setData(prev => ({ ...prev, loading: true, error: null }));
        }

        try {
            // Extract instructor ID - using UserId as per your model
            const instructorId = user.id || user.userId || user.UserId;

            // Create empty arrays for defaults if API fails
            let instructorCourses = [];
            let instructorAssessments = [];

            try {
                // Fetch courses - adapting to your CourseModel properties
                const coursesResponse = await axios.get(`${API_BASE_URL}/CourseModels`);
                instructorCourses = coursesResponse.data.filter(course =>
                    String(course.instructorId || course.InstructorId) === String(instructorId)
                );
            } catch (err) {
                console.error("Failed to fetch courses:", err);
                // Don't attempt to retry on critical errors
                if (err.code === 'ERR_NETWORK' || err.response?.status === 404) {
                    console.log('Network error or endpoint not found - stopping retry');
                }
            }

            // Get course IDs - using CourseId as per your model
            const courseIds = instructorCourses.map(c => c.courseId || c.CourseId);

            try {
                // Only fetch assessments if we have courses
                if (courseIds.length > 0) {
                    const assessmentsResponse = await axios.get(`${API_BASE_URL}/AssessmentModels`);
                    instructorAssessments = assessmentsResponse.data.filter(asm =>
                        courseIds.includes(asm.courseId || asm.CourseId)
                    );
                }
            } catch (err) {
                console.error("Failed to fetch assessments:", err);
            }

            // Set data without delay to prevent flickering
            setData({
                courses: instructorCourses,
                assessments: instructorAssessments,
                loading: false,
                error: null,
                initialLoadComplete: true // Mark initial load as complete
            });

            // Only fetch statistics if we have courses
            if (courseIds.length > 0) {
                fetchStatistics(courseIds);
            } else {
                // Reset statistics immediately if no courses
                setStats({
                    students: 0,
                    completions: 0,
                    loading: false
                });
            }

        } catch (err) {
            console.error("Dashboard fetch error:", err);

            // Set more specific error messages based on error type
            let errorMessage = 'Failed to load dashboard data';

            if (err.code === 'ERR_NETWORK') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Session expired. Please log in again.';
                // Optionally redirect to login
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 3000);
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            }

            setData(prev => ({
                ...prev,
                courses: [],
                assessments: [],
                loading: false,
                error: errorMessage,
                initialLoadComplete: true // Mark as complete even on error
            }));

            // Reset statistics
            setStats({
                students: 0,
                completions: 0,
                loading: false
            });
        }
    }, [navigate, user, logout, data.initialLoadComplete]);

    // Fetch statistics based on course IDs
    const fetchStatistics = async (courseIds) => {
        try {
            setStats(prev => ({ ...prev, loading: true }));

            // Handle no courses case - set stats to 0 and return early
            if (!courseIds || courseIds.length === 0) {
                setStats({
                    students: 0,
                    completions: 0,
                    loading: false
                });
                return;
            }

            // Fetch results data - adapting to your ResultModel
            const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`);

            // Get assessment IDs for this instructor's courses
            // Using AssessmentId as per your model
            const assessmentsResponse = await axios.get(`${API_BASE_URL}/AssessmentModels`);
            const instructorAssessmentIds = assessmentsResponse.data
                .filter(a => courseIds.includes(a.courseId || a.CourseId))
                .map(a => a.assessmentId || a.AssessmentId);

            // If no assessments, set stats to 0
            if (!instructorAssessmentIds || instructorAssessmentIds.length === 0) {
                setStats({
                    students: 0,
                    completions: 0,
                    loading: false
                });
                return;
            }

            // Count results for instructor's assessments
            const completionsCount = resultsResponse.data.filter(
                result => instructorAssessmentIds.includes(result.assessmentId || result.AssessmentId)
            ).length;

            // Count unique students who have taken the instructor's assessments
            // Using UserId as per your model
            const uniqueStudentIds = new Set(
                resultsResponse.data
                    .filter(result => instructorAssessmentIds.includes(result.assessmentId || result.AssessmentId))
                    .map(result => result.userId || result.UserId)
            );

            setStats({
                students: uniqueStudentIds.size,
                completions: completionsCount,
                loading: false
            });

        } catch (err) {
            console.error("Statistics fetch error:", err);
            setStats({
                students: 0,
                completions: 0,
                loading: false
            });
        }
    };

    // Delete course handlers
    const openDeleteModal = (courseId, courseTitle) => {
        setDeleteModal({
            visible: true,
            courseId,
            courseTitle
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ visible: false, courseId: null, courseTitle: '' });
        setDeleteStatus({ loading: false, error: null });
    };

    const confirmDelete = async () => {
        if (!deleteModal.courseId) return;

        setDeleteStatus({ loading: true, error: null });

        try {
            const courseId = deleteModal.courseId;

            // 1. First get all assessments for this course
            const assessmentsResponse = await axios.get(`${API_BASE_URL}/AssessmentModels`);
            const courseAssessments = assessmentsResponse.data.filter(assessment =>
                (assessment.courseId || assessment.CourseId) === courseId
            );

            // 2. Get all results
            const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`);

            // 3. For each assessment, delete its results first
            for (const assessment of courseAssessments) {
                const assessmentId = assessment.assessmentId || assessment.AssessmentId;

                // Find results for this assessment
                const assessmentResults = resultsResponse.data.filter(result =>
                    (result.assessmentId || result.AssessmentId) === assessmentId
                );

                // Delete each result
                for (const result of assessmentResults) {
                    const resultId = result.resultId || result.ResultId;
                    await axios.delete(`${API_BASE_URL}/ResultModels/${resultId}`);
                    console.log(`Deleted result ID: ${resultId}`);
                }

                // Then delete the assessment
                await axios.delete(`${API_BASE_URL}/AssessmentModels/${assessmentId}`);
                console.log(`Deleted assessment ID: ${assessmentId}`);
            }

            // 4. Finally delete the course
            await axios.delete(`${API_BASE_URL}/CourseModels/${courseId}`);
            console.log(`Deleted course ID: ${courseId}`);

            // Update the UI after successful deletion
            setData(prev => ({
                ...prev,
                courses: prev.courses.filter(c => (c.courseId || c.CourseId) !== courseId),
                assessments: prev.assessments.filter(a => (a.courseId || a.CourseId) !== courseId)
            }));

            setTimeout(() => {
                closeDeleteModal();
            }, 1000);

        } catch (err) {
            console.error("Delete error:", err);
            setDeleteStatus({
                loading: false,
                error: err.response?.data?.message || 'Failed to delete course. Please try again.'
            });
        }
    };

    // Delete assessment handlers
    const handleDeleteAssessment = (assessmentId, assessmentTitle) => {
        setDeleteAssessmentModal({
            visible: true,
            assessmentId,
            assessmentTitle
        });
    };

    const closeDeleteAssessmentModal = () => {
        setDeleteAssessmentModal({ visible: false, assessmentId: null, assessmentTitle: '' });
        setDeleteAssessmentStatus({ loading: false, error: null });
    };

    const confirmDeleteAssessment = async () => {
        if (!deleteAssessmentModal.assessmentId) return;

        setDeleteAssessmentStatus({ loading: true, error: null });

        try {
            const assessmentId = deleteAssessmentModal.assessmentId;

            // 1. Get all results for this assessment
            const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`);
            const assessmentResults = resultsResponse.data.filter(result =>
                (result.assessmentId || result.AssessmentId) === assessmentId
            );

            // 2. Delete each result
            for (const result of assessmentResults) {
                const resultId = result.resultId || result.ResultId;
                await axios.delete(`${API_BASE_URL}/ResultModels/${resultId}`);
                console.log(`Deleted result ID: ${resultId}`);
            }

            // 3. Delete the assessment
            await axios.delete(`${API_BASE_URL}/AssessmentModels/${assessmentId}`);
            console.log(`Deleted assessment ID: ${assessmentId}`);

            // 4. Update the UI after successful deletion
            setData(prev => ({
                ...prev,
                assessments: prev.assessments.filter(a =>
                    (a.assessmentId || a.AssessmentId) !== assessmentId
                )
            }));

            setTimeout(() => {
                closeDeleteAssessmentModal();
            }, 1000);

        } catch (err) {
            console.error("Delete assessment error:", err);
            setDeleteAssessmentStatus({
                loading: false,
                error: err.response?.data?.message || 'Failed to delete assessment. Please try again.'
            });
        }
    };

    // Load data on component mount only
    useEffect(() => {
        fetchData();
        // We don't include fetchData in the dependency array to prevent constant rerenders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!user) return null;


    const getBackgroundColor = (title) => {
        const colors = [
            'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        ];

        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="instructor-dashboard">
            {/* Welcome Section */}
            <div className="dashboard-welcome">
                <div className="welcome-content">
                    <h1>Welcome back, <span className="instructor-name">{user.name || user.Name}</span></h1>
                    <p>Manage your courses and assessments from your instructor dashboard</p>
                </div>
            </div>

            {/* Error Alert */}
            {data.error && (
                <div className="alert alert-error">
                    <FaExclamationTriangle className="alert-icon" />
                    <p>{data.error}</p>
                    <button onClick={fetchData} className="alert-action">
                        <FaSync className="icon-spin" /> Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {data.loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your dashboard...</p>
                </div>
            ) : (
                <>
                    {/* Stats Section */}
                    <div className="dashboard-stats">
                        <div className="stat-card accent">
                            <div className="stat-icon">
                                <FaBook />
                            </div>
                            <div className="stat-details">
                                <h3>Your Courses</h3>
                                <p className="stat-value">{data.courses.length}</p>
                            </div>
                        </div>

                        <div className="stat-card secondary">
                            <div className="stat-icon">
                                <FaClipboardList />
                            </div>
                            <div className="stat-details">
                                <h3>Assessments</h3>
                                <p className="stat-value">{data.assessments.length}</p>
                            </div>
                        </div>

                        <div className="stat-card accent">
                            <div className="stat-icon">
                                <FaGraduationCap />
                            </div>
                            <div className="stat-details">
                                <h3>Students</h3>
                                <p className="stat-value">
                                    {stats.loading ? (
                                        <span className="loading-dots">...</span>
                                    ) : (
                                        stats.students
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="stat-card secondary">
                            <div className="stat-icon">
                                <FaChartBar />
                            </div>
                            <div className="stat-details">
                                <h3>Assessment Completions</h3>
                                <p className="stat-value">
                                    {stats.loading ? (
                                        <span className="loading-dots">...</span>
                                    ) : (
                                        stats.completions
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="dashboard-actions">
                        <Link to="/courses/create" className="action-button primary">
                            <FaPlus className="button-icon" /> Create New Course
                        </Link>
                        <Link to="/assessment/create" className="action-button secondary">
                            <FaPlus className="button-icon" /> Create Assessment
                        </Link>
                    </div>

                    {/* Content Sections */}
                    <div className="dashboard-sections">
                        {/* Courses Section */}
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2><FaBook className="section-icon" /> Your Courses</h2>
                                {data.courses.length > 0 && (
                                    <Link to="/courses" className="section-link">View all</Link>
                                )}
                            </div>

                            {data.courses.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📚</div>
                                    <h3>No courses yet</h3>
                                    <p>Create your first course to get started</p>
                                    <div className="empty-state-actions">
                                        <Link to="/courses/create" className="action-button primary">
                                            <FaPlus className="button-icon" /> Create Course
                                        </Link>
                                        <button onClick={fetchData} className="action-button secondary refresh-button">
                                            <FaSync className="button-icon" /> Refresh Data
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="course-grid">
                                    {data.courses.map(course => {
                                        const courseId = course.courseId || course.CourseId;
                                        const courseTitle = course.title || course.Title;
                                        const description = course.description || course.Description || '';

                                        return (
                                            <div key={courseId} className="course-card">
                                                <div className="course-card-header" style={{ background: getBackgroundColor(courseTitle) }}>
                                                    <h3 className="course-title">{courseTitle}</h3>
                                                    <div className="course-actions">
                                                        <Link to={`/courses/${courseId}/edit`} className="course-action edit" title="Edit course">
                                                            <FaEdit />
                                                        </Link>
                                                        <button
                                                            className="course-action delete"
                                                            title="Delete course"
                                                            onClick={() => openDeleteModal(courseId, courseTitle)}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="course-card-body">
                                                    <p className="course-description">
                                                        {description.length > 120 ? description.substring(0, 120) + '...' : description}
                                                    </p>
                                                    <div className="course-meta">
                                                        <span className="meta-item">
                                                            <FaClipboardList className="meta-icon" />
                                                            {data.assessments.filter(a =>
                                                                (a.courseId || a.CourseId) === courseId
                                                            ).length} Assessments
                                                        </span>
                                                    </div>
                                                    <Link to={`/courses/${courseId}`} className="view-course-button">
                                                        View Course
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Assessments Section */}
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2><FaClipboardList className="section-icon" /> Your Assessments</h2>
                                <Link to="/assessment/create" className="section-link">Create New</Link>
                            </div>

                            {data.assessments.length === 0 ? (
                                <div className="empty-visustate">
                                    <div className="empty-icon">📝</div>
                                    <h3>No assessments yet</h3>
                                    <p>Create an assessment for one of your courses</p>
                                    <div className="empty-state-actions">
                                        <Link to="/assessment/create" className="action-button secondary">
                                            <FaPlus className="button-icon" /> Create Assessment
                                        </Link>
                                        <button onClick={fetchData} className="action-button primary refresh-button">
                                            <FaSync className="button-icon" /> Refresh Data
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="assessment-table-container">
                                    <table className="assessment-table">
                                        <thead>
                                            <tr>
                                                <th>Assessment Title</th>
                                                <th>Course</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.assessments.map(assessment => {
                                                const assessmentId = assessment.assessmentId || assessment.AssessmentId;
                                                const courseId = assessment.courseId || assessment.CourseId;
                                                const title = assessment.title || assessment.Title;

                                                // Find related course
                                                const relatedCourse = data.courses.find(c =>
                                                    (c.courseId || c.CourseId) === courseId
                                                );

                                                const courseName = relatedCourse ?
                                                    (relatedCourse.title || relatedCourse.Title) :
                                                    'Unknown Course';

                                                return (
                                                    <tr key={assessmentId}>
                                                        <td>
                                                            <span className="assessment-name">{title}</span>
                                                        </td>
                                                        <td>
                                                            <div className="assessment-course">
                                                                <FaBook className="course-icon" />
                                                                <span>{courseName}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="assessment-actions">
                                                                <Link
                                                                    to={`/courses/${courseId}/assessment/${assessmentId}`}
                                                                    className="view-button"
                                                                >
                                                                    View
                                                                </Link>
                                                                <button
                                                                    className="delete-button"
                                                                    title="Delete assessment"
                                                                    onClick={() => handleDeleteAssessment(assessmentId, title)}
                                                                >
                                                                    <FaTrashAlt />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                    {/* Delete Account Button - Bottom of Dashboard */}
                    <div className="delete-account-bottom">
                        <button className="change-password-btn" onClick={() => setShowPasswordModal(true)}>
                            <FaKey className="btn-icon" /> Change Password
                        </button>
                        <button className="delete-account-btn" onClick={() => setShowDeleteModal(true)}>
                            <FaTrashAlt className="btn-icon" /> Delete Account
                        </button>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.visible && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <div className="modal-header">
                            <h3>
                                <FaTrashAlt className="modal-icon" />
                                Delete Course
                            </h3>
                        </div>

                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>"{deleteModal.courseTitle}"</strong>?</p>
                            <p className="warning-text">
                                <FaExclamationTriangle className="warning-icon" />
                                This action cannot be undone and will delete all associated assessments and student data.
                            </p>

                            {deleteStatus.error && (
                                <div className="alert alert-error">
                                    {deleteStatus.error}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="modal-button cancel"
                                onClick={closeDeleteModal}
                                disabled={deleteStatus.loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-button delete"
                                onClick={confirmDelete}
                                disabled={deleteStatus.loading}
                            >
                                {deleteStatus.loading ? 'Deleting...' : 'Delete Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Assessment Confirmation Modal */}
            {deleteAssessmentModal.visible && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <div className="modal-header">
                            <h3>
                                <FaTrashAlt className="modal-icon" />
                                Delete Assessment
                            </h3>
                        </div>

                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>"{deleteAssessmentModal.assessmentTitle}"</strong>?</p>
                            <p className="warning-text">
                                <FaExclamationTriangle className="warning-icon" />
                                This action cannot be undone and will delete all associated student data.
                            </p>

                            {deleteAssessmentStatus.error && (
                                <div className="alert alert-error">
                                    {deleteAssessmentStatus.error}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="modal-button cancel"
                                onClick={closeDeleteAssessmentModal}
                                disabled={deleteAssessmentStatus.loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-button delete"
                                onClick={confirmDeleteAssessment}
                                disabled={deleteAssessmentStatus.loading}
                            >
                                {deleteAssessmentStatus.loading ? 'Deleting...' : 'Delete Assessment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <div className="modal-header">
                            <h3><FaTrashAlt className="modal-icon" /> Delete Account</h3>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete your account? This action cannot be undone and will delete all your courses, assessments, and results.</p>
                            {deleteError && <div className="alert alert-error">{deleteError}</div>}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-button cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-button delete"
                                onClick={async () => {
                                    setDeleteLoading(true);
                                    setDeleteError("");

                                    try {
                                        const user = JSON.parse(sessionStorage.getItem('user'));
                                        const instructorId = user.userId || user.UserId;
                                        const token = user?.token;

                                        // 1. Fetch all courses owned by this instructor
                                        console.log("Fetching instructor courses...");
                                        const coursesResponse = await axios.get(`${API_BASE_URL}/CourseModels`);
                                        const instructorCourses = coursesResponse.data.filter(course =>
                                            String(course.instructorId || course.InstructorId) === String(instructorId)
                                        );
                                        const courseIds = instructorCourses.map(c => c.courseId || c.CourseId);
                                        console.log(`Found ${courseIds.length} courses for this instructor`);

                                        // 2. Fetch all assessments for these courses
                                        console.log("Fetching course assessments...");
                                        const assessmentsResponse = await axios.get(`${API_BASE_URL}/AssessmentModels`);
                                        const instructorAssessments = assessmentsResponse.data.filter(assessment =>
                                            courseIds.includes(assessment.courseId || assessment.CourseId)
                                        );
                                        const assessmentIds = instructorAssessments.map(a => a.assessmentId || a.AssessmentId);
                                        console.log(`Found ${assessmentIds.length} assessments for this instructor's courses`);

                                        // 3. Fetch all results for these assessments
                                        console.log("Fetching assessment results...");
                                        const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`);
                                        const assessmentResults = resultsResponse.data.filter(result =>
                                            assessmentIds.includes(result.assessmentId || result.AssessmentId)
                                        );
                                        console.log(`Found ${assessmentResults.length} results to delete`);

                                        // 4. Delete results first (bottom of dependency chain)
                                        console.log("Deleting assessment results...");
                                        for (const result of assessmentResults) {
                                            const resultId = result.resultId || result.ResultId;
                                            await axios.delete(`${API_BASE_URL}/ResultModels/${resultId}`, {
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                }
                                            });
                                            console.log(`Deleted result ID: ${resultId}`);
                                        }

                                        // 5. Delete assessments next
                                        console.log("Deleting assessments...");
                                        for (const assessmentId of assessmentIds) {
                                            await axios.delete(`${API_BASE_URL}/AssessmentModels/${assessmentId}`, {
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                }
                                            });
                                            console.log(`Deleted assessment ID: ${assessmentId}`);
                                        }

                                        // 6. Delete courses next
                                        console.log("Deleting courses...");
                                        for (const courseId of courseIds) {
                                            await axios.delete(`${API_BASE_URL}/CourseModels/${courseId}`, {
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                }
                                            });
                                            console.log(`Deleted course ID: ${courseId}`);
                                        }

                                        // 7. Finally delete the instructor account
                                        console.log("Deleting instructor account...");
                                        await axios.delete(`${API_BASE_URL}/UserModels/${instructorId}`, {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            }
                                        });
                                        console.log("Instructor account deleted successfully");

                                        // Logout and redirect to login page
                                        logout();
                                        navigate("/login");
                                    } catch (err) {
                                        console.error("Delete account error:", err);
                                        setDeleteError("Failed to delete account. Please ensure all related data is deleted first.");
                                    } finally {
                                        setDeleteLoading(false);
                                    }
                                }}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <div className="modal-header">
                            <h3><FaKey className="modal-icon" /> Change Password</h3>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handlePasswordSubmit} className="password-form">
                                {passwordError && <div className="alert alert-error">{passwordError}</div>}
                                {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password</label>
                                    <div className="password-input">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <button type="button" onClick={toggleCurrentPasswordVisibility}>
                                            {showCurrentPassword ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <div className="password-input">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            minLength="6"
                                        />
                                        <button type="button" onClick={toggleNewPasswordVisibility}>
                                            {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <div className="password-input">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <button type="button" onClick={toggleConfirmPasswordVisibility}>
                                            {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="modal-button cancel"
                                        onClick={() => setShowPasswordModal(false)}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="modal-button update"
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;