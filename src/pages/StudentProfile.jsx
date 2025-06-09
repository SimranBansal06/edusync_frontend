import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/StudentProfile.css";
import { FaUser, FaEnvelope, FaEdit, FaSignOutAlt, FaSave, FaTimes, FaCheck, FaTrashAlt, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from 'axios';

// Hardcoded Azure API URL
const API_BASE_URL = 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net/api';

const StudentProfile = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
    });
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
            // Get current user data to preserve other fields
            const getUserResponse = await axios.get(`${API_BASE_URL}/UserModels/${currentUser.userId}`);
            const userData = getUserResponse.data;

            // Prepare update payload with new password
            const updatePayload = {
                ...userData,
                passwordHash: passwordData.newPassword // Backend will hash the password
            };

            // Update user with new password
            await axios.put(`${API_BASE_URL}/UserModels/${currentUser.userId}`, updatePayload, {
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

    useEffect(() => {
        const loadUserProfile = async () => {
            if (!currentUser || !currentUser.userId) {
                navigate('/login');
                return;
            }

            try {
                // First set the basic data we already have
                setProfileData({
                    name: currentUser.name || "",
                    email: currentUser.email || "",
                });

                // Then try to get fresh data from the API
                try {
                    const response = await axios.get(`${API_BASE_URL}/UserModels/${currentUser.userId}`);
                    const userData = response.data;

                    // Update with fresh data from the API
                    setProfileData({
                        name: userData.name || currentUser.name || "",
                        email: userData.email || currentUser.email || "",
                    });

                    console.log("User profile loaded from API:", userData);
                } catch (apiErr) {
                    console.warn("Could not load fresh user data from API:", apiErr);
                    // Continue with data from context if API fails
                }
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [currentUser, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            console.log("Current user data:", currentUser);

            // Get all required fields from the API to make sure we don't miss anything
            const getUserResponse = await axios.get(`${API_BASE_URL}/UserModels/${currentUser.userId}`);
            const existingUserData = getUserResponse.data;

            console.log("Existing user data from API:", existingUserData);

            // Only update the name field, preserving all other fields
            const updatePayload = {
                ...existingUserData,
                name: profileData.name
            };

            console.log("Sending update payload:", updatePayload);

            // Update the user's name in the database
            const response = await axios.put(
                `${API_BASE_URL}/UserModels/${currentUser.userId}`,
                updatePayload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("Server response:", response);
            setSuccess("Name updated successfully!");

            // Store the updated name in localStorage if that's how your app manages state
            const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (storedUser && storedUser.userId === currentUser.userId) {
                storedUser.name = profileData.name;
                localStorage.setItem('currentUser', JSON.stringify(storedUser));
            }

            setEditMode(false);
        } catch (err) {
            console.error("Update failed:", err);

            // More detailed error logging
            if (err.response) {
                console.error("Error response:", err.response.data);
                console.error("Error status:", err.response.status);

                // Specific error handling based on status code
                if (err.response.status === 404) {
                    setError("User profile not found. Please contact support.");
                } else if (err.response.status === 401) {
                    setError("Session expired. Please log in again.");
                    setTimeout(() => {
                        logout();
                        navigate('/login');
                    }, 2000);
                } else {
                    setError(err.response.data || "Failed to update profile. Please try again later.");
                }
            } else if (err.request) {
                setError("Network error: The server did not respond. Please check your connection.");
            } else {
                setError(`Request error: ${err.message}`);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="profile-loading-container">
                <div className="spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="container">
                    <h1>Student Profile</h1>
                    <p className="profile-subtitle">View and manage your personal information</p>
                </div>
            </div>

            <div className="container">
                <div className="profile-container">
                    {error && (
                        <div className="alert alert-danger">
                            <FaTimes className="alert-icon" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <FaCheck className="alert-icon" />
                            {success}
                        </div>
                    )}

                    <div className="profile-card">
                        <div className="profile-sidebar">
                            <div className="avatar-container">
                                <div className="avatar-circle">
                                    {profileData.name
                                        .split(" ")
                                        .map(n => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <h3 className="student-name">{profileData.name}</h3>
                                <div className="student-role">Student</div>
                            </div>

                            <div className="sidebar-actions">
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className={`sidebar-btn ${editMode ? 'cancel' : 'edit'}`}
                                >
                                    {editMode ? (
                                        <>
                                            <FaTimes className="btn-icon" />
                                            Cancel Editing
                                        </>
                                    ) : (
                                        <>
                                            <FaEdit className="btn-icon" />
                                            Edit Name
                                        </>
                                    )}
                                </button>

                                <button onClick={handleLogout} className="sidebar-btn logout">
                                    <FaSignOutAlt className="btn-icon" />
                                    Logout
                                </button>

                                <button onClick={() => setShowPasswordModal(true)} className="sidebar-btn password">
                                    <FaKey className="btn-icon" />
                                    Change Password
                                </button>

                                <button onClick={() => setShowDeleteModal(true)} className="sidebar-btn delete">
                                    <FaTrashAlt className="btn-icon" />
                                    Delete Account
                                </button>
                            </div>
                        </div>

                        <div className="profile-main">
                            <h2 className="section-title">Personal Information</h2>

                            {editMode ? (
                                <form onSubmit={handleSubmit} className="profile-form">
                                    <div className="form-group">
                                        <label>
                                            <FaUser className="form-icon" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={profileData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <FaEnvelope className="form-icon" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleChange}
                                            required
                                            disabled
                                            className="disabled"
                                        />
                                        <span className="field-hint">Email cannot be changed</span>
                                    </div>

                                    <div className="form-actions">
                                        <button type="submit" className="save-btn">
                                            <FaSave className="btn-icon" />
                                            Save Name
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-details">
                                    <div className="detail-item">
                                        <div className="detail-icon">
                                            <FaUser />
                                        </div>
                                        <div className="detail-content">
                                            <h4>Full Name</h4>
                                            <p>{profileData.name}</p>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div className="detail-icon">
                                            <FaEnvelope />
                                        </div>
                                        <div className="detail-content">
                                            <h4>Email Address</h4>
                                            <p>{profileData.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <div className="modal-header">
                            <h3><FaTrashAlt className="modal-icon" /> Delete Account</h3>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete your account? This action cannot be undone and will delete all your courses, assessments, and results.</p>
                            {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                        </div>
                        <div className="modal-footer">
                            <button className="modal-button cancel" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
                            <button className="modal-button delete" onClick={async () => {
                                setDeleteLoading(true);
                                setDeleteError("");
                                try {
                                    const studentId = currentUser.userId;
                                    const token = currentUser?.token;

                                    console.log("Starting student account deletion process...");

                                    // 1. Fetch all results for this student
                                    console.log("Fetching student results...");
                                    const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`, {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        }
                                    });

                                    // Filter results for this student
                                    const studentResults = resultsResponse.data.filter(result =>
                                        (result.userId || result.UserId) === studentId
                                    );
                                    console.log(`Found ${studentResults.length} results for this student to delete`);

                                    // 2. Delete all results first
                                    for (const result of studentResults) {
                                        const resultId = result.resultId || result.ResultId;
                                        await axios.delete(`${API_BASE_URL}/ResultModels/${resultId}`, {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            }
                                        });
                                        console.log(`Deleted result ID: ${resultId}`);
                                    }

                                    // 3. Finally delete the student account
                                    console.log("Deleting student account...");
                                    await axios.delete(`${API_BASE_URL}/UserModels/${studentId}`, {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        }
                                    });
                                    console.log("Student account deleted successfully");

                                    logout();
                                    navigate("/");
                                } catch (err) {
                                    console.error("Delete account error:", err);
                                    setDeleteError("Failed to delete account. Please try again later.");
                                } finally {
                                    setDeleteLoading(false);
                                }
                            }} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete Account"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <div className="modal-header">
                            <h3><FaKey className="modal-icon" /> Change Password</h3>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handlePasswordSubmit} className="password-form">
                                {passwordError && <div className="alert alert-danger">{passwordError}</div>}
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

export default StudentProfile;