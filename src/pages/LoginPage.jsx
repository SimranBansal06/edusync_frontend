import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "../styles/AuthPages.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      // You could set a success message state here if you want to show it
      console.log(location.state.message);
    }

    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Define the API base URL using the global config
  const API_BASE_URL = `${window.API_CONFIG.BASE_URL}/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      setErrors({});

      try {
        // Prepare login data
        const loginData = {
          email: formData.email,
          password: formData.password
        };

        console.log("Attempting login with:", loginData.email);

        // Make API request to auth endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log("Login successful:", response.data);

        // Use the login function from AuthContext
        login(response.data);

        // Handle "Remember me" - keep this functionality
        if (formData.rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        // IMPORTANT CHANGE: Redirect based on role
        // Instructors go to dashboard, students go to homepage
        if (response.data.role?.toLowerCase() === "instructor") {
          navigate("/instructor");
        } else {
          // Students go to homepage
          navigate("/");
        }
      } catch (error) {
        console.error("Login error:", error);

        if (error.response) {
          // Server responded with an error
          if (error.response.status === 401) {
            setErrors({ form: "Invalid email or password" });
          } else if (error.response.status === 404) {
            setErrors({ form: "User not found. Please check your email or register." });
          } else {
            setErrors({ form: error.response.data?.message || "Login failed" });
          }
        } else if (error.request) {
          // No response received
          setErrors({ form: "No response from server. Please check your connection and ensure the API is running." });
        } else {
          // Something else went wrong
          setErrors({ form: `An error occurred: ${error.message}` });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue to EduSync</p>
          </div>

          {errors.form && <div className="auth-error">{errors.form}</div>}

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
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? "error" : ""}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign Up</Link>
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

export default LoginPage;