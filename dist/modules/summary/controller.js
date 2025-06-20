"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryController = void 0;
const summary_1 = require("../../types/summary");
const service_1 = require("./service");
const typebox_1 = require("@sinclair/typebox");
const respond_webhook_1 = require("../../types/respond_webhook");
const pdf_cache_1 = require("../../utils/pdf-cache");
/**
 * Controller for handling summary-related routes.
 */
class SummaryController {
    /**
     * Constructs a new instance of SummaryController.
     * @param summaryService The service used to process URL summaries.
     */
    constructor(summaryService = new service_1.SummaryService()) {
        this.summaryService = summaryService;
        this.routes = async (server) => {
            server.post("/summarize", {
                schema: {
                    body: summary_1.SummaryRequestSchema,
                },
            }, async (request, reply) => {
                try {
                    const result = await this.summaryService.processUrl(request.body);
                    return { summary: result };
                }
                catch (error) {
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "An unexpected error occurred",
                    });
                }
            });
            server.post("/summarize/respond", {
                schema: {
                    body: respond_webhook_1.WebhookRequestSchema,
                },
            }, async (request, reply) => {
                try {
                    const result = await this.summaryService.generateSummaryFromWebhook(request.body);
                    return { summary: result };
                }
                catch (error) {
                    console.log(error);
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "An unexpected error occurred",
                    });
                }
            });
            server.post("/summarize/audio", {
                schema: {
                    body: typebox_1.Type.Object({
                        audioFilePath: typebox_1.Type.String(),
                    }),
                },
            }, async (request, reply) => {
                try {
                    const { audioFilePath } = request.body;
                    const result = await this.summaryService.summarizeAudio(audioFilePath);
                    return { summary: result };
                }
                catch (error) {
                    console.log(error);
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "An unexpected error occurred",
                    });
                }
            });
            // PDF Cache management endpoints
            server.get("/cache/stats", async (request, reply) => {
                try {
                    const stats = pdf_cache_1.pdfCache.getStats();
                    return {
                        message: "PDF Cache statistics",
                        stats,
                    };
                }
                catch (error) {
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "Failed to get cache stats",
                    });
                }
            });
            server.get("/cache/list", async (request, reply) => {
                try {
                    const cachedUrls = pdf_cache_1.pdfCache.getCachedUrls();
                    return {
                        message: "Cached PDF URLs",
                        count: cachedUrls.length,
                        urls: cachedUrls,
                    };
                }
                catch (error) {
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "Failed to list cached URLs",
                    });
                }
            });
            server.delete("/cache/clear", async (request, reply) => {
                try {
                    pdf_cache_1.pdfCache.clear();
                    return {
                        message: "PDF cache cleared successfully",
                    };
                }
                catch (error) {
                    reply.status(500).send({
                        error: error instanceof Error ? error.message : "Failed to clear cache",
                    });
                }
            });
            server.delete("/cache/remove", {
                schema: {
                    body: typebox_1.Type.Object({
                        url: typebox_1.Type.String({ minLength: 1 }),
                    }),
                },
            }, async (request, reply) => {
                try {
                    const { url } = request.body;
                    const removed = pdf_cache_1.pdfCache.remove(url);
                    return {
                        message: removed
                            ? "URL removed from cache"
                            : "URL not found in cache",
                        removed,
                        url,
                    };
                }
                catch (error) {
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "Failed to remove URL from cache",
                    });
                }
            });
        };
    }
}
exports.SummaryController = SummaryController;
