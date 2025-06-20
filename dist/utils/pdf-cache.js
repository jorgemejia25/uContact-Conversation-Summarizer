"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfCache = exports.PdfCache = void 0;
/**
 * PDF Cache service to store processed PDF content and avoid repeated downloads
 */
class PdfCache {
    constructor() {
        this.cache = new Map();
        this.stats = {
            totalEntries: 0,
            totalSizeInBytes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lastCleanup: Date.now(),
        };
        // Cache configuration
        this.MAX_CACHE_SIZE = 50; // Maximum number of PDFs to cache
        this.MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total cache size
        this.CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    }
    /**
     * Get cached PDF content if available and not expired
     * @param url The PDF URL to check
     * @returns Cached content or null if not found/expired
     */
    get(url) {
        this.performPeriodicCleanup();
        const cached = this.cache.get(url);
        if (!cached) {
            this.stats.cacheMisses++;
            console.log(`PDF Cache MISS for: ${url}`);
            return null;
        }
        // Check if cache entry is expired
        const now = Date.now();
        if (now - cached.timestamp > this.CACHE_EXPIRY_TIME) {
            console.log(`PDF Cache EXPIRED for: ${url}`);
            this.remove(url);
            this.stats.cacheMisses++;
            return null;
        }
        this.stats.cacheHits++;
        console.log(`PDF Cache HIT for: ${url} (saved ${(cached.sizeInBytes /
            1024 /
            1024).toFixed(2)}MB download)`);
        return cached.content;
    }
    /**
     * Store PDF content in cache
     * @param url The PDF URL
     * @param content Extracted text content
     * @param sizeInBytes Original PDF file size
     * @param pages Number of pages
     * @param title PDF title if available
     */
    set(url, content, sizeInBytes, pages, title) {
        // Check if we need to make space
        this.ensureCacheSpace(sizeInBytes);
        const cacheEntry = {
            content,
            timestamp: Date.now(),
            url,
            sizeInBytes,
            pages,
            title,
        };
        // Remove existing entry if present
        if (this.cache.has(url)) {
            this.remove(url);
        }
        this.cache.set(url, cacheEntry);
        this.stats.totalEntries++;
        this.stats.totalSizeInBytes += sizeInBytes;
        console.log(`PDF cached: ${url} (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB, ${pages} pages)`);
        console.log(`Cache stats: ${this.stats.totalEntries} entries, ${(this.stats.totalSizeInBytes /
            1024 /
            1024).toFixed(2)}MB total`);
    }
    /**
     * Remove a specific URL from cache
     * @param url The URL to remove
     */
    remove(url) {
        const cached = this.cache.get(url);
        if (cached) {
            this.cache.delete(url);
            this.stats.totalEntries--;
            this.stats.totalSizeInBytes -= cached.sizeInBytes;
            console.log(`PDF removed from cache: ${url}`);
            return true;
        }
        return false;
    }
    /**
     * Clear all cache entries
     */
    clear() {
        const entriesCount = this.cache.size;
        this.cache.clear();
        this.stats = {
            totalEntries: 0,
            totalSizeInBytes: 0,
            cacheHits: this.stats.cacheHits,
            cacheMisses: this.stats.cacheMisses,
            lastCleanup: Date.now(),
        };
        console.log(`PDF cache cleared: ${entriesCount} entries removed`);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
        const hitRate = totalRequests > 0 ? (this.stats.cacheHits / totalRequests) * 100 : 0;
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
        };
    }
    /**
     * Get all cached URLs with their metadata
     */
    getCachedUrls() {
        return Array.from(this.cache.values()).map((entry) => ({
            url: entry.url,
            pages: entry.pages,
            title: entry.title,
            timestamp: entry.timestamp,
            sizeInMB: Math.round((entry.sizeInBytes / 1024 / 1024) * 100) / 100,
        }));
    }
    /**
     * Ensure there's enough space in cache for new entry
     */
    ensureCacheSpace(newEntrySize) {
        // Check total size limit
        while (this.stats.totalSizeInBytes + newEntrySize > this.MAX_TOTAL_SIZE &&
            this.cache.size > 0) {
            this.removeLeastRecentlyUsed();
        }
        // Check entry count limit
        while (this.cache.size >= this.MAX_CACHE_SIZE) {
            this.removeLeastRecentlyUsed();
        }
    }
    /**
     * Remove the least recently used (oldest) cache entry
     */
    removeLeastRecentlyUsed() {
        let oldestUrl = "";
        let oldestTimestamp = Date.now();
        for (const [url, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestUrl = url;
            }
        }
        if (oldestUrl) {
            console.log(`Removing LRU cache entry: ${oldestUrl}`);
            this.remove(oldestUrl);
        }
    }
    /**
     * Perform cleanup of expired entries if needed
     */
    performPeriodicCleanup() {
        const now = Date.now();
        if (now - this.stats.lastCleanup > this.CLEANUP_INTERVAL) {
            this.cleanupExpiredEntries();
            this.stats.lastCleanup = now;
        }
    }
    /**
     * Remove all expired cache entries
     */
    cleanupExpiredEntries() {
        const now = Date.now();
        const expiredUrls = [];
        for (const [url, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_EXPIRY_TIME) {
                expiredUrls.push(url);
            }
        }
        if (expiredUrls.length > 0) {
            console.log(`Cleaning up ${expiredUrls.length} expired PDF cache entries`);
            expiredUrls.forEach((url) => this.remove(url));
        }
    }
}
exports.PdfCache = PdfCache;
// Singleton instance
exports.pdfCache = new PdfCache();
