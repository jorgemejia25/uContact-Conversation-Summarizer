import { AgentRequestSchema } from "../../types/agent";
import { AgentService } from "./service";
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

/**
 * Controller for handling agent chat routes.
 */
export class AgentController {
  public readonly routes: FastifyPluginAsyncTypebox;

  /**
   * Constructs a new instance of AgentController.
   * @param agentService The service used to process agent chat requests.
   */
  constructor(
    private readonly agentService: AgentService = new AgentService()
  ) {
    this.routes = async (server) => {
      server.post(
        "/agent/chat",
        {
          schema: {
            body: AgentRequestSchema,
          },
        },
        async (request, reply) => {
          try {
            const result = await this.agentService.processAgentRequest(
              request.body
            );
            return { response: result };
          } catch (error) {
            console.error("Agent chat error:", error);
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
