// // src/components/common/Footer.js
// import React from "react";
// import { Link } from "react-router-dom";
// import "../../styles/Footer.css";

// const Footer = () => {
//   return (
//     <footer className="footer">
//       <div className="container footer-container">
//         <div className="footer-logo">
//           <div className="logo-circle">E</div>
//           <span>EduSync</span>
//         </div>

//         <div className="footer-links">
//           <div className="footer-section">
//             <h3>Platform</h3>
//             <div className="horizontal-links">
//               <Link to="/courses">Courses</Link>
//               <span className="link-divider">•</span>
//               <Link to="/dashboard">Dashboard</Link>
//               <span className="link-divider">•</span>
//               <Link to="/assessments">Assessments</Link>
//             </div>
//           </div>
//         </div>

//         {/* Commented sections remain the same */}
//       </div>

//       <div className="footer-bottom">
//         <div className="container">
//           <p>&copy; {new Date().getFullYear()} EduSync. All rights reserved.</p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

import React from "react";
import { Link } from "react-router-dom";
import "../../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-circle">E</div>
              <span>EduSync</span>
            </div>
            <p className="brand-description">
              An innovative learning platform designed to help you develop new
              skills and advance your career with high-quality courses.
            </p>
          </div>

          <div className="footer-platform">
            <h3 className="platform-title">Platform</h3>
            <div className="platform-links">
              <Link to="/courses">Courses</Link>
              <Link to="/assessments">Assessments</Link>
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          <div className="copyright-text">
            &copy; {currentYear} EduSync. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;