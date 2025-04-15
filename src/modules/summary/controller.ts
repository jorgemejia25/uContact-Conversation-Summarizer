import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { SummaryRequestSchema } from "./types";
import { SummaryService } from "./service";

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
            reply
              .status(500)
              .send({
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
