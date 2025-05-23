import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { SummaryRequestSchema } from "../../types/summary";
import { SummaryService } from "./service";
import { Type } from "@sinclair/typebox";
import { WebhookRequestSchema } from "../../types/respond_webhook";
import { pdfCache } from "../../utils/pdf-cache";

/**
 * Controller for handling summary-related routes.
 */
export class SummaryController {
  public readonly routes: FastifyPluginAsyncTypebox;

  /**
   * Constructs a new instance of SummaryController.
   * @param summaryService The service used to process URL summaries.
   */
  constructor(
    private readonly summaryService: SummaryService = new SummaryService()
  ) {
    this.routes = async (server) => {
      server.post(
        "/summarize",
        {
          schema: {
            body: SummaryRequestSchema,
          },
        },
        async (request, reply) => {
          try {
            const result = await this.summaryService.processUrl(request.body);
            return { summary: result };
          } catch (error) {
            reply.status(500).send({
              error:
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred",
            });
          }
        }
      );

      server.post(
        "/summarize/respond",
        {
          schema: {
            body: WebhookRequestSchema,
          },
        },
        async (request, reply) => {
          try {
            const result = await this.summaryService.generateSummaryFromWebhook(
              request.body
            );
            return { summary: result };
          } catch (error) {
            console.log(error);
            reply.status(500).send({
              error:
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred",
            });
          }
        }
      );

      server.post(
        "/summarize/audio",
        {
          schema: {
            body: Type.Object({
              audioFilePath: Type.String(),
            }),
          },
        },
        async (request, reply) => {
          try {
            const { audioFilePath } = request.body;
            const result = await this.summaryService.summarizeAudio(
              audioFilePath
            );
            return { summary: result };
          } catch (error) {
            console.log(error);
            reply.status(500).send({
              error:
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred",
            });
          }
        }
      );

      // PDF Cache management endpoints
      server.get("/cache/stats", async (request, reply) => {
        try {
          const stats = pdfCache.getStats();
          return {
            message: "PDF Cache statistics",
            stats,
          };
        } catch (error) {
          reply.status(500).send({
            error:
              error instanceof Error
                ? error.message
                : "Failed to get cache stats",
          });
        }
      });

      server.get("/cache/list", async (request, reply) => {
        try {
          const cachedUrls = pdfCache.getCachedUrls();
          return {
            message: "Cached PDF URLs",
            count: cachedUrls.length,
            urls: cachedUrls,
          };
        } catch (error) {
          reply.status(500).send({
            error:
              error instanceof Error
                ? error.message
                : "Failed to list cached URLs",
          });
        }
      });

      server.delete("/cache/clear", async (request, reply) => {
        try {
          pdfCache.clear();
          return {
            message: "PDF cache cleared successfully",
          };
        } catch (error) {
          reply.status(500).send({
            error:
              error instanceof Error ? error.message : "Failed to clear cache",
          });
        }
      });

      server.delete(
        "/cache/remove",
        {
          schema: {
            body: Type.Object({
              url: Type.String({ minLength: 1 }),
            }),
          },
        },
        async (request, reply) => {
          try {
            const { url } = request.body;
            const removed = pdfCache.remove(url);
            return {
              message: removed
                ? "URL removed from cache"
                : "URL not found in cache",
              removed,
              url,
            };
          } catch (error) {
            reply.status(500).send({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to remove URL from cache",
            });
          }
        }
      );
    };
  }
}
