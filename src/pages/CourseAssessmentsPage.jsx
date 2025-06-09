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

                // First get the course to find the instructor
                const courseResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels/${courseId}`);

                // If we have instructor ID, fetch instructor details
                const instructorId = courseResponse.data.instructorId || courseResponse.data.InstructorId;
                if (instructorId) {
                    const instructorResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/UserModels/${instructorId}`);
                    setInstructor(instructorResponse.data);
                }

                setCourse(courseResponse.data);

                // Then get all assessments and filter for this course
                const assessmentsResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/AssessmentModels`);
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