import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/InstructorDashboard.module.css';
import { FaBook, FaClipboardList, FaEdit, FaTrashAlt, FaPlus, FaUsers, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

// Use global API config
const API_BASE_URL = `${window.API_CONFIG.BASE_URL}/api`;

const InstructorDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        courseCount: 0,
        assessmentCount: 0,
        studentCount: 0,
        completionCount: 0
    });

    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const instructorId = currentUser.id || currentUser.Id;

                // Fetch courses
                const coursesResponse = await axios.get(`${API_BASE_URL}/CourseModels`);
                const instructorCourses = coursesResponse.data.filter(course => 
                    String(course.instructorId || course.InstructorId) === String(instructorId)
                );
                
                // Fetch assessments
                const assessmentsResponse = await axios.get(`${API_BASE_URL}/AssessmentModels`);
                const courseIds = instructorCourses.map(c => c.courseId || c.CourseId);
                const instructorAssessments = assessmentsResponse.data.filter(assessment => 
                    courseIds.includes(assessment.courseId || assessment.CourseId)
                );

                // Fetch results for statistics
                const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`);
                const assessmentIds = instructorAssessments.map(a => a.assessmentId || a.AssessmentId);
                
                // Calculate statistics
                const assessmentResults = resultsResponse.data.filter(result => 
                    assessmentIds.includes(result.assessmentId || result.AssessmentId)
                );
                
                const uniqueStudentIds = [...new Set(assessmentResults.map(result => 
                    result.studentId || result.StudentId
                ))];

                setCourses(instructorCourses);
                setAssessments(instructorAssessments);
                setStats({
                    courseCount: instructorCourses.length,
                    assessmentCount: instructorAssessments.length,
                    studentCount: uniqueStudentIds.length,
                    completionCount: assessmentResults.length
                });
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, navigate]);

    // Function to generate gradient background colors for course cards
    const getGradientBackground = (index) => {
        const gradients = [
            'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
            'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(90deg, #30cfd0 0%, #330867 100%)'
        ];
        return gradients[index % gradients.length];
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
                <h1>Welcome back, {currentUser?.name || currentUser?.Name || 'Instructor'}</h1>
                <p>Manage your courses and assessments from your instructor dashboard</p>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaBook />
                    </div>
                    <div className={styles.statInfo}>
                        <h2>Your Courses</h2>
                        <p>{stats.courseCount}</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaClipboardList />
                    </div>
                    <div className={styles.statInfo}>
                        <h2>Assessments</h2>
                        <p>{stats.assessmentCount}</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaUsers />
                    </div>
                    <div className={styles.statInfo}>
                        <h2>Students</h2>
                        <p>{stats.studentCount}</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statInfo}>
                        <h2>Completions</h2>
                        <p>{stats.completionCount}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
                <Link to="/courses/create" className={styles.createCourseBtn}>
                    <FaPlus /> Create New Course
                </Link>
                <Link to="/assessment/create" className={styles.createAssessmentBtn}>
                    <FaPlus /> Create Assessment
                </Link>
            </div>

            {/* Courses Section */}
            <div className={styles.sectionHeader}>
                <h2><FaBook className={styles.sectionIcon} /> Your Courses</h2>
                <Link to="/courses" className={styles.viewAllLink}>View all</Link>
            </div>

            {courses.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't created any courses yet.</p>
                    <Link to="/courses/create" className={styles.createCourseBtn}>
                        <FaPlus /> Create Course
                    </Link>
                </div>
            ) : (
                <div className={styles.courseGrid}>
                    {courses.slice(0, 3).map((course, index) => {
                        const courseId = course.courseId || course.CourseId;
                        const title = course.title || course.Title;
                        const description = course.description || course.Description;
                        
                        // Count assessments for this course
                        const courseAssessmentCount = assessments.filter(
                            a => (a.courseId || a.CourseId) === courseId
                        ).length;
                        
                        return (
                            <div key={courseId} className={styles.courseCard}>
                                <div 
                                    className={styles.courseHeader} 
                                    style={{ background: getGradientBackground(index) }}
                                >
                                    <h3>{title}</h3>
                                    <div className={styles.courseActions}>
                                        <Link to={`/courses/${courseId}/edit`} className={styles.editButton}>
                                            <FaEdit />
                                        </Link>
                                        <button className={styles.deleteButton}>
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.courseBody}>
                                    <p className={styles.courseDescription}>
                                        {description || "No description provided"}
                                    </p>
                                    <div className={styles.courseDetails}>
                                        <span>{courseAssessmentCount} Assessments</span>
                                    </div>
                                    <Link to={`/courses/${courseId}`} className={styles.viewCourseBtn}>
                                        View Course
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Assessments Section */}
            <div className={styles.sectionHeader}>
                <h2><FaClipboardList className={styles.sectionIcon} /> Your Assessments</h2>
                <Link to="/assessments" className={styles.viewAllLink}>View all</Link>
            </div>

            {assessments.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't created any assessments yet.</p>
                    <Link to="/assessment/create" className={styles.createAssessmentBtn}>
                        <FaPlus /> Create Assessment
                    </Link>
                </div>
            ) : (
                <div className={styles.assessmentTable}>
                    <table>
                        <thead>
                            <tr>
                                <th>Assessment Title</th>
                                <th>Course</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map(assessment => {
                                const assessmentId = assessment.assessmentId || assessment.AssessmentId;
                                const courseId = assessment.courseId || assessment.CourseId;
                                const title = assessment.title || assessment.Title;
                                
                                // Find related course
                                const relatedCourse = courses.find(c => 
                                    (c.courseId || c.CourseId) === courseId
                                );
                                
                                const courseName = relatedCourse ? 
                                    (relatedCourse.title || relatedCourse.Title) : 
                                    'Unknown Course';
                                
                                return (
                                    <tr key={assessmentId}>
                                        <td>{title}</td>
                                        <td>
                                            <div className={styles.courseInfo}>
                                                <FaBook className={styles.courseIcon} />
                                                <span>{courseName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.assessmentActions}>
                                                <Link 
                                                    to={`/courses/${courseId}/assessment/${assessmentId}`} 
                                                    className={styles.viewButton}
                                                >
                                                    View
                                                </Link>
                                                <button className={styles.deleteButton}>
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
        </div>
    );
};

export default InstructorDashboard;