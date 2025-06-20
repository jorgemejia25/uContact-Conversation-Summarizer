"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const agent_1 = require("../../types/agent");
const service_1 = require("./service");
/**
 * Controller for handling agent chat routes.
 */
class AgentController {
    /**
     * Constructs a new instance of AgentController.
     * @param agentService The service used to process agent chat requests.
     */
    constructor(agentService = new service_1.AgentService()) {
        this.agentService = agentService;
        this.routes = async (server) => {
            server.post("/agent/chat", {
                schema: {
                    body: agent_1.AgentRequestSchema,
                },
            }, async (request, reply) => {
                try {
                    const result = await this.agentService.processAgentRequest(request.body);
                    return { response: result };
                }
                catch (error) {
                    console.error("Agent chat error:", error);
                    reply.status(500).send({
                        error: error instanceof Error
                            ? error.message
                            : "An unexpected error occurred",
                    });
                }
            });
        };
    }
}
exports.AgentController = AgentController;
