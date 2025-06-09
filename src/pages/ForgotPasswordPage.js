// src/pages/ForgotPasswordPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/AuthPages.css";

const ForgotPasswordPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const navigate = useNavigate();

    // Define the API base URL using the global config
    const API_BASE_URL = `${window.API_CONFIG.BASE_URL}/api`;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email address is invalid";
        }

        if (!formData.newPassword) {
            newErrors.newPassword = "New password is required";
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const url = `${API_BASE_URL}/UserModels/resetpassword`;

            console.log("Sending request to:", url);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();
            console.log("Response:", data);

            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            setMessage({
                type: "success",
                text: "If your email exists in our system, your password has been reset."
            });

            // Clear the form
            setFormData({
                email: "",
                newPassword: "",
                confirmPassword: ""
            });

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login', {
                    state: { message: "If your email exists, your password has been reset. Please try logging in with your new password." }
                });
            }, 3000);
        } catch (error) {
            console.error("Password reset error:", error);

            setMessage({
                type: "error",
                text: error.message || "Failed to reset password. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-form-container">
                    <div className="auth-header">
                        <h2>Reset Password</h2>
                        <p>Enter your email and new password</p>
                    </div>

                    {message.text && (
                        <div className={`auth-${message.type}`}>{message.text}</div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={errors.email ? "error" : ""}
                            />
                            {errors.email && (
                                <span className="error-message">{errors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                className={errors.newPassword ? "error" : ""}
                            />
                            {errors.newPassword && (
                                <span className="error-message">{errors.newPassword}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                className={errors.confirmPassword ? "error" : ""}
                            />
                            {errors.confirmPassword && (
                                <span className="error-message">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <button type="submit" className="auth-button" disabled={isLoading}>
                            {isLoading ? "Resetting Password..." : "Reset Password"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>

                <div className="auth-image">
                    <div className="auth-overlay">
                        <div className="auth-quote">
                            <h3>
                                "Education is the passport to the future, for tomorrow belongs
                                to those who prepare for it today."
                            </h3>
                            <p>- Malcolm X</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;