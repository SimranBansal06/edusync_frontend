// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import axios from 'axios';
// import '../../styles/CourseUpload.css';
// import { uploadFile } from '../../services/fileService';
// import { v4 as uuidv4 } from 'uuid'; // Import for generating GUIDs

// const CourseUpload = () => {
//     const { currentUser } = useAuth();
//     const navigate = useNavigate();
//     const { courseId } = useParams(); // Get courseId from URL if in edit mode
//     const isEditMode = !!courseId;
//     const fileInputRef = useRef(null);

//     const [contentType, setContentType] = useState('url'); // 'url' or 'file'
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [uploadProgress, setUploadProgress] = useState(0);

//     const [formData, setFormData] = useState({
//         title: '',
//         description: '',
//         mediaUrl: ''
//     });

//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');

//     // Function to format YouTube URLs to embed format
//     const formatVideoUrl = (url) => {
//         if (!url) return '';

//         // Handle YouTube URLs
//         const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
//         const match = url.match(youtubeRegex);

//         if (match && match[1]) {
//             // Extract video ID and return proper embed URL
//             const videoId = match[1];
//             return `https://www.youtube.com/embed/${videoId}`;
//         }

//         // If the URL already has /embed/ in it, it's likely already formatted correctly
//         if (url.includes('youtube.com/embed/')) {
//             return url;
//         }

//         // For other providers or if not matching our patterns, return as is
//         return url;
//     };

//     // Fetch existing course data if in edit mode
//     useEffect(() => {
//         if (isEditMode) {
//             setIsLoading(true);
//             axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels/${courseId}`)
//                 .then(response => {
//                     const courseData = response.data;
//                     setFormData({
//                         title: courseData.title || courseData.Title || '',
//                         description: courseData.description || courseData.Description || '',
//                         mediaUrl: courseData.mediaUrl || courseData.MediaUrl || ''
//                     });

//                     // Try to determine if this is a YouTube URL or a file URL
//                     if (courseData.mediaUrl && (
//                         courseData.mediaUrl.includes('youtube.com') ||
//                         courseData.mediaUrl.includes('youtu.be')
//                     )) {
//                         setContentType('url');
//                     } else if (courseData.mediaUrl &&
//                         courseData.mediaUrl.includes('/uploads/')) {
//                         setContentType('file');
//                     }
//                 })
//                 .catch(err => {
//                     console.error('Error fetching course data:', err);
//                     setError('Failed to load course data. Please try again.');
//                 })
//                 .finally(() => {
//                     setIsLoading(false);
//                 });
//         }
//     }, [courseId, isEditMode]);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prevState => ({
//             ...prevState,
//             [name]: value
//         }));
//     };

//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             setSelectedFile(file);
//             console.log("File selected:", file.name);
//             // Clear the URL input when a file is selected
//             setFormData(prevState => ({
//                 ...prevState,
//                 mediaUrl: ''
//             }));
//         } else {
//             setSelectedFile(null);
//         }
//     };

//     const handleContentTypeChange = (type) => {
//         setContentType(type);

//         // Clear the appropriate field based on the selected type
//         if (type === 'url') {
//             setSelectedFile(null);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }
//         } else {
//             setFormData(prevState => ({
//                 ...prevState,
//                 mediaUrl: ''
//             }));
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsSubmitting(true);
//         setError('');
//         setUploadProgress(0);

//         try {
//             let finalMediaUrl = '';
//             const baseApiUrl = `${window.API_CONFIG.BASE_URL}/api/CourseModels`;

//             // Step 1: If a file is selected, upload it first
//             if (contentType === 'file' && selectedFile) {
//                 try {
//                     console.log("Uploading file using file service...");

//                     // Use our file service to upload the file
//                     finalMediaUrl = await uploadFile(
//                         selectedFile,
//                         (progress) => setUploadProgress(progress),
//                         currentUser?.token
//                     );

//                     console.log("File uploaded successfully. URL:", finalMediaUrl);
//                 } catch (uploadError) {
//                     console.error('Error uploading file:', uploadError);
//                     let errorMsg = 'Failed to upload file. Please try again.';
//                     if (uploadError.response) {
//                         errorMsg = `File upload error: ${uploadError.response.status} - ${uploadError.response.data?.message || uploadError.response.data || 'Server error'}`;
//                     }
//                     setError(errorMsg);
//                     setIsSubmitting(false);
//                     return;
//                 }
//             } else if (contentType === 'url') {
//                 finalMediaUrl = formatVideoUrl(formData.mediaUrl);
//             } else if (isEditMode && formData.mediaUrl) {
//                 // In edit mode, if no new content is provided, keep the existing URL
//                 finalMediaUrl = formData.mediaUrl;
//             }

//             // Step 2: Create/Update the course with the media URL
//             const courseData = {
//                 CourseId: isEditMode ? courseId : uuidv4(), // Generate a new GUID for new courses
//                 Title: formData.title,
//                 Description: formData.description,
//                 MediaUrl: finalMediaUrl,
//                 InstructorId: currentUser?.id || currentUser?.userId
//             };

//             // Add JWT token for authorization if needed
//             const headers = {
//                 'Content-Type': 'application/json'
//             };

//             // Add token if available
//             if (currentUser?.token) {
//                 headers['Authorization'] = `Bearer ${currentUser.token}`;
//             }

//             console.log(`${isEditMode ? 'Updating' : 'Creating'} course data:`, courseData);

//             // Log the API endpoint we're calling
//             const endpoint = isEditMode ? `${baseApiUrl}/${courseId}` : baseApiUrl;
//             console.log(`Calling API endpoint: ${endpoint}`);

//             // Make API call - POST for create, PUT for update
//             const response = isEditMode
//                 ? await axios.put(`${baseApiUrl}/${courseId}`, courseData, { headers })
//                 : await axios.post(baseApiUrl, courseData, { headers });

//             console.log('API response:', response.data);
//             setSuccess(`Course ${isEditMode ? 'updated' : 'uploaded'} successfully!`);

//             // Reset form if creating new course
//             if (!isEditMode) {
//                 setFormData({
//                     title: '',
//                     description: '',
//                     mediaUrl: ''
//                 });
//                 setSelectedFile(null);
//                 setContentType('url');
//                 if (fileInputRef.current) {
//                     fileInputRef.current.value = '';
//                 }
//             }

//             // Redirect after success
//             setTimeout(() => {
//                 navigate('/instructor');
//             }, 2000);

//         } catch (err) {
//             console.error(`Error ${isEditMode ? 'updating' : 'uploading'} course:`, err);

//             if (err.response) {
//                 // Server returned an error response
//                 console.error('Server response:', err.response);
//                 const errorData = err.response.data;

//                 // Try to extract the most useful error message possible
//                 let errorMessage = 'Unknown error';
//                 if (typeof errorData === 'string') {
//                     errorMessage = errorData;
//                 } else if (errorData?.message) {
//                     errorMessage = errorData.message;
//                 } else if (errorData?.title) {
//                     errorMessage = errorData.title;
//                 } else if (errorData?.error) {
//                     errorMessage = errorData.error;
//                 }

//                 setError(`Server error: ${err.response.status} - ${errorMessage}`);
//             } else if (err.request) {
//                 // No response received
//                 console.error('No response received:', err.request);
//                 setError('No response received from server. Please check your connection.');
//             } else {
//                 // Other error
//                 setError(`Error: ${err.message}`);
//             }
//         } finally {
//             setIsSubmitting(false);
//             setUploadProgress(0);
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="course-upload-page">
//                 <div className="course-upload-container">
//                     <h1>Loading Course Data...</h1>
//                     <div className="loading-spinner">Loading...</div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="course-upload-page">
//             <div className="course-upload-container">
//                 <h1>{isEditMode ? 'Edit Course' : 'Upload New Course'}</h1>

//                 {error && <div className="alert alert-error">{error}</div>}
//                 {success && <div className="alert alert-success">{success}</div>}

//                 <form onSubmit={handleSubmit}>
//                     <div className="form-group">
//                         <label htmlFor="title">Course Title</label>
//                         <input
//                             type="text"
//                             id="title"
//                             name="title"
//                             value={formData.title}
//                             onChange={handleChange}
//                             placeholder="Enter course title"
//                             required
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="description">Course Description</label>
//                         <textarea
//                             id="description"
//                             name="description"
//                             value={formData.description}
//                             onChange={handleChange}
//                             placeholder="Enter course description"
//                             rows="4"
//                             required
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label>Course Content Type</label>
//                         <div className="content-type-selector">
//                             <button
//                                 type="button"
//                                 className={`content-type-btn ${contentType === 'url' ? 'active' : ''}`}
//                                 onClick={() => handleContentTypeChange('url')}
//                             >
//                                 🔗 Link (YouTube, etc.)
//                             </button>
//                             <button
//                                 type="button"
//                                 className={`content-type-btn ${contentType === 'file' ? 'active' : ''}`}
//                                 onClick={() => handleContentTypeChange('file')}
//                             >
//                                 📁 Upload Document/Video
//                             </button>
//                         </div>
//                     </div>

//                     {contentType === 'url' && (
//                         <div className="form-group">
//                             <label htmlFor="mediaUrl">Course Media URL</label>
//                             <input
//                                 type="url"
//                                 id="mediaUrl"
//                                 name="mediaUrl"
//                                 value={formData.mediaUrl}
//                                 onChange={handleChange}
//                                 placeholder="Enter URL to course content (e.g., YouTube)"
//                                 required={contentType === 'url'}
//                             />
//                             <div className="form-help">
//                                 <p className="url-info-heading"><strong>URL Types & How They Display:</strong></p>
//                                 <div className="url-info-container">
//                                     <div className="url-info-item">
//                                         <span className="url-type">✓ YouTube URLs:</span>
//                                         <span className="url-behavior">Will be embedded directly in the course page.</span>
//                                         <span className="url-example">Example: https://www.youtube.com/watch?v=abcd1234</span>
//                                     </div>
//                                     <div className="url-info-item">
//                                         <span className="url-type">✓ Non-embeddable URLs:</span>
//                                         <span className="url-behavior">Will show as an "External Course Content" link button.</span>
//                                         <span className="url-example">Examples: Coursera, GeeksForGeeks, and most other websites</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {contentType === 'file' && (
//                         <div className="form-group">
//                             <label htmlFor="courseFile">Upload Course Material</label>
//                             <input
//                                 type="file"
//                                 id="courseFile"
//                                 name="courseFile"
//                                 ref={fileInputRef}
//                                 onChange={handleFileChange}
//                                 accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.odt,.ods,.odp,.mp4,.mov,.mkv,.avi,.webm,.mp3,.wav,.ogg,.jpg,.jpeg,.png,.gif,.svg"
//                                 required={contentType === 'file' && !isEditMode}
//                             />
//                             {selectedFile && (
//                                 <div className="file-info">
//                                     <p>Selected file: {selectedFile.name}</p>
//                                     <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
//                                 </div>
//                             )}
//                             {uploadProgress > 0 && uploadProgress < 100 && (
//                                 <div className="upload-progress">
//                                     <div className="progress-bar">
//                                         <div
//                                             className="progress-fill"
//                                             style={{ width: `${uploadProgress}%` }}
//                                         ></div>
//                                     </div>
//                                     <span>{uploadProgress}%</span>
//                                 </div>
//                             )}
//                             <div className="file-upload-note">
//                                 <p>Note: Uploaded files will be available for students to download.</p>
//                                 <p>Supported formats include PDF, Word documents, PowerPoint, text files, videos, audio, and images.</p>
//                             </div>
//                         </div>
//                     )}

//                     <div className="form-actions">
//                         <button
//                             type="button"
//                             className="cancel-btn"
//                             onClick={() => navigate('/instructor')}
//                             disabled={isSubmitting}
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             className="upload-btn"
//                             disabled={isSubmitting}
//                         >
//                             {isSubmitting ? (isEditMode ? 'Updating...' : 'Uploading...') : (isEditMode ? 'Update Course' : 'Upload Course')}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default CourseUpload;


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import '../../styles/CourseUpload.css';
import { uploadFile } from '../../services/fileService';
import { v4 as uuidv4 } from 'uuid'; // Import for generating GUIDs

const CourseUpload = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { courseId } = useParams(); // Get courseId from URL if in edit mode
    const isEditMode = !!courseId;
    const fileInputRef = useRef(null);

    // Remove contentType state and always use 'file' type
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mediaUrl: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch existing course data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            setIsLoading(true);
            axios.get(`${window.API_CONFIG.BASE_URL}/api/CourseModels/${courseId}`)
                .then(response => {
                    const courseData = response.data;
                    setFormData({
                        title: courseData.title || courseData.Title || '',
                        description: courseData.description || courseData.Description || '',
                        mediaUrl: courseData.mediaUrl || courseData.MediaUrl || ''
                    });

                    // If there's a mediaUrl, it's a file in Azure Blob Storage
                    if (courseData.mediaUrl) {
                        // This is a file URL, but we don't need to set contentType anymore
                    }
                })
                .catch(err => {
                    console.error('Error fetching course data:', err);
                    setError('Failed to load course data. Please try again.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [courseId, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            console.log("File selected:", file.name);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setUploadProgress(0);

        try {
            let finalMediaUrl = '';
            const baseApiUrl = `${window.API_CONFIG.BASE_URL}/api/CourseModels`;

            // Upload file if selected
            if (selectedFile) {
                try {
                    console.log("Uploading file to Azure Blob Storage...");

                    // Use our file service to upload the file, passing courseId if in edit mode
                    finalMediaUrl = await uploadFile(
                        selectedFile,
                        (progress) => setUploadProgress(progress),
                        currentUser?.token,
                        isEditMode ? courseId : null // Pass courseId if in edit mode
                    );

                    console.log("File uploaded successfully to Azure Blob Storage. URL:", finalMediaUrl);
                } catch (uploadError) {
                    console.error('Error uploading file to Azure Blob Storage:', uploadError);
                    let errorMsg = 'Failed to upload file. Please try again.';
                    if (uploadError.response) {
                        errorMsg = `File upload error: ${uploadError.response.status} - ${uploadError.response.data?.message || uploadError.response.data || 'Server error'}`;
                    }
                    setError(errorMsg);
                    setIsSubmitting(false);
                    return;
                }
            } else if (isEditMode && formData.mediaUrl) {
                // In edit mode, if no new file is selected, keep the existing URL
                finalMediaUrl = formData.mediaUrl;
            } else if (!isEditMode) {
                // New course requires a file
                setError('Please select a file to upload');
                setIsSubmitting(false);
                return;
            }

            // Step 2: Create/Update the course with the media URL
            const courseData = {
                CourseId: isEditMode ? courseId : uuidv4(), // Generate a new GUID for new courses
                Title: formData.title,
                Description: formData.description,
                MediaUrl: finalMediaUrl,
                InstructorId: currentUser?.id || currentUser?.userId
            };

            // Add JWT token for authorization if needed
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add token if available
            if (currentUser?.token) {
                headers['Authorization'] = `Bearer ${currentUser.token}`;
            }

            console.log(`${isEditMode ? 'Updating' : 'Creating'} course data:`, courseData);

            // Log the API endpoint we're calling
            const endpoint = isEditMode ? `${baseApiUrl}/${courseId}` : baseApiUrl;
            console.log(`Calling API endpoint: ${endpoint}`);

            // Make API call - POST for create, PUT for update
            const response = isEditMode
                ? await axios.put(`${baseApiUrl}/${courseId}`, courseData, { headers })
                : await axios.post(baseApiUrl, courseData, { headers });

            console.log('API response:', response.data);
            setSuccess(`Course ${isEditMode ? 'updated' : 'uploaded'} successfully!`);

            // Reset form if creating new course
            if (!isEditMode) {
                setFormData({
                    title: '',
                    description: '',
                    mediaUrl: ''
                });
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }

            // Redirect after success
            setTimeout(() => {
                navigate('/instructor');
            }, 2000);

        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'uploading'} course:`, err);

            if (err.response) {
                // Server returned an error response
                console.error('Server response:', err.response);
                const errorData = err.response.data;

                // Try to extract the most useful error message possible
                let errorMessage = 'Unknown error';
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData?.message) {
                    errorMessage = errorData.message;
                } else if (errorData?.title) {
                    errorMessage = errorData.title;
                } else if (errorData?.error) {
                    errorMessage = errorData.error;
                }

                setError(`Server error: ${err.response.status} - ${errorMessage}`);
            } else if (err.request) {
                // No response received
                console.error('No response received:', err.request);
                setError('No response received from server. Please check your connection.');
            } else {
                // Other error
                setError(`Error: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
            setUploadProgress(0);
        }
    };

    if (isLoading) {
        return (
            <div className="course-upload-page">
                <div className="course-upload-container">
                    <h1>Loading Course Data...</h1>
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="course-upload-page">
            <div className="course-upload-container">
                <h1>{isEditMode ? 'Edit Course' : 'Upload New Course'}</h1>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Course Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter course title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Course Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter course description"
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="courseFile">Upload Course Material</label>
                        <input
                            type="file"
                            id="courseFile"
                            name="courseFile"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.odt,.ods,.odp,.mp4,.mov,.mkv,.avi,.webm,.mp3,.wav,.ogg,.jpg,.jpeg,.png,.gif,.svg"
                            required={!isEditMode}
                        />
                        {selectedFile && (
                            <div className="file-info">
                                <p>Selected file: {selectedFile.name}</p>
                                <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        )}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="upload-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <span>{uploadProgress}%</span>
                            </div>
                        )}
                        <div className="file-upload-note">
                            <p>Note: Uploaded files will be stored in Azure Blob Storage and available for students to download.</p>
                            <p>Supported formats include PDF, Word documents, PowerPoint, text files, videos, audio, and images.</p>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate('/instructor')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="upload-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (isEditMode ? 'Updating...' : 'Uploading...') : (isEditMode ? 'Update Course' : 'Upload Course')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseUpload;