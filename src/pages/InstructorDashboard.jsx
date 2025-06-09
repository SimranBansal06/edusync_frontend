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
    const [authDebug, setAuthDebug] = useState({
        hasCurrentUser: false,
        userRole: null,
        sessionStorageUser: null,
        isInstructorResult: false
    });
    const [apiDebug, setApiDebug] = useState({
        apiBaseUrl: API_BASE_URL,
        instructorId: null,
        coursesResponse: null,
        assessmentsResponse: null,
        error: null
    });

    const navigate = useNavigate();
    const { currentUser, isInstructor } = useAuth();

    // Add debugging effect
    useEffect(() => {
        try {
            const sessionUser = JSON.parse(sessionStorage.getItem('user'));
            setAuthDebug({
                hasCurrentUser: !!currentUser,
                userRole: currentUser?.role || 'no role',
                sessionStorageUser: sessionUser ? {
                    hasUser: true,
                    role: sessionUser.role || 'no role in session',
                    userId: sessionUser.id || sessionUser.Id || sessionUser.userId || sessionUser.UserId || 'no id found'
                } : 'no user in session',
                isInstructorResult: isInstructor()
            });
            console.log('Auth Debug:', {
                currentUser,
                sessionUser,
                isInstructorResult: isInstructor()
            });
        } catch (error) {
            console.error('Error in debug code:', error);
        }
    }, [currentUser, isInstructor]);

    useEffect(() => {
        if (!currentUser && !sessionStorage.getItem('user')) {
            console.log('No user data, redirecting to login');
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Get user data either from context or session storage
                let userData = currentUser;
                if (!userData) {
                    try {
                        userData = JSON.parse(sessionStorage.getItem('user'));
                    } catch (e) {
                        console.error('Error parsing user from session storage:', e);
                    }
                }
                
                if (!userData) {
                    console.error('No user data available');
                    setApiDebug(prev => ({...prev, error: 'No user data available'}));
                    setLoading(false);
                    return;
                }
                
                // Try multiple possible ID field names
                const instructorId = userData.id || userData.Id || userData.userId || userData.UserId;
                console.log('Fetching data for instructor ID:', instructorId);
                setApiDebug(prev => ({...prev, instructorId}));

                if (!instructorId) {
                    console.error('Could not determine instructor ID');
                    setApiDebug(prev => ({...prev, error: 'Could not determine instructor ID'}));
                    setLoading(false);
                    return;
                }

                // Fetch courses with error handling
                try {
                    console.log('Fetching courses from:', `${API_BASE_URL}/CourseModels`);
                    const coursesResponse = await axios.get(`${API_BASE_URL}/CourseModels`);
                    console.log('Courses response:', coursesResponse.data);
                    
                    // Log all possible instructor ID fields in courses
                    if (coursesResponse.data.length > 0) {
                        const firstCourse = coursesResponse.data[0];
                        console.log('First course instructor ID fields:', {
                            instructorId: firstCourse.instructorId,
                            InstructorId: firstCourse.InstructorId,
                            instructor_id: firstCourse.instructor_id
                        });
                    }
                    
                    // Try to match on multiple possible ID field names
                    const instructorCourses = coursesResponse.data.filter(course => {
                        const courseInstructorId = course.instructorId || course.InstructorId || course.instructor_id;
                        return String(courseInstructorId) === String(instructorId);
                    });
                    
                    console.log('Instructor courses:', instructorCourses);
                    setCourses(instructorCourses);
                    setApiDebug(prev => ({...prev, coursesResponse: {
                        total: coursesResponse.data.length,
                        filtered: instructorCourses.length,
                        sample: instructorCourses.slice(0, 2)
                    }}));
                    
                    // Fetch assessments
                    const assessmentsResponse = await axios.get(`${API_BASE_URL}/AssessmentModels`);
                    console.log('Assessments response:', assessmentsResponse.data);
                    
                    const courseIds = instructorCourses.map(c => c.courseId || c.CourseId || c.id || c.Id);
                    const instructorAssessments = assessmentsResponse.data.filter(assessment => {
                        const assessmentCourseId = assessment.courseId || assessment.CourseId || assessment.course_id;
                        return courseIds.includes(assessmentCourseId);
                    });
                    
                    console.log('Instructor assessments:', instructorAssessments);
                    setAssessments(instructorAssessments);
                    setApiDebug(prev => ({...prev, assessmentsResponse: {
                        total: assessmentsResponse.data.length,
                        filtered: instructorAssessments.length,
                        sample: instructorAssessments.slice(0, 2)
                    }}));

                    // Fetch results for statistics
                    const resultsResponse = await axios.get(`${API_BASE_URL}/ResultModels`);
                    const assessmentIds = instructorAssessments.map(a => a.assessmentId || a.AssessmentId || a.id || a.Id);
                    
                    // Calculate statistics
                    const assessmentResults = resultsResponse.data.filter(result => {
                        const resultAssessmentId = result.assessmentId || result.AssessmentId || result.assessment_id;
                        return assessmentIds.includes(resultAssessmentId);
                    });
                    
                    const uniqueStudentIds = [...new Set(assessmentResults.map(result => 
                        result.studentId || result.StudentId || result.student_id
                    ))];

                    setStats({
                        courseCount: instructorCourses.length,
                        assessmentCount: instructorAssessments.length,
                        studentCount: uniqueStudentIds.length,
                        completionCount: assessmentResults.length
                    });
                    
                } catch (apiError) {
                    console.error("API Error:", apiError);
                    setApiDebug(prev => ({...prev, error: `API Error: ${apiError.message}`}));
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setApiDebug(prev => ({...prev, error: `General Error: ${error.message}`}));
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
            {/* Debug Info */}
            <div style={{padding: '10px', margin: '10px 0', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px'}}>
                <h4>Auth Debug Info:</h4>
                <pre>{JSON.stringify(authDebug, null, 2)}</pre>
                <h4>API Debug Info:</h4>
                <pre>{JSON.stringify(apiDebug, null, 2)}</pre>
            </div>

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
                        const courseId = course.courseId || course.CourseId || course.id || course.Id;
                        const title = course.title || course.Title;
                        const description = course.description || course.Description;
                        
                        // Count assessments for this course
                        const courseAssessmentCount = assessments.filter(a => {
                            const assessmentCourseId = a.courseId || a.CourseId || a.course_id;
                            return assessmentCourseId === courseId;
                        }).length;
                        
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
                                const assessmentId = assessment.assessmentId || assessment.AssessmentId || assessment.id || assessment.Id;
                                const courseId = assessment.courseId || assessment.CourseId || assessment.course_id;
                                const title = assessment.title || assessment.Title;
                                
                                // Find related course
                                const relatedCourse = courses.find(c => {
                                    const cId = c.courseId || c.CourseId || c.id || c.Id;
                                    return cId === courseId;
                                });
                                
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