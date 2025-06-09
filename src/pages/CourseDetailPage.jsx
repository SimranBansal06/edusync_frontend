import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/CourseDetailPage.css";
import { FaArrowLeft, FaClipboardCheck, FaDownload, FaExternalLinkAlt, FaFileAlt, FaChalkboardTeacher } from "react-icons/fa";
import { downloadFile, openFileInBrowser } from "../services/downloadService";

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Function to check if a URL is from YouTube
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Function to get direct download URL for a file
  const getDirectDownloadUrl = (url) => {
    if (!url) return '';

    try {
      console.log("[CourseDetail] Getting download URL for:", url);

      // If it's already a full URL (including protocol), return it as is
      if (url.startsWith('http')) {
        console.log("[CourseDetail] URL is already absolute:", url);
        return url;
      }

      // First, check if this is a path to our uploads directory
      if (url.includes('/uploads/')) {
        // Ensure we have the complete URL with our API base
        const fullUrl = `${window.API_CONFIG.BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
        console.log("[CourseDetail] URL is uploads path, using:", fullUrl);
        return fullUrl;
      }

      // If it's just a filename (likely a GUID), use the download API endpoint
      if (!url.includes('/')) {
        const downloadUrl = `${window.API_CONFIG.BASE_URL}/api/CourseModels/download/${url}`;
        console.log("[CourseDetail] URL is filename, using download endpoint:", downloadUrl);
        return downloadUrl;
      }

      // For other cases, construct a proper URL with the API base
      const finalUrl = `${window.API_CONFIG.BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
      console.log("[CourseDetail] Using constructed URL:", finalUrl);
      return finalUrl;
    } catch (e) {
      console.error("[CourseDetail] Error creating direct download URL:", e);
      return url; // Return original URL as fallback
    }
  };

  // Function to check if a URL is a file from our uploads directory
  const isUploadedFile = (url) => {
    if (!url) return false;
    return url.includes('/uploads/');
  };

  // Function to get file name from URL
  const getFileName = (url) => {
    if (!url) return 'File';
    try {
      // Extract filename from URL
      const pathParts = new URL(url).pathname.split('/');
      const fullFileName = pathParts[pathParts.length - 1];

      // Remove the UUID prefix if present (format: UUID_filename.ext)
      const nameParts = fullFileName.split('_');
      if (nameParts.length > 1 && nameParts[0].length === 36) {
        // If it looks like our UUID_filename format
        return nameParts.slice(1).join('_');
      }

      return fullFileName;
    } catch (e) {
      return 'File';
    }
  };

  // Function to get file extension from URL
  const getFileExtension = (url) => {
    if (!url) return '';
    try {
      const fileName = getFileName(url);
      const parts = fileName.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    } catch (e) {
      return '';
    }
  };

  // Function to get file type icon based on extension
  const getFileIcon = (url) => {
    const ext = getFileExtension(url);

    // Return appropriate icon based on file extension
    switch (ext) {
      case 'pdf':
        return "📄";
      case 'doc':
      case 'docx':
        return "📝";
      case 'xls':
      case 'xlsx':
        return "📊";
      case 'ppt':
      case 'pptx':
        return "📑";
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return "🖼️";
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'webm':
        return "🎬";
      case 'mp3':
      case 'wav':
      case 'ogg':
        return "🎵";
      default:
        return "📁";
    }
  };

  // Function to get the hostname from a URL in a user-friendly format
  const getHostname = (url) => {
    if (!url) return 'external site';
    try {
      // Extract hostname from URL
      const hostname = new URL(url).hostname;

      // Remove www. if present
      let cleanHostname = hostname.replace('www.', '');

      // Extract domain name without TLD
      const domainParts = cleanHostname.split('.');
      if (domainParts.length >= 2) {
        cleanHostname = domainParts[domainParts.length - 2];
      }

      // Capitalize first letter
      return cleanHostname.charAt(0).toUpperCase() + cleanHostname.slice(1);
    } catch (e) {
      // If URL parsing fails, return generic text
      return 'external site';
    }
  };

  // Function to format video URLs for embedding
  const formatVideoUrl = (url) => {
    if (!url) return '';

    // Handle YouTube URLs
    // Match different YouTube URL formats
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      // Extract video ID and return proper embed URL
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // If the URL already has /embed/ in it, it's likely already formatted correctly
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    // For other video providers or if not matching our patterns, return as is
    return url;
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels/${id}`);
        setCourse(response.data);

        // Fetch instructor information if instructorId exists
        const instructorId = response.data.instructorId || response.data.InstructorId;
        if (instructorId) {
          try {
            const instructorResponse = await axios.get(`${window.API_CONFIG.BASE_URL}/api/UserModels/${instructorId}`);
            setInstructor(instructorResponse.data);
          } catch (err) {
            console.error("Error fetching instructor details:", err);
            // Don't set error for instructor fetch failure
          }
        }
      } catch (err) {
        console.error("Error fetching course details:", err);
        if (err.response && err.response.status === 404) {
          setError("Course not found");
        } else {
          setError("Failed to load course details. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  const handleBackClick = () => {
    navigate("/courses");
  };

  // Function to handle file download
  const handleDownload = async (url, fileName) => {
    setDownloadError(null);
    console.log("[CourseDetail] Initiating download for:", fileName, "URL:", url);

    if (!url) {
      setDownloadError("Invalid file URL. Please contact support.");
      return;
    }

    const success = await downloadFile(url, fileName);
    if (!success) {
      console.error("[CourseDetail] Download failed for:", url);
      setDownloadError("Failed to download file. The file may not exist or the server is not responding.");
    } else {
      console.log("[CourseDetail] Download successful for:", fileName);
    }
  };

  // Function to handle file view in browser
  const handleViewInBrowser = (url) => {
    setDownloadError(null);
    console.log("[CourseDetail] Opening in browser:", url);

    if (!url) {
      setDownloadError("Invalid file URL. Please contact support.");
      return;
    }

    const success = openFileInBrowser(url);
    if (!success) {
      console.error("[CourseDetail] Failed to open in browser:", url);
      setDownloadError("Failed to open file in browser. The file may not exist or the server is not responding.");
    } else {
      console.log("[CourseDetail] Successfully opened in browser:", url);
    }
  };

  if (isLoading) {
    return (
      <div className="course-detail-loading">
        <div className="spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-error">
        <div className="error-container">
          <h2>{error || "Course not found"}</h2>
          <button className="back-button" onClick={handleBackClick}>
            <FaArrowLeft /> Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const mediaUrl = course.mediaUrl || course.MediaUrl;

  return (
    <div className="course-detail-page">
      <div className="course-banner">
        <div className="container">
          <button className="back-button" onClick={handleBackClick}>
            <FaArrowLeft /> Back to Courses
          </button>
          <h1 className="course-title">{course.title || course.Title}</h1>
          <div className="course-meta">
            {instructor && (
              <div className="meta-item">
                <FaChalkboardTeacher />
                <span>Instructor: {instructor.name || instructor.Name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="course-content-container container">
        <div className="course-main-content">
          <div className="video-container">
            {mediaUrl ? (
              <>
                {isYouTubeUrl(mediaUrl) ? (
                  <iframe
                    src={formatVideoUrl(mediaUrl)}
                    title={course.title || course.Title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : isUploadedFile(mediaUrl) ? (
                  <div className="file-download-container">
                    <div className="file-preview">
                      <div className="file-icon">{getFileIcon(mediaUrl)}</div>
                      <h3 className="file-name">{getFileName(mediaUrl)}</h3>
                      <p className="file-type">{getFileExtension(mediaUrl).toUpperCase()} File</p>
                    </div>
                    <div className="file-actions">
                      <button
                        onClick={() => handleDownload(getDirectDownloadUrl(mediaUrl), getFileName(mediaUrl))}
                        className="download-button"
                      >
                        <FaDownload /> Download Course Material
                      </button>
                      <button
                        onClick={() => handleViewInBrowser(getDirectDownloadUrl(mediaUrl))}
                        className="view-button"
                      >
                        <FaFileAlt /> View in Browser
                      </button>
                    </div>
                    {downloadError && (
                      <div className="download-error">
                        <p>{downloadError}</p>
                      </div>
                    )}
                    <div className="file-instructions">
                      <p>Click "Download" to save this file to your device, or "View in Browser" to open it directly.</p>
                    </div>
                  </div>
                ) : (
                  <div className="external-link-container" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f7f9fc',
                    padding: '2rem',
                    textAlign: 'center'
                  }}>
                    <div className="external-link-message" style={{
                      maxWidth: '550px',
                      textAlign: 'center',
                      padding: '2rem',
                      backgroundColor: 'white',
                      borderRadius: '10px',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{
                        color: '#1a2a42',
                        fontSize: '1.5rem',
                        marginBottom: '1rem',
                        fontFamily: 'Georgia, serif'
                      }}>External Course Content</h3>
                      <p style={{
                        color: '#4a5568',
                        marginBottom: '1.5rem',
                        lineHeight: '1.5'
                      }}>This course content is hosted on {getHostname(mediaUrl)}. Click the button below to access it.</p>
                      <button
                        onClick={() => window.open(mediaUrl, '_blank', 'noopener,noreferrer')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          backgroundColor: '#8b0f23',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '1rem',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 8px rgba(139, 15, 35, 0.2)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#6a0d1b';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 15, 35, 0.25)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#8b0f23';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 15, 35, 0.2)';
                        }}
                      >
                        <FaExternalLinkAlt /> Open Course on {getHostname(mediaUrl)}
                      </button>
                      <p style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        marginTop: '1rem'
                      }}>Note: The content will open in a new tab</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-video">No content available for this course</div>
            )}
          </div>

          <div className="course-description-panel">
            <h2>Course Description</h2>
            <p>{course.description || course.Description}</p>
          </div>
        </div>

        <div className="course-sidebar">
          <div className="sidebar-card">
            <h3>Course Actions</h3>
            <div className="sidebar-content">
              <Link
                to={`/courses/${course.courseId || course.CourseId}/assessments`}
                className="assessment-button"
              >
                <FaClipboardCheck /> View All Assessments
              </Link>

              <div className="course-features">
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">Self-paced learning</div>
                </div>
                {instructor && (
                  <div className="feature-item">
                    <div className="feature-icon">✓</div>
                    <div className="feature-text">Taught by {instructor.name || instructor.Name}</div>
                  </div>
                )}
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">Access to assessments</div>
                </div>
                {isUploadedFile(mediaUrl) && (
                  <div className="feature-item">
                    <div className="feature-icon">✓</div>
                    <div className="feature-text">Downloadable materials</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;