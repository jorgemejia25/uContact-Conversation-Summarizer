"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseController = void 0;
const service_1 = require("./service");
const typebox_1 = require("@sinclair/typebox");
/**
 * Controller for handling database-related routes.
 */
class DatabaseController {
    /**
     * Constructs a new instance of DatabaseController.
     * @param databaseService The service used to process database queries.
     */
    constructor(databaseService = new service_1.DatabaseService()) {
        this.databaseService = databaseService;
        this.routes = async (server) => {
            server.get("/calls/:src", {
                schema: {
                    params: typebox_1.Type.Object({
                        src: typebox_1.Type.String({ description: "Source phone number" }),
                    }),
                    response: {
                        200: typebox_1.Type.Array(typebox_1.Type.Object({
                            fecha: typebox_1.Type.String(),
                            horas: typebox_1.Type.String(),
                            guids: typebox_1.Type.String(),
                            duraciones: typebox_1.Type.String(),
                        })),
                    },
                },
            }, async (request, reply) => {
                try {
                    const { src } = request.params;
                    const callRecords = await this.databaseService.getCallsByDateForSource(src);
                    return callRecords;
                }
                catch (error) {
                    server.log.error(error);
                }
            });
            // use query params to get the call by date and time
            server.get("/calls/guid", {
                schema: {
                    querystring: typebox_1.Type.Object({
                        guid: typebox_1.Type.String(),
                    }),
                },
            }, async (request, reply) => {
                try {
                    const { guid } = request.query;
                    const callRecord = await this.databaseService.getCallByGuid(guid);
                    return callRecord;
                }
                catch (error) {
                    server.log.error(error);
                }
            });
            // Get the MP3 audio for a call
            server.get("/calls/audio", {
                schema: {
                    querystring: typebox_1.Type.Object({
                        guid: typebox_1.Type.String(),
                    }),
                },
            }, async (request, reply) => {
                try {
                    const { guid } = request.query;
                    const callRecord = await this.databaseService.getCallByGuid(guid);
                    if (!callRecord) {
                        return reply.code(404).send({ error: "Audio not found" });
                    }
                    return reply.send({
                        call: callRecord.call,
                        summary: callRecord.summary,
                    });
                }
                catch (error) {
                    server.log.error(error);
                    return reply.code(500).send({ error: "Error retrieving audio" });
                }
            });
            // Get the chat summary
            server.get("/chat/summary", {
                schema: {
                    querystring: typebox_1.Type.Object({
                        callerId: typebox_1.Type.String(),
                        date: typebox_1.Type.String(),
                    }),
                },
            }, async (request, reply) => {
                try {
                    const { callerId, date } = request.query;
                    const summary = await this.databaseService.getChatSummary(callerId, date);
                    return summary;
                }
                catch (error) {
                    server.log.error(error);
                }
            });
            // Get chat dates for a phone number
            server.get("/chat/dates", {
                schema: {
                    querystring: typebox_1.Type.Object({
                        callerId: typebox_1.Type.String(),
                    }),
                    response: {
                        200: typebox_1.Type.Array(typebox_1.Type.Object({
                            fecha: typebox_1.Type.String(),
                            mensajes: typebox_1.Type.Number(),
                        })),
                        500: typebox_1.Type.Object({
                            error: typebox_1.Type.String(),
                        }),
                    },
                },
            }, async (request, reply) => {
                try {
                    const { callerId } = request.query;
                    const dates = await this.databaseService.getChatDates(callerId);
                    return dates;
                }
                catch (error) {
                    server.log.error(error);
                    return reply
                        .code(500)
                        .send({ error: "Error retrieving chat dates" });
                }
            });
        };
    }
}
exports.DatabaseController = DatabaseController;
