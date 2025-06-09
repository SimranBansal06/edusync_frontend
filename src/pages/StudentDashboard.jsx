import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/StudentDashboard.css';
import { FaChalkboardTeacher } from 'react-icons/fa';

// Define the API base URL using the global config
const API_BASE_URL = `${window.API_CONFIG.BASE_URL}/api`;

const StudentDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [results, setResults] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [courseAssessments, setCourseAssessments] = useState({});
    const [instructors, setInstructors] = useState({});

    const user = JSON.parse(sessionStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role === 'Instructor') {
            navigate('/instructor');
            return;
        }

        // Fetch all data without loading states
        axios.get(`${API_BASE_URL}/CourseModels`)
            .then(res => {
                setCourses(res.data);
                const enrolled = res.data.slice(0, 3); // Demo enrollment
                setEnrolledCourses(enrolled);

                // Fetch instructors for each course
                const instructorPromises = enrolled.map(course => {
                    const instructorId = course.instructorId || course.InstructorId;
                    if (instructorId) {
                        return axios.get(`${API_BASE_URL}/UserModels/${instructorId}`)
                            .then(instructorRes => {
                                return {
                                    courseId: course.courseId || course.CourseId,
                                    instructor: instructorRes.data
                                };
                            })
                            .catch(err => {
                                console.error(`Error fetching instructor for course ${course.courseId || course.CourseId}:`, err);
                                return null;
                            });
                    }
                    return Promise.resolve(null);
                });

                Promise.all(instructorPromises)
                    .then(instructorResults => {
                        const instructorsMap = {};
                        instructorResults.forEach(result => {
                            if (result) {
                                instructorsMap[result.courseId] = result.instructor;
                            }
                        });
                        setInstructors(instructorsMap);
                    });

                // Fetch assessments for each course
                enrolled.forEach(course => {
                    const courseId = course.courseId || course.CourseId;
                    axios.get(`${API_BASE_URL}/AssessmentModels`)
                        .then(assessmentRes => {
                            const assessments = assessmentRes.data.filter(
                                a => a.courseId === courseId || a.CourseId === courseId
                            );
                            setCourseAssessments(prev => ({
                                ...prev,
                                [courseId]: assessments
                            }));
                        });
                });
            });

        axios.get(`${API_BASE_URL}/ResultModels`)
            .then(res => {
                setResults(res.data.filter(r =>
                    r.userId === user.userId ||
                    r.UserId === user.userId ||
                    r.userId === user.UserId ||
                    r.UserId === user.UserId
                ));
            });
    }, [user, navigate]);

    const handleTakeAssessment = (courseId) => {
        navigate(`/courses/${courseId}/assessments`);
    };

    if (!user) return null;

    return (
        <div className="student-dashboard">
            <div className="dashboard-header">
                <h2>Student Dashboard</h2>
                <p className="welcome-message">Welcome, {user.name || user.Name}!</p>
            </div>

            <div className="dashboard-section">
                <h3>Your Enrolled Courses</h3>
                {enrolledCourses.length === 0 ? (
                    <div className="empty-state">
                        <p>You are not enrolled in any courses yet.</p>
                        <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
                    </div>
                ) : (
                    <div className="course-cards">
                        {enrolledCourses.map(course => {
                            const courseId = course.courseId || course.CourseId;
                            const assessments = courseAssessments[courseId] || [];
                            const hasAssessments = assessments.length > 0;
                            const instructor = instructors[courseId];

                            return (
                                <div key={courseId} className="course-card">
                                    <div className="course-info">
                                        <h4>{course.title || course.Title}</h4>
                                        <p>{course.description || course.Description}</p>
                                        {instructor && (
                                            <p className="course-instructor">
                                                <FaChalkboardTeacher /> Instructor: {instructor.name || instructor.Name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="course-actions">
                                        <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                                            Continue Learning
                                        </Link>
                                        <button
                                            onClick={() => handleTakeAssessment(courseId)}
                                            className={`btn ${hasAssessments ? 'btn-primary' : 'btn-disabled'}`}
                                            disabled={!hasAssessments}
                                        >
                                            {hasAssessments ? `Take Assessment` : 'No Assessments'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="browse-all">
                            <Link to="/courses" className="btn btn-outline">Browse All Courses</Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-section">
                <h3>Recommended Courses</h3>
                {courses.length === 0 ? (
                    <p className="empty-state">No recommended courses available.</p>
                ) : (
                    <div className="recommended-courses">
                        {courses.slice(0, 3).map(course => {
                            const courseId = course.courseId || course.CourseId;
                            const instructor = instructors[courseId];

                            return (
                                <div key={courseId} className="recommended-card">
                                    <h4>{course.title || course.Title}</h4>
                                    <p>{course.description || course.Description}</p>
                                    {instructor && (
                                        <p className="course-instructor">
                                            <FaChalkboardTeacher /> {instructor.name || instructor.Name}
                                        </p>
                                    )}
                                    <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                                        View Course
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="dashboard-section">
                <h3>Latest Quiz Results</h3>
                {results.length === 0 ? (
                    <p className="empty-state">You haven't taken any assessments yet.</p>
                ) : (
                    <div className="results-table-container">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Assessment</th>
                                    <th>Score</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.slice(0, 5).map(result => (
                                    <tr key={result.resultId || result.ResultId}>
                                        <td>{result.assessmentTitle || result.AssessmentTitle || 'Assessment'}</td>
                                        <td>{result.score || result.Score} / {result.maxScore || result.MaxScore}</td>
                                        <td>{new Date(result.attemptDate || result.AttemptDate).toLocaleDateString()}</td>
                                        <td>
                                            <Link
                                                to={`/results/${result.resultId || result.ResultId}`}
                                                className="btn btn-sm btn-outline"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;