import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/CoursesPage.css";
import { FaSearch, FaBook, FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [instructors, setInstructors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all courses when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels`);
        setCourses(response.data);
        setFilteredCourses(response.data);

        // Fetch instructors for all courses
        const instructorIds = [...new Set(
          response.data.map(course => course.instructorId || course.InstructorId)
            .filter(id => id) // Filter out undefined or null ids
        )];

        if (instructorIds.length > 0) {
          const instructorPromises = instructorIds.map(instructorId =>
            fetchInstructor(instructorId)
              .then(res => ({ id: instructorId, data: res.data }))
              .catch(err => {
                console.error(`Error fetching instructor ${instructorId}:`, err);
                return null;
              })
          );

          const instructorResults = await Promise.all(instructorPromises);
          const instructorsMap = {};

          instructorResults.forEach(result => {
            if (result) {
              instructorsMap[result.id] = result.data;
            }
          });

          setInstructors(instructorsMap);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Update instructor call
  const fetchInstructor = async (instructorId) => {
    try {
      return await axios.get(`${window.API_CONFIG.BASE_URL}/api/UserModels/${instructorId}`);
    } catch (error) {
      console.error("Error fetching instructor:", error);
      return null;
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    filterCourses(searchTerm);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterCourses(value);
  };

  // Filter courses based on search term
  const filterCourses = (term) => {
    if (!term.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const filtered = courses.filter(course => {
      const courseId = (course.courseId || course.CourseId || '').toString().toLowerCase();
      const title = (course.title || course.Title || '').toLowerCase();
      const description = (course.description || course.Description || '').toLowerCase();

      // Get instructor name if available
      const instructorId = course.instructorId || course.InstructorId;
      let instructorName = '';
      if (instructorId && instructors[instructorId]) {
        instructorName = (instructors[instructorId].name || instructors[instructorId].Name || '').toLowerCase();
      }

      const term_lower = term.toLowerCase();

      return courseId.includes(term_lower) ||
        title.includes(term_lower) ||
        description.includes(term_lower) ||
        instructorName.includes(term_lower);
    });

    setFilteredCourses(filtered);
  };

  // Generate random background color for course cards
  const getRandomBgColor = (title) => {
    const colors = [
      'rgba(139, 15, 35, 0.9)',  // Dark burgundy
      'rgba(139, 15, 35, 0.8)',  // Medium burgundy
      'rgba(139, 15, 35, 0.7)',  // Light burgundy
      'rgba(28, 46, 74, 0.9)',   // Dark navy
      'rgba(28, 46, 74, 0.8)',   // Medium navy
      'rgba(28, 46, 74, 0.7)',   // Light navy
    ];

    let sum = 0;
    for (let i = 0; i < (title || '').length; i++) {
      sum += title.charCodeAt(i);
    }

    return colors[sum % colors.length];
  };

  return (
    <div className="courses-page">
      <div className="courses-banner">
        <div className="container">
          <div className="courses-banner-content">
            <h1>Discover Our Courses</h1>
            <p>Explore our wide range of courses designed to help you develop new skills and advance your career</p>

            <form className="course-search-form" onSubmit={handleSearch}>
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by course name or keyword..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  className="course-search-input"
                />
              </div>
              <button type="submit" className="search-button">Search</button>
            </form>
          </div>
        </div>
      </div>

      <div className="courses-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon"><FaBook /></div>
              <div className="stat-content">
                <div className="stat-number">{courses.length}</div>
                <div className="stat-label">Available Courses</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaUserGraduate /></div>
              <div className="stat-content">
                <div className="stat-number">500+</div>
                <div className="stat-label">Students Enrolled</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaChalkboardTeacher /></div>
              <div className="stat-content">
                <div className="stat-number">20+</div>
                <div className="stat-label">Expert Instructors</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="courses-content container">
        {isLoading ? (
          <div className="courses-loading">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : error ? (
          <div className="courses-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="reload-button">Try Again</button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="no-courses">
            <h2>No courses found</h2>
            <p>No courses match your search criteria. Please try a different search term.</p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilteredCourses(courses);
                }}
                className="clear-search-button"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="courses-result-header">
              <h2>Available Courses</h2>
              <p>Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}</p>
            </div>

            <div className="courses-grid">
              {filteredCourses.map(course => {
                const courseId = course.courseId || course.CourseId;
                const title = course.title || course.Title;
                const description = course.description || course.Description;
                const instructorId = course.instructorId || course.InstructorId;
                const instructor = instructorId ? instructors[instructorId] : null;

                return (
                  <div className="course-card" key={courseId}>
                    <div className="course-card-header" style={{ backgroundColor: getRandomBgColor(title) }}>
                      <h2>{title}</h2>
                    </div>
                    <div className="course-card-body">
                      <p className="course-description">{description}</p>
                      {instructor && (
                        <div className="course-instructor">
                          <FaChalkboardTeacher className="instructor-icon" />
                          <span>Instructor: {instructor.name || instructor.Name}</span>
                        </div>
                      )}
                      <Link to={`/courses/${courseId}`} className="view-course-btn">
                        View Course
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;