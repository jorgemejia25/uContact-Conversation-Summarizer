import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { SummaryRequestSchema } from "../../types/summary";
import { SummaryService } from "./service";
import { WebhookRequestSchema } from "../../types/respond_webhook";
import { Type } from "@sinclair/typebox";

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
            const result = await this.summaryService.summarizeAudio(audioFilePath);
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
    };
  }
}
