// // src/pages/HomePage.jsx
// import React, { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import "../styles/HomePage.css";

// const HomePage = () => {
//   const { currentUser, isInstructor, isStudent } = useAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Only redirect if user is already logged in
//     if (currentUser) {
//       if (isInstructor()) {
//         navigate('/instructor');
//       } else if (isStudent()) {
//         navigate('/student');
//       } else {
//         navigate('/dashboard');
//       }
//     }
//   }, [currentUser, navigate, isInstructor, isStudent]);

//   return (
//     <div className="home-page">
//       {/* Hero Section */}
//       <section className="hero-section">
//         <div className="container hero-container">
//           <div className="hero-content">
//             <h1>
//               Learn New <br />
//               Skills Everyday
//             </h1>
//             <p>
//               Platform as learning media to be able to improve various skills
//               you want in an easy and effective way for anywhere and anytime
//             </p>
//             <div className="hero-buttons">
//               <Link to="/courses" className="btn">
//                 Explore Courses
//               </Link>
//               <Link to="/register" className="btn btn-secondary">
//                 Get Started
//               </Link>
//             </div>

//           </div>
//           <div className="hero-image">
//             <div className="image-grid">
//               <div className="image-box box1"></div>
//               <div className="image-box box2"></div>
//               <div className="image-box box3"></div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="features-section">
//         <div className="container">
//           <h2 className="section-title">Our Key Features</h2>
//           <div className="features-grid">
//             <div className="feature-card">
//               <div className="feature-icon-large">📚</div>
//               <h3>Comprehensive Courses</h3>
//               <p>Access a wide range of courses designed by industry experts</p>
//             </div>
//             <div className="feature-card">
//               <div className="feature-icon-large">🎯</div>
//               <h3>Interactive Assessments</h3>
//               <p>Test your knowledge with engaging quizzes and assignments</p>
//             </div>
//             <div className="feature-card">
//               <div className="feature-icon-large">📊</div>
//               <h3>Progress Tracking</h3>
//               <p>Monitor your learning journey with detailed analytics</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Call to Action Section */}
//       <section className="cta-section">
//         <div className="container">
//           <div className="cta-content">
//             <h2>Ready to Start Learning?</h2>
//             <p>
//               Join thousands of students and start improving your skills today
//             </p>
//             <Link to="/register" className="btn">
//               Get Started Now
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default HomePage;


// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/HomePage.css";

const HomePage = () => {
  const { currentUser } = useAuth();
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1>
              Learn New <br />
              Skills Everyday
            </h1>
            <p>
              Platform as learning media to be able to improve various skills
              you want in an easy and effective way for anywhere and anytime
            </p>
            <div className="hero-buttons">
              <Link to="/courses" className="btn">
                Explore Courses
              </Link>
              {!currentUser && (
                <Link to="/register" className="btn btn-secondary">
                  Get Started
                </Link>
              )}
            </div>

          </div>
          <div className="hero-image">
            <div className="image-grid">
              <div className="image-box box1"></div>
              <div className="image-box box2"></div>
              <div className="image-box box3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Our Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-large">📚</div>
              </div>
              <h3>Comprehensive Courses</h3>
              <p>Access a wide range of courses designed by industry experts</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-large">🎯</div>
              </div>
              <h3>Interactive Assessments</h3>
              <p>Test your knowledge with engaging quizzes and assignments</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-large">📊</div>
              </div>
              <h3>Progress Tracking</h3>
              <p>Monitor your learning journey with detailed analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Learning?</h2>
            <p>
              Join thousands of students and start improving your skills today
            </p>
            {!currentUser && (
              <Link to="/register" className="btn">
                Get Started Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;