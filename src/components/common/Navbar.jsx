import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Navbar.css";
import {
  FaHome,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBook,
  FaClipboardList,
  FaChartBar,
  FaUser,
  FaSignOutAlt,
  FaUpload,
  FaPlusCircle,
  FaUserFriends,
} from "react-icons/fa";
import { MdMenu, MdClose } from "react-icons/md";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout, isInstructor, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getUserInitials = () => {
    if (!currentUser?.name) return "U";
    const nameParts = currentUser.name.split(" ");
    return nameParts.length === 1
      ? nameParts[0].charAt(0).toUpperCase()
      : `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-circle">E</div>
          <span>EduSync</span>
        </Link>

        {/* User Section */}
        <div className="navbar-user">
          {currentUser ? (
            <>
              <span className="welcome-text">Welcome, {currentUser.name.split(" ")[0]}</span>

              {/* User Dropdown */}
              <div className="user-menu-container" ref={menuRef}>
                <button
                  className="user-initials-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="User menu"
                  aria-expanded={isMenuOpen}
                >
                  {getUserInitials()}
                </button>

                {isMenuOpen && (
                  <div className="user-dropdown-menu">
                    {/* Student Specific Options */}
                    {isStudent() && (
                      <>
                        <Link to="/courses" className="dropdown-item">
                          <FaBook /> Courses
                        </Link>
                        <Link to="/assessments" className="dropdown-item">
                          <FaClipboardList /> Assessments
                        </Link>
                        <Link to="/results" className="dropdown-item">
                          <FaChartBar /> My Results
                        </Link>
                        <Link to="/profile" className="dropdown-item">
                          <FaUser /> Profile Settings
                        </Link>
                        <div className="dropdown-divider"></div>
                      </>
                    )}

                    {/* Instructor Specific Options */}
                    {isInstructor() && (
                      <>
                        <Link to="/instructor" className="dropdown-item">
                          <FaChalkboardTeacher /> Dashboard
                        </Link>
                        <Link to="/courses/create" className="dropdown-item">
                          <FaUpload /> Upload Course
                        </Link>
                        <Link to="/assessment/create" className="dropdown-item">
                          <FaPlusCircle /> Create Assessment
                        </Link>
                        <Link to="/student-progress" className="dropdown-item">
                          <FaUserFriends /> Student Progress
                        </Link>
                        <div className="dropdown-divider"></div>
                      </>
                    )}

                    {/* Common Options - Only Logout */}
                    <button
                      onClick={handleLogout}
                      className="dropdown-item logout-button"
                      aria-label="Logout"
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn login-btn">
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary register-btn">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}
        ref={mobileMenuRef}
      >
        <div className="mobile-menu-header">
          {currentUser ? (
            <div className="mobile-user-info">
              <div className="mobile-user-initials">{getUserInitials()}</div>
              <div>
                <p className="mobile-user-name">{currentUser.name}</p>
                <p className="mobile-user-role">
                  {isInstructor() ? "Instructor" : "Student"}
                </p>
              </div>
            </div>
          ) : (
            <h3>Menu</h3>
          )}
        </div>

        <div className="mobile-menu-items">
          <Link to="/" className="mobile-menu-item">
            <FaHome /> Home
          </Link>

          {currentUser ? (
            <>
              {/* Student Mobile Menu Options */}
              {isStudent() && (
                <>
                  <Link to="/courses" className="mobile-menu-item">
                    <FaBook /> Courses
                  </Link>
                  <Link to="/assessments" className="mobile-menu-item">
                    <FaClipboardList /> Assessments
                  </Link>
                  <Link to="/results" className="mobile-menu-item">
                    <FaChartBar /> My Results
                  </Link>
                  <Link to="/profile" className="mobile-menu-item">
                    <FaUser /> Profile
                  </Link>
                </>
              )}

              {/* Instructor Mobile Menu Options */}
              {isInstructor() && (
                <>
                  <Link to="/instructor" className="mobile-menu-item">
                    <FaChalkboardTeacher /> Dashboard
                  </Link>
                  <Link to="/courses/create" className="mobile-menu-item">
                    <FaUpload /> Upload Course
                  </Link>
                  <Link to="/assessment/create" className="mobile-menu-item">
                    <FaPlusCircle /> Create Assessment
                  </Link>
                  <Link to="/student-progress" className="mobile-menu-item">
                    <FaUserFriends /> Student Progress
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="mobile-menu-item logout-button"
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/courses" className="mobile-menu-item">
                <FaBook /> Courses
              </Link>
              <Link to="/login" className="mobile-menu-item">
                Login
              </Link>
              <Link to="/register" className="mobile-menu-item">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;