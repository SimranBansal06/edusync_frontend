import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/StudentProgressPage.css';
import { FaGraduationCap, FaBook, FaClipboardList, FaSearch, FaChartBar } from 'react-icons/fa';

// Hardcoded Azure API URL
const API_BASE_URL = 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net/api';

// Create axios instance with retry and caching
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Increase timeout to 10 seconds
});

// Add retry logic
apiClient.interceptors.response.use(null, async (error) => {
    const { config } = error;
    // Set a default if retries aren't set yet
    config.retryCount = config.retryCount || 0;

    // Allow max 3 retries
    if (config.retryCount >= 3) {
        return Promise.reject(error);
    }

    // Increase retry count
    config.retryCount += 1;

    // Exponential backoff delay: 1s, 2s, 4s
    const delay = 1000 * Math.pow(2, config.retryCount - 1);

    // Return promise with retry after delay
    return new Promise(resolve => {
        setTimeout(() => resolve(apiClient(config)), delay);
    });
});

// Data cache storage
const dataCache = {
    courses: null,
    assessments: null,
    results: null,
    users: null,
    timestamp: null,
    // Cache expiration in milliseconds (5 minutes)
    expirationTime: 5 * 60 * 1000
};

const StudentProgressPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();
    const user = useMemo(() => JSON.parse(sessionStorage.getItem('user')) || { id: '1', role: 'Instructor', name: 'Demo Instructor' }, []);

    // Helper function to process cached data
    const processCachedData = (instructorId, instructorCourses) => {
        // Skip processing if instructorCourses is empty
        if (!instructorCourses || instructorCourses.length === 0) {
            setStudents([]);
            setResults([]);
            setFilteredResults([]);
            return;
        }

        const courseIds = instructorCourses.map(c => c.courseId || c.CourseId);

        const courseAssessments = dataCache.assessments.filter(assessment =>
            courseIds.includes(assessment.courseId || assessment.CourseId)
        );

        // If no assessments found for these courses, clear the results
        if (courseAssessments.length === 0) {
            setStudents([]);
            setResults([]);
            setFilteredResults([]);
            return;
        }

        const assessmentIds = courseAssessments.map(a => a.assessmentId || a.AssessmentId);

        const assessmentResults = dataCache.results.filter(result =>
            assessmentIds.includes(result.assessmentId || result.AssessmentId)
        );

        // If no results found for these assessments, clear the results
        if (assessmentResults.length === 0) {
            setStudents([]);
            setResults([]);
            setFilteredResults([]);
            return;
        }

        const studentIds = [...new Set(assessmentResults.map(r => r.userId || r.UserId))];

        const studentUsers = dataCache.users.filter(user =>
            studentIds.includes(user.userId || user.UserId)
        );

        setStudents(studentUsers);

        const processedResults = assessmentResults.map(result => {
            const assessment = courseAssessments.find(a =>
                (a.assessmentId || a.AssessmentId) === (result.assessmentId || result.AssessmentId)
            );

            const course = instructorCourses.find(c =>
                (c.courseId || c.CourseId) === (assessment?.courseId || assessment?.CourseId)
            );

            const student = studentUsers.find(s =>
                (s.userId || s.UserId) === (result.userId || result.UserId)
            );

            // Skip invalid data
            if (!assessment || !course || !student) {
                return null;
            }

            return {
                ...result,
                assessment: assessment,
                course: course,
                student: student,
                courseId: assessment?.courseId || assessment?.CourseId,
                studentId: result.userId || result.UserId,
                score: result.score || result.Score,
                maxScore: assessment?.maxScore || assessment?.MaxScore || 100,
                attemptDate: result.attemptDate || result.AttemptDate
            };
        }).filter(Boolean); // Remove any null values

        setResults(processedResults);
        setFilteredResults(processedResults);
    };

    // Create a memoized fetch function to prevent unnecessary re-fetches
    const fetchData = useCallback(async () => {
        setIsLoading(true);

        // Force cache refresh if timestamp is too old
        const now = new Date().getTime();
        const needsCacheRefresh = !dataCache.timestamp ||
            (now - dataCache.timestamp > dataCache.expirationTime);

        // Check if we have valid cached data
        if (!needsCacheRefresh &&
            dataCache.courses && dataCache.assessments &&
            dataCache.results && dataCache.users) {

            // Use cached data
            console.log("Using cached student progress data");

            const instructorId = user.id || user.userId;
            const instructorCourses = dataCache.courses.filter(course =>
                String(course.instructorId || course.InstructorId) === String(instructorId)
            );
            setCourses(instructorCourses);

            // Continue with cached data processing
            processCachedData(instructorId, instructorCourses);

            setIsLoading(false);
            return;
        }

        // Real API calls for production mode
        try {
            const instructorId = user.id || user.userId;

            // 1. Fetch instructor's courses - refresh the cache
            const coursesResponse = await apiClient.get('/CourseModels');
            dataCache.courses = coursesResponse.data;

            // Filter to just this instructor's courses
            const instructorCourses = coursesResponse.data.filter(course =>
                String(course.instructorId || course.InstructorId) === String(instructorId)
            );

            // Exit early if instructor has no courses
            if (!instructorCourses || instructorCourses.length === 0) {
                setCourses([]);
                setStudents([]);
                setResults([]);
                setFilteredResults([]);
                setIsLoading(false);
                return;
            }

            setCourses(instructorCourses);

            // 2. Get course IDs
            const courseIds = instructorCourses.map(c => c.courseId || c.CourseId);

            // 3. Fetch assessments for these courses
            const assessmentsResponse = await apiClient.get('/AssessmentModels');
            dataCache.assessments = assessmentsResponse.data;

            // Filter to assessments for these courses
            const courseAssessments = assessmentsResponse.data.filter(assessment =>
                courseIds.includes(assessment.courseId || assessment.CourseId)
            );

            // Exit early if no assessments found for these courses
            if (!courseAssessments || courseAssessments.length === 0) {
                setStudents([]);
                setResults([]);
                setFilteredResults([]);
                setIsLoading(false);
                return;
            }

            // 4. Get assessment IDs
            const assessmentIds = courseAssessments.map(a => a.assessmentId || a.AssessmentId);

            // 5. Fetch all results for these assessments
            const resultsResponse = await apiClient.get('/ResultModels');
            dataCache.results = resultsResponse.data;

            // Filter to only results for these assessments
            const assessmentResults = resultsResponse.data.filter(result =>
                assessmentIds.includes(result.assessmentId || result.AssessmentId)
            );

            // 6. Get student IDs from results
            const studentIds = [...new Set(assessmentResults.map(r => r.userId || r.UserId))];

            // Exit early if no results found
            if (!assessmentResults || assessmentResults.length === 0 || !studentIds || studentIds.length === 0) {
                setStudents([]);
                setResults([]);
                setFilteredResults([]);
                setIsLoading(false);
                return;
            }

            // 7. Fetch student data
            const usersResponse = await apiClient.get('/UserModels');
            dataCache.users = usersResponse.data;

            const studentUsers = usersResponse.data.filter(user =>
                studentIds.includes(user.userId || user.UserId)
            );

            setStudents(studentUsers);

            // 8. Process results with related data
            const processedResults = assessmentResults.map(result => {
                const assessment = courseAssessments.find(a =>
                    (a.assessmentId || a.AssessmentId) === (result.assessmentId || result.AssessmentId)
                );

                const course = instructorCourses.find(c =>
                    (c.courseId || c.CourseId) === (assessment?.courseId || assessment?.CourseId)
                );

                const student = studentUsers.find(s =>
                    (s.userId || s.UserId) === (result.userId || result.UserId)
                );

                // Skip invalid data - ensure orphaned references don't get included
                if (!assessment || !course || !student) {
                    return null;
                }

                return {
                    ...result,
                    assessment: assessment,
                    course: course,
                    student: student,
                    courseId: assessment?.courseId || assessment?.CourseId,
                    studentId: result.userId || result.UserId,
                    score: result.score || result.Score,
                    maxScore: assessment?.maxScore || assessment?.MaxScore || 100,
                    attemptDate: result.attemptDate || result.AttemptDate
                };
            }).filter(Boolean); // Remove any null values

            // Update cache timestamp
            dataCache.timestamp = now;

            setResults(processedResults);
            setFilteredResults(processedResults);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load student progress data. Please try again.");

            // If we have cached data and encounter an error, use the cache as a fallback
            if (dataCache.courses && dataCache.assessments && dataCache.results && dataCache.users) {
                console.log("Using cached data as fallback after error");
                const instructorId = user.id || user.userId;
                const instructorCourses = dataCache.courses.filter(course =>
                    String(course.instructorId || course.InstructorId) === String(instructorId)
                );
                setCourses(instructorCourses);

                processCachedData(instructorId, instructorCourses);
                setError("Using cached data. Some information may not be up-to-date.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Apply filters when filter criteria change
    useEffect(() => {
        if (results.length === 0) {
            setFilteredResults([]);
            return;
        }

        // Use this flag to prevent unnecessary state updates
        let shouldUpdate = false;

        let filtered = [...results];

        // First, filter out any results that reference deleted courses
        // This ensures orphaned data is removed when courses are deleted
        filtered = filtered.filter(result => {
            // Keep only results with valid course references
            return result.course && (result.course.title || result.course.Title);
        });

        // Only set shouldUpdate to true if filtered array doesn't equal the original results
        if (filtered.length !== results.length) {
            shouldUpdate = true;
        }

        // Filter by course
        if (selectedCourse !== 'all') {
            const preFilterLength = filtered.length;
            filtered = filtered.filter(result =>
                String(result.courseId) === String(selectedCourse)
            );
            if (preFilterLength !== filtered.length) {
                shouldUpdate = true;
            }
        }

        // Filter by student
        if (selectedStudent !== 'all') {
            const preFilterLength = filtered.length;
            filtered = filtered.filter(result =>
                String(result.studentId) === String(selectedStudent)
            );
            if (preFilterLength !== filtered.length) {
                shouldUpdate = true;
            }
        }

        // Filter by search term (student name or assessment name)
        if (searchTerm) {
            const preFilterLength = filtered.length;
            filtered = filtered.filter(result =>
                (result.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (result.student?.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (result.assessment?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (result.assessment?.Title || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (preFilterLength !== filtered.length) {
                shouldUpdate = true;
            }
        }

        // Only update state if filters actually changed the results
        if (shouldUpdate || filteredResults.length !== filtered.length) {
            setFilteredResults(filtered);
        }
    }, [selectedCourse, selectedStudent, searchTerm, results, filteredResults.length]);

    // Effect for authentication and initial data fetch
    useEffect(() => {
        if (!user || user.role !== 'Instructor') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [fetchData, user, navigate]);

    // Calculate overall statistics
    const calculateStats = () => {
        if (filteredResults.length === 0) {
            return {
                averageScore: 0,
                completionRate: 0,
                highestScore: 0,
                totalAttempts: 0
            };
        }

        const totalScore = filteredResults.reduce((sum, result) => sum + (result.score || 0), 0);
        const maxPossibleTotal = filteredResults.reduce((sum, result) => sum + (result.maxScore || 100), 0);
        const averagePercentage = (totalScore / maxPossibleTotal) * 100;

        // Find highest score (as percentage)
        const highestScorePercentage = Math.max(
            ...filteredResults.map(result => ((result.score || 0) / (result.maxScore || 100)) * 100)
        );

        return {
            averageScore: averagePercentage.toFixed(1),
            completionCount: filteredResults.length,
            highestScore: highestScorePercentage.toFixed(1),
            totalStudents: new Set(filteredResults.map(r => r.studentId)).size
        };
    };

    const stats = calculateStats();

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate score percentage
    const calculateScorePercentage = (score, maxScore) => {
        return Math.round((score / (maxScore || 100)) * 100);
    };

    // Get color based on score percentage
    const getScoreColor = (percentage) => {
        if (percentage >= 80) return '#4caf50';
        if (percentage >= 60) return '#8bc34a';
        if (percentage >= 40) return '#ffc107';
        return '#f44336';
    };

    if (!user) return null;

    return (
        <div className="student-progress-container">
            <div className="progress-header">
                <h1><FaGraduationCap className="header-icon" /> Student Progress</h1>
                <p>Monitor student performance and assessment completion</p>
                <div className="header-actions">
                    <Link to="/instructor" className="back-link">← Back to Dashboard</Link>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={() => fetchData()}>Retry</button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading student progress data...</p>
                </div>
            ) : (
                <>
                    {/* Stats Overview */}
                    <div className="stats-overview">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaChartBar />
                            </div>
                            <div className="stat-details">
                                <h3>Average Score</h3>
                                <p className="stat-value">{stats.averageScore}%</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaClipboardList />
                            </div>
                            <div className="stat-details">
                                <h3>Assessments Completed</h3>
                                <p className="stat-value">{stats.completionCount}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaGraduationCap />
                            </div>
                            <div className="stat-details">
                                <h3>Students</h3>
                                <p className="stat-value">{stats.totalStudents}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FaBook />
                            </div>
                            <div className="stat-details">
                                <h3>Highest Score</h3>
                                <p className="stat-value">{stats.highestScore}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters-container">
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by student or assessment name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-dropdown">
                            <FaBook className="filter-icon" />
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                            >
                                <option value="all">All Courses</option>
                                {courses.map(course => (
                                    <option
                                        key={course.courseId || course.CourseId}
                                        value={course.courseId || course.CourseId}
                                    >
                                        {course.title || course.Title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-dropdown">
                            <FaGraduationCap className="filter-icon" />
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                            >
                                <option value="all">All Students</option>
                                {students.map(student => (
                                    <option
                                        key={student.userId || student.UserId}
                                        value={student.userId || student.UserId}
                                    >
                                        {student.name || student.Name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Results Table */}
                    {filteredResults.length > 0 ? (
                        <div className="results-table-container">
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Course</th>
                                        <th>Assessment</th>
                                        <th>Score</th>
                                        <th>Date</th>
                                        <th>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.map((result, index) => {
                                        const scorePercentage = calculateScorePercentage(
                                            result.score,
                                            result.maxScore
                                        );
                                        return (
                                            <tr key={`result-${index}`}>
                                                <td>{result.student?.name || result.student?.Name || 'Unknown'}</td>
                                                <td>{result.course?.title || result.course?.Title || 'Unknown'}</td>
                                                <td>{result.assessment?.title || result.assessment?.Title || 'Unknown'}</td>
                                                <td>{result.score} / {result.maxScore || 100}</td>
                                                <td>{formatDate(result.attemptDate)}</td>
                                                <td>
                                                    <div className="progress-bar-container">
                                                        <div
                                                            className="progress-bar"
                                                            style={{
                                                                width: `${scorePercentage}%`,
                                                                backgroundColor: getScoreColor(scorePercentage)
                                                            }}
                                                        ></div>
                                                        <span className="progress-label">{scorePercentage}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <h3>No results found</h3>
                            <p>No student progress data matches your current filters.</p>
                            {(selectedCourse !== 'all' || selectedStudent !== 'all' || searchTerm) && (
                                <button
                                    className="reset-filters-btn"
                                    onClick={() => {
                                        setSelectedCourse('all');
                                        setSelectedStudent('all');
                                        setSearchTerm('');
                                    }}
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentProgressPage;