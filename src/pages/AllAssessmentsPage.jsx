import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AllAssessmentsPage.css';
import { FaSearch, FaListUl, FaTimes, FaChalkboardTeacher } from 'react-icons/fa';

const AllAssessmentsPage = () => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        assessments: [],
        loading: true,
        error: null,
        searchQuery: '',
        filterOpen: false
    });
    const [filteredAssessments, setFilteredAssessments] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [instructors, setInstructors] = useState({});

    // Fetch all assessments and courses for details
    useEffect(() => {
        const fetchData = async () => {
            try {
                setState(prevState => ({ ...prevState, loading: true }));

                // Fetch all assessments
                const assessmentsResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/AssessmentModels`);

                // Fetch courses for additional details
                const coursesResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels`);

                // Create a lookup map for course details
                const courseMap = {};
                coursesResponse.data.forEach(course => {
                    courseMap[course.courseId || course.CourseId] = {
                        title: course.title || course.Title,
                        instructorId: course.instructorId || course.InstructorId
                    };
                });

                // Fetch instructor details for each course
                const instructorPromises = Object.values(courseMap)
                    .filter(course => course.instructorId)
                    .map(course => {
                        return axios.get(`${window.API_CONFIG.BASE_URL}/api/UserModels/${course.instructorId}`)
                            .then(response => {
                                return { instructorId: course.instructorId, instructorData: response.data };
                            })
                            .catch(error => {
                                console.error(`Error fetching instructor ${course.instructorId}:`, error);
                                return { instructorId: course.instructorId, instructorData: null };
                            });
                    });

                const instructorResults = await Promise.all(instructorPromises);

                const instructorsMap = {};
                instructorResults.forEach(result => {
                    if (result.instructorData) {
                        instructorsMap[result.instructorId] = result.instructorData;
                    }
                });

                setInstructors(instructorsMap);

                // Combine assessment data with course data
                const combinedAssessments = assessmentsResponse.data.map(assessment => {
                    const courseId = assessment.courseId || assessment.CourseId;
                    const courseInfo = courseMap[courseId] || { title: 'Unknown Course' };
                    const instructorId = courseInfo.instructorId;
                    const instructor = instructorId ? instructorsMap[instructorId] : null;

                    // Parse questions to get question count
                    let questionCount = 0;

                    if (assessment.questions || assessment.Questions) {
                        try {
                            const questions = JSON.parse(assessment.questions || assessment.Questions);
                            questionCount = questions.length;
                        } catch (e) {
                            console.warn("Could not parse questions for assessment", assessment.assessmentId);
                        }
                    }

                    return {
                        ...assessment,
                        assessmentId: assessment.assessmentId || assessment.AssessmentId,
                        title: assessment.title || assessment.Title,
                        courseId: courseId,
                        courseTitle: courseInfo.title,
                        courseDescription: courseInfo.description,
                        instructorId: instructorId,
                        instructorName: instructor ? (instructor.name || instructor.Name) : null,
                        questionCount: questionCount
                    };
                });

                setState(prevState => ({
                    ...prevState,
                    assessments: combinedAssessments,
                    filteredAssessments: combinedAssessments,
                    error: null
                }));
            } catch (err) {
                console.error("Error fetching data:", err);
                setState(prevState => ({ ...prevState, error: "Failed to load assessments. Please try again." }));
            } finally {
                setState(prevState => ({ ...prevState, loading: false }));
            }
        };

        fetchData();
    }, []);

    // Filter assessments based on search term and active filter
    useEffect(() => {
        let filtered = [...state.assessments];

        // Apply search filter if search term exists
        if (state.searchQuery.trim()) {
            const searchLower = state.searchQuery.toLowerCase();
            filtered = filtered.filter(assessment => {
                return (
                    assessment.title.toLowerCase().includes(searchLower) ||
                    assessment.courseTitle.toLowerCase().includes(searchLower) ||
                    (assessment.instructorName && assessment.instructorName.toLowerCase().includes(searchLower))
                );
            });
        }

        // Apply course category filter if not "all"
        if (activeFilter !== 'all') {
            filtered = filtered.filter(assessment => {
                return assessment.courseTitle.toLowerCase() === activeFilter.toLowerCase();
            });
        }

        setFilteredAssessments(filtered);
    }, [state.searchQuery, activeFilter, state.assessments]);

    const handleAssessmentClick = (courseId, assessmentId) => {
        navigate(`/courses/${courseId}/assessment/${assessmentId}`);
    };

    // Get unique course titles for filter options
    const getUniqueCourses = () => {
        const uniqueTitles = new Set(state.assessments.map(a => a.courseTitle));
        return Array.from(uniqueTitles);
    };

    // Clear all filters
    const clearFilters = () => {
        setState(prevState => ({
            ...prevState,
            searchQuery: '',
            activeFilter: 'all'
        }));
    };

    if (state.loading) {
        return (
            <div className="assessments-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading assessments...</p>
                </div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="assessments-page">
                <div className="error-container">
                    <h2>Unable to load assessments</h2>
                    <p>{state.error}</p>
                    <button className="primary-button" onClick={() => window.location.reload()}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="assessments-page">
            <div className="assessments-header">
                <h1>All Assessments</h1>
                <div className="header-subtitle">
                    Complete assessments to test your knowledge and progress
                </div>
            </div>

            <div className="filters-section">
                <div className="search-container">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by course, assessment, or instructor..."
                        value={state.searchQuery}
                        onChange={(e) => setState(prevState => ({ ...prevState, searchQuery: e.target.value }))}
                        className="search-input"
                    />
                    {state.searchQuery && (
                        <button
                            className="clear-search"
                            onClick={() => setState(prevState => ({ ...prevState, searchQuery: '' }))}
                            aria-label="Clear search"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        All
                    </button>
                    {getUniqueCourses().map(course => (
                        <button
                            key={course}
                            className={`filter-tab ${activeFilter === course ? 'active' : ''}`}
                            onClick={() => setActiveFilter(course)}
                        >
                            {course}
                        </button>
                    ))}
                </div>

                {(state.searchQuery || activeFilter !== 'all') && (
                    <div className="active-filters">
                        <span>Active filters:</span>
                        {state.searchQuery && (
                            <div className="filter-pill">
                                Search: {state.searchQuery}
                                <button onClick={() => setState(prevState => ({ ...prevState, searchQuery: '' }))} >×</button>
                            </div>
                        )}
                        {activeFilter !== 'all' && (
                            <div className="filter-pill">
                                Course: {activeFilter}
                                <button onClick={() => setActiveFilter('all')}>×</button>
                            </div>
                        )}
                        <button className="clear-all-filters" onClick={clearFilters}>
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {filteredAssessments.length === 0 ? (
                <div className="no-results">
                    <div className="no-results-content">
                        <h2>No assessments found</h2>
                        <p>We couldn't find any assessments matching your criteria</p>
                        <button className="primary-button" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="assessments-grid">
                    {filteredAssessments.map(assessment => (
                        <div
                            key={assessment.assessmentId}
                            className="assessment-card"
                            onClick={() => handleAssessmentClick(assessment.courseId, assessment.assessmentId)}
                        >
                            <div className="assessment-card-header" style={{ backgroundColor: generateRandomColor(assessment.courseTitle) }}>
                                <h2 className="assessment-title">{assessment.title}</h2>
                                <div className="course-badge">{assessment.courseTitle}</div>
                            </div>
                            <div className="assessment-card-body">
                                <div className="assessment-meta">
                                    <div className="meta-item">
                                        <FaListUl className="meta-icon" />
                                        <span>{assessment.questionCount} questions</span>
                                    </div>
                                    {assessment.instructorName && (
                                        <div className="meta-item instructor-meta">
                                            <FaChalkboardTeacher className="meta-icon" />
                                            <span>{assessment.instructorName}</span>
                                        </div>
                                    )}
                                </div>
                                <button className="start-button">
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

// Helper function to generate consistent pastel colors based on course name
function generateRandomColor(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate a pastel blue shade
    const h = Math.abs(hash) % 30 + 210; // Blue hue range
    const s = 60 + (Math.abs(hash) % 20); // Moderate saturation
    const l = 65 + (Math.abs(hash) % 15); // Light but not too light

    return `hsl(${h}, ${s}%, ${l}%)`;
}

export default AllAssessmentsPage;