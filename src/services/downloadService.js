// import axios from 'axios';
import fileService from './fileService';

/**
 * Downloads a file from the server
 * @param {string} url - The URL of the file to download
 * @param {string} fileName - The name to save the file as
 */
export const downloadFile = async (url, fileName) => {
    try {
        console.log("[DownloadService] Downloading file:", fileName, "from URL:", url);

        if (!url) {
            console.error("[DownloadService] Invalid URL provided:", url);
            return false;
        }

        // Use the file service to fetch the file
        const blob = await fileService.fetchFile(url);

        if (!blob || blob.size === 0) {
            console.error("[DownloadService] Received empty blob or no data");
            return false;
        }

        console.log("[DownloadService] File fetched successfully, size:", blob.size, "bytes");

        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        console.log("[DownloadService] Created blob URL:", blobUrl);

        // Create an anchor element and trigger the download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'download';
        document.body.appendChild(link);

        console.log("[DownloadService] Triggering download for:", fileName);
        link.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            console.log("[DownloadService] Cleaned up download resources");
        }, 100);

        return true;
    } catch (error) {
        console.error("[DownloadService] Error downloading file:", error.message);
        return false;
    }
};

/**
 * Opens a file in a new browser tab
 * @param {string} url - The URL of the file to open
 */
export const openFileInBrowser = async (url) => {
    try {
        console.log("[DownloadService] Opening file in browser, URL:", url);

        if (!url) {
            console.error("[DownloadService] Invalid URL provided for browser view");
            return false;
        }

        // For certain file types, we want to fetch the file and display it in a new tab
        const fileName = url.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        console.log("[DownloadService] File extension:", fileExtension);

        // List of extensions that we want to handle with direct file service
        const handledExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];

        if (handledExtensions.includes(fileExtension)) {
            console.log("[DownloadService] Using file service for preview");

            // Use the file service to fetch the file
            const blob = await fileService.fetchFile(url);

            if (!blob || blob.size === 0) {
                console.error("[DownloadService] Received empty blob or no data for preview");
                return false;
            }

            console.log("[DownloadService] File fetched for preview, size:", blob.size, "bytes");

            // Get the content type
            const contentType = fileService.getContentType(fileName);
            console.log("[DownloadService] Content type:", contentType);

            // Create a blob URL with the correct content type
            const blobUrl = window.URL.createObjectURL(
                new Blob([blob], { type: contentType })
            );
            console.log("[DownloadService] Created blob URL for preview:", blobUrl);

            // Open the blob URL in a new tab
            window.open(blobUrl, '_blank');
        } else {
            // For other file types, ensure the URL is absolute and open directly
            const fileUrl = fileService.ensureAbsoluteUrl(url);
            console.log("[DownloadService] Opening file directly in browser:", fileUrl);
            window.open(fileUrl, '_blank');
        }

        return true;
    } catch (error) {
        console.error("[DownloadService] Error opening file in browser:", error.message);
        return false;
    }
}; 