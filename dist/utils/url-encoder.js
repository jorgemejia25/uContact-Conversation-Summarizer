"use strict";
/**
 * Utility functions for URL encoding and normalization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrl = normalizeUrl;
exports.isValidUrl = isValidUrl;
exports.getFilenameFromUrl = getFilenameFromUrl;
/**
 * Normalizes and encodes a URL to ensure it's properly formatted
 * @param url The URL string to normalize
 * @returns A properly encoded URL string
 */
function normalizeUrl(url) {
    try {
        // Trim whitespace
        let normalizedUrl = url.trim();
        // If URL doesn't start with http:// or https://, assume https://
        if (!normalizedUrl.match(/^https?:\/\//)) {
            normalizedUrl = "https://" + normalizedUrl;
        }
        // Split URL into parts
        const urlParts = normalizedUrl.split("/");
        const protocol = urlParts[0]; // http: or https:
        const domain = urlParts[2]; // domain.com
        const pathParts = urlParts.slice(3); // everything after domain
        // Encode each path part separately to handle special characters
        const encodedPathParts = pathParts.map((part) => {
            // Don't encode if already encoded (contains %)
            if (part.includes("%")) {
                return part;
            }
            // Encode the part but preserve some special characters that are valid in URLs
            return encodeURIComponent(part)
                .replace(/%2F/g, "/") // Preserve forward slashes
                .replace(/%3F/g, "?") // Preserve question marks
                .replace(/%3D/g, "=") // Preserve equals signs
                .replace(/%26/g, "&") // Preserve ampersands
                .replace(/%23/g, "#"); // Preserve hash symbols
        });
        // Reconstruct the URL
        const finalUrl = protocol +
            "//" +
            domain +
            (encodedPathParts.length > 0 ? "/" + encodedPathParts.join("/") : "");
        console.log(`URL normalized: ${url} -> ${finalUrl}`);
        return finalUrl;
    }
    catch (error) {
        console.warn(`Failed to normalize URL: ${url}, using original`);
        return url;
    }
}
/**
 * Validates if a string looks like a URL
 * @param url The string to validate
 * @returns True if it appears to be a valid URL
 */
function isValidUrl(url) {
    try {
        const normalizedUrl = normalizeUrl(url);
        new URL(normalizedUrl);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Extracts the filename from a URL
 * @param url The URL to extract filename from
 * @returns The filename or null if not found
 */
function getFilenameFromUrl(url) {
    try {
        const normalizedUrl = normalizeUrl(url);
        const urlObj = new URL(normalizedUrl);
        const pathname = urlObj.pathname;
        const filename = pathname.split("/").pop();
        return filename && filename.length > 0 ? filename : null;
    }
    catch {
        return null;
    }
}
