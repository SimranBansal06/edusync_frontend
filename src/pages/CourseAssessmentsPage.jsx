// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import axios from 'axios';
// import '../styles/CourseAssessmentsPage.css'; // Make sure this import path is correct

// const CourseAssessmentsPage = () => {
//     const { courseId } = useParams();
//     const navigate = useNavigate();
//     const [assessments, setAssessments] = useState([]);
//     const [course, setCourse] = useState(null);
//     const [instructor, setInstructor] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 setLoading(true);
//                 console.log("Fetching course assessments for courseId:", courseId);

//                 // Fetch course details first to get instructor ID
//                 const courseResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels/${courseId}`);
//                 setCourse(courseResponse.data);
//                 console.log("Course data:", courseResponse.data);

//                 // Fetch instructor details if instructor ID exists
//                 const instructorId = courseResponse.data.instructorId || courseResponse.data.InstructorId;
//                 if (instructorId) {
//                     try {
//                         const instructorResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/UserModels/${instructorId}`);
//                         setInstructor(instructorResponse.data);
//                         console.log("Instructor data:", instructorResponse.data);
//                     } catch (err) {
//                         console.error("Error fetching instructor details:", err);
//                         // Don't set error for instructor fetch failure
//                     }
//                 }

//                 // Fetch all assessments
//                 const assessmentsResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/AssessmentModels`);
//                 console.log("All assessments:", assessmentsResponse.data);

//                 // Filter to only this course's assessments
//                 const courseAssessments = assessmentsResponse.data.filter(assessment => {
//                     const assessmentCourseId = assessment.courseId || assessment.CourseId;
//                     console.log(`Comparing assessment courseId: ${assessmentCourseId} with ${courseId}`);
//                     return String(assessmentCourseId) === String(courseId);
//                 });

//                 console.log("Filtered assessments for this course:", courseAssessments);
//                 setAssessments(courseAssessments);
//             } catch (err) {
//                 console.error("Error fetching data:", err);
//                 setError("Failed to load assessments. Please try again later.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, [courseId]);

//     if (loading) {
//         return (
//             <div className="assessments-container">
//                 <div className="loading-text">
//                     <div className="loading-spinner"></div>
//                     Loading assessments...
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="assessments-container">
//                 <div className="empty-state">
//                     <p className="empty-state-title">{error}</p>
//                     <button onClick={() => window.location.reload()} className="assessment-button">
//                         Retry
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="assessments-container">
//             <div className="assessments-header">
//                 <h1 className="assessments-title">Course Assessments</h1>
//                 {course && (
//                     <p className="assessments-subtitle">
//                         {course.title || course.Title}
//                         {instructor && (
//                             <span className="instructor-info"> - Instructor: {instructor.name || instructor.Name}</span>
//                         )}
//                     </p>
//                 )}
//             </div>

//             {assessments.length === 0 ? (
//                 <div className="empty-state">
//                     <p className="empty-state-title">No assessments available for this course yet.</p>
//                     <Link to={`/courses/${courseId}`} className="back-button">
//                         ← Back to course
//                     </Link>
//                 </div>
//             ) : (
//                 <div className="assessment-grid">
//                     {assessments.map(assessment => (
//                         <div key={assessment.assessmentId || assessment.AssessmentId} className="assessment-card">
//                             <div className="assessment-card-header">
//                                 <h2 className="assessment-card-title">{assessment.title || assessment.Title}</h2>
//                             </div>
//                             <div className="assessment-card-body">
//                                 <div className="assessment-meta">
//                                     <span className="assessment-meta-item">
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                                             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
//                                         </svg>
//                                         {assessment.Questions ? JSON.parse(assessment.Questions).length : 0} questions
//                                     </span>
//                                     {instructor && (
//                                         <span className="assessment-meta-item instructor-meta">
//                                             by {instructor.name || instructor.Name}
//                                         </span>
//                                     )}
//                                 </div>
//                                 {assessment.description && (
//                                     <p className="assessment-description">{assessment.description}</p>
//                                 )}
//                                 <button
//                                     onClick={() => navigate(`/courses/${courseId}/assessment/${assessment.assessmentId || assessment.AssessmentId}`)}
//                                     className="assessment-button"
//                                 >
//                                     Start Assessment
//                                 </button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default CourseAssessmentsPage;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/CourseAssessmentsPage.css'; // Make sure this import path is correct

const CourseAssessmentsPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [course, setCourse] = useState(null);
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch course details first to get instructor ID
                const courseResponse = await axios.get(`https://localhost:7278/api/CourseModels/${courseId}`);
                setCourse(courseResponse.data);

                // Fetch instructor details if instructor ID exists
                const instructorId = courseResponse.data.instructorId || courseResponse.data.InstructorId;
                if (instructorId) {
                    try {
                        const instructorResponse = await axios.get(`https://localhost:7278/api/UserModels/${instructorId}`);
                        setInstructor(instructorResponse.data);
                    } catch (err) {
                        console.error("Error fetching instructor details:", err);
                        // Don't set error for instructor fetch failure
                    }
                }

                // Fetch assessments for the course
                const assessmentsResponse = await axios.get(`https://localhost:7278/api/AssessmentModels`);
                const courseAssessments = assessmentsResponse.data.filter(
                    a => a.courseId === courseId || a.CourseId === courseId
                );
                setAssessments(courseAssessments);
                setError(null);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    if (loading) {
        return (
            <div className="assessments-container">
                <div className="loading-text">
                    <div className="loading-spinner"></div>
                    Loading assessments...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assessments-container">
                <div className="empty-state">
                    <p className="empty-state-title">{error}</p>
                    <button onClick={() => window.location.reload()} className="assessment-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="assessments-container">
            <div className="assessments-header">
                <h1 className="assessments-title">Course Assessments</h1>
                {course && (
                    <p className="assessments-subtitle">
                        {course.title || course.Title}
                        {instructor && (
                            <span className="instructor-info"> - Instructor: {instructor.name || instructor.Name}</span>
                        )}
                    </p>
                )}
            </div>

            {assessments.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-state-title">No assessments available for this course yet.</p>
                    <Link to={`/courses/${courseId}`} className="back-button">
                        ← Back to course
                    </Link>
                </div>
            ) : (
                <div className="assessment-grid">
                    {assessments.map(assessment => (
                        <div key={assessment.assessmentId || assessment.AssessmentId} className="assessment-card">
                            <div className="assessment-card-header">
                                <h2 className="assessment-card-title">{assessment.title || assessment.Title}</h2>
                            </div>
                            <div className="assessment-card-body">
                                <div className="assessment-meta">
                                    <span className="assessment-meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        </svg>
                                        {assessment.Questions ? JSON.parse(assessment.Questions).length : 0} questions
                                    </span>
                                    {instructor && (
                                        <span className="assessment-meta-item instructor-meta">
                                            by {instructor.name || instructor.Name}
                                        </span>
                                    )}
                                </div>
                                {assessment.description && (
                                    <p className="assessment-description">{assessment.description}</p>
                                )}
                                <button
                                    onClick={() => navigate(`/courses/${courseId}/assessment/${assessment.assessmentId || assessment.AssessmentId}`)}
                                    className="assessment-button"
                                >
                                    Start Assessment
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseAssessmentsPage;