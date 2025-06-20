"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppServer = void 0;
require("reflect-metadata");
const fastify_1 = __importDefault(require("fastify"));
const controller_1 = require("./modules/agent/controller");
const controller_2 = require("./modules/database/controller");
const controller_3 = require("./modules/summary/controller");
/**
 * Class representing the application server.
 */
class AppServer {
    /**
     * Class constructor.
     * Initializes the Fastify instance and configures plugins.
     */
    constructor() {
        this.app = (0, fastify_1.default)({ logger: true });
        this.setupPlugins();
        this.registerRoutes();
    }
    /**
     * Configures Fastify plugins.
     * In this case, the Helmet plugin (for security) and Rate Limit (to limit the number of requests) are configured.
     */
    setupPlugins() {
        this.app.register(Promise.resolve().then(() => __importStar(require("@fastify/helmet"))));
        this.app.register(Promise.resolve().then(() => __importStar(require("@fastify/rate-limit"))), {
            max: 100,
            timeWindow: "1 minute",
        });
    }
    /**
     * Registers application routes.
     * In this case, the route of the SummaryController class is registered.
     */
    registerRoutes() {
        const summaryController = new controller_3.SummaryController();
        this.app.register(summaryController.routes, { prefix: "/api/summarize" });
        // Register database routes
        const databaseController = new controller_2.DatabaseController();
        this.app.register(databaseController.routes, { prefix: "/api/db" });
        // Register agent routes
        const agentController = new controller_1.AgentController();
        this.app.register(agentController.routes, { prefix: "/api" });
    }
    /**
     * Starts the server.
     * @param port Port number where the server will start.
     */
    async start(port) {
        try {
            await this.app.listen({ port });
            console.log(`Server running on port ${port}`);
        }
        catch (error) {
            this.app.log.error(error);
            process.exit(1);
        }
    }
}
exports.AppServer = AppServer;
