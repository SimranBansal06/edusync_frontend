import axios from 'axios';

// Hardcoded Azure backend URL
const AZURE_API_URL = 'https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net';

/**
 * Direct file service to handle file downloads without proxying
 * This service provides methods for working with files directly from their source
 */
class FileService {
    /**
     * Fetches a file from the server and returns it as a blob
     * @param {string} url - The URL of the file to fetch
     * @returns {Promise<Blob>} - A promise that resolves to a blob
     */
    async fetchFile(url) {
        try {
            console.log("[FileService] Fetching file from URL:", url);

            // Ensure URL is absolute
            let fileUrl = this.ensureAbsoluteUrl(url);

            // For files stored in the backend's uploads directory, construct the proper URL
            if (url.includes('/uploads/')) {
                fileUrl = `${AZURE_API_URL}${url.startsWith('/') ? url : `/${url}`}`;
                console.log("[FileService] Uploads path detected, using URL:", fileUrl);
            }

            // If it's a download endpoint, use it directly
            if (url.includes('/api/CourseModels/download/')) {
                fileUrl = url;
                console.log("[FileService] Download endpoint detected, using URL:", fileUrl);
            }

            console.log("[FileService] Making request to:", fileUrl);

            // Make a direct GET request with more detailed error handling
            try {
                const response = await axios.get(fileUrl, {
                    responseType: 'blob',
                    // Add timeout to prevent hanging requests
                    timeout: 30000,
                    // For local development, allow self-signed certificates
                    ...(fileUrl.includes('localhost') && {
                        httpsAgent: new (require('https').Agent)({
                            rejectUnauthorized: false
                        })
                    })
                });

                console.log("[FileService] Response received, type:", response.headers['content-type'], "size:", response.data.size);
                return response.data;
            } catch (directError) {
                console.error("[FileService] Direct request failed:", directError.message);
                // Detailed error logging
                if (directError.response) {
                    console.error("[FileService] Response error data:", directError.response.status, directError.response.statusText);
                } else if (directError.request) {
                    console.error("[FileService] Request error (no response):", directError.request);
                } else {
                    console.error("[FileService] Error setting up request:", directError.message);
                }
                throw directError;
            }
        } catch (error) {
            console.error("[FileService] Error in fetchFile:", error.message);

            // If direct access fails and it's a file ID, try the download endpoint
            if (!url.includes('/api/')) {
                try {
                    console.log("[FileService] Attempting fallback to download endpoint");
                    const fileId = this.extractFileIdFromUrl(url);
                    const downloadUrl = `${AZURE_API_URL}/api/CourseModels/download/${fileId}`;
                    console.log("[FileService] Fallback download URL:", downloadUrl);

                    const response = await axios.get(downloadUrl, {
                        responseType: 'blob',
                        timeout: 30000,
                        // For local development, allow self-signed certificates
                        ...(downloadUrl.includes('localhost') && {
                            httpsAgent: new (require('https').Agent)({
                                rejectUnauthorized: false
                            })
                        })
                    });

                    console.log("[FileService] Fallback response received, type:", response.headers['content-type'], "size:", response.data.size);
                    return response.data;
                } catch (fallbackError) {
                    console.error("[FileService] Fallback fetch also failed:", fallbackError.message);
                    // Detailed fallback error logging
                    if (fallbackError.response) {
                        console.error("[FileService] Fallback response error:", fallbackError.response.status, fallbackError.response.statusText);
                    } else if (fallbackError.request) {
                        console.error("[FileService] Fallback request error (no response)");
                    } else {
                        console.error("[FileService] Error setting up fallback request:", fallbackError.message);
                    }
                    throw fallbackError;
                }
            }

            throw error;
        }
    }

    /**
     * Ensures a URL is absolute by adding the base URL if necessary
     * @param {string} url - The URL to check
     * @returns {string} - The absolute URL
     */
    ensureAbsoluteUrl(url) {
        if (url && !url.startsWith('http')) {
            return `${AZURE_API_URL}${url.startsWith('/') ? url : `/${url}`}`;
        }
        return url;
    }

    /**
     * Extracts the file ID from a URL
     * @param {string} url - The URL containing the file ID
     * @returns {string} - The file ID
     */
    extractFileIdFromUrl(url) {
        try {
            // Get the filename from the URL
            const filename = url.split('/').pop();

            // For a GUID-formatted file, just return the filename without extension
            if (filename.match(/[a-f0-9-]{36}\.[a-z0-9]+$/i)) {
                return filename.split('.')[0];
            }

            // Otherwise, return the full filename as the ID
            return filename;
        } catch (error) {
            console.error('Error extracting file ID from URL:', error);
            return url;
        }
    }

    /**
     * Gets the content type of a file based on its extension
     * @param {string} fileName - The name of the file
     * @returns {string} - The content type
     */
    getContentType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();

        const contentTypes = {
            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'rtf': 'application/rtf',
            'odt': 'application/vnd.oasis.opendocument.text',
            'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  
            'odp': 'application/vnd.oasis.opendocument.presentation',

            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',

            // Videos
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'wmv': 'video/x-ms-wmv',
            'flv': 'video/x-flv',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska',

            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
        };

        return contentTypes[extension] || 'application/octet-stream';
    }
}

// Create the file service instance
const fileService = new FileService();

/**
 * Uploads a file to the server
 * @param {File} file - The file to upload
 * @param {Function} progressCallback - Callback for upload progress
 * @param {string} token - Authentication token (optional)
 * @param {string} courseId - Course ID for associating the file with a specific course (optional)
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export const uploadFile = async (file, progressCallback = null, token = null, courseId = null) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Determine the endpoint based on whether we have a courseId
        const endpoint = courseId
            ? `${AZURE_API_URL}/api/CourseModels/upload/${courseId}`
            : `${AZURE_API_URL}/api/CourseModels/upload`;

        console.log(`Uploading file ${file.name} (${file.size} bytes) to ${endpoint}`);

        const response = await axios.post(
            endpoint,
            formData,
            {
                headers,
                onUploadProgress: progressCallback ? (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progressCallback(percentCompleted);
                } : undefined
            }
        );

        console.log('Server response:', response.data);

        // Check for either url or fileUrl in the response
        let fileUrl = null;
        if (response.data) {
            // Try to get the URL from either the 'url' or 'fileUrl' property
            fileUrl = response.data.url || response.data.fileUrl;
            console.log('Raw fileUrl from response:', fileUrl);
        }

        if (!fileUrl) {
            console.error('No URL returned from server:', response.data);
            return null;
        }

        // Return the file URL
        console.log('Final fileUrl to be returned:', fileUrl);
        return fileUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export default fileService;