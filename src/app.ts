import fastify, { FastifyInstance } from "fastify";

import { AgentController } from "./modules/agent/controller";
import { DatabaseController } from "./modules/database/controller";
import { SummaryController } from "./modules/summary/controller";

/**
 * Class representing the application server.
 */
export class AppServer {
  /**
   * Instance of Fastify used to create the server.
   */
  private app: FastifyInstance;

  /**
   * Class constructor.
   * Initializes the Fastify instance and configures plugins.
   */
  constructor() {
    this.app = fastify({ logger: true });
    this.setupPlugins();
    this.registerRoutes();
  }

  /**
   * Configures Fastify plugins.
   * In this case, the Helmet plugin (for security) and Rate Limit (to limit the number of requests) are configured.
   */
  private setupPlugins() {
    this.app.register(import("@fastify/helmet"));
    this.app.register(import("@fastify/rate-limit"), {
      max: 100,
      timeWindow: "1 minute",
    });
  }

  /**
   * Registers application routes.
   * In this case, the route of the SummaryController class is registered.
   */
  private registerRoutes() {
    const summaryController = new SummaryController();
    this.app.register(summaryController.routes, { prefix: "/api/summarize" });

    // Register database routes
    const databaseController = new DatabaseController();
    this.app.register(databaseController.routes, { prefix: "/api/db" });

    // Register agent routes
    const agentController = new AgentController();
    this.app.register(agentController.routes, { prefix: "/api" });
  }

  /**
   * Starts the server.
   * @param port Port number where the server will start.
   */
  public async start(port: number): Promise<void> {
    try {
      await this.app.listen({ port });
      console.log(`Server running on port ${port}`);
    } catch (error) {
      this.app.log.error(error);
      process.exit(1);
    }
  }
}
