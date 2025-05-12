import { DatabaseService } from "./service";
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

/**
 * Controller for handling database-related routes.
 */
export class DatabaseController {
  public readonly routes: FastifyPluginAsyncTypebox;

  /**
   * Constructs a new instance of DatabaseController.
   * @param databaseService The service used to process database queries.
   */
  constructor(
    private readonly databaseService: DatabaseService = new DatabaseService()
  ) {
    this.routes = async (server) => {
      server.get(
        "/calls/:src",
        {
          schema: {
            params: Type.Object({
              src: Type.String({ description: "Source phone number" }),
            }),
            response: {
              200: Type.Array(
                Type.Object({
                  fecha: Type.String(),
                  horas: Type.String(),
                })
              ),
            },
          },
        },
        async (request, reply) => {
          try {
            const { src } = request.params as { src: string };
            const callRecords =
              await this.databaseService.getCallsByDateForSource(src);
            return callRecords;
          } catch (error) {
            server.log.error(error);
          }
        }
      );

      // use query params to get the call by date and time
      server.get(
        "/calls/guid",
        {
          schema: {
            querystring: Type.Object({
              guid: Type.String(),
            }),
          },
        },
        async (request, reply) => {
          try {
            const { guid } = request.query as {
              guid: string;
            };
            const callRecord = await this.databaseService.getCallByGuid(guid);
            return callRecord;
          } catch (error) {
            server.log.error(error);
          }
        }
      );

      // Get the MP3 audio for a call
      server.get(
        "/calls/audio",
        {
          schema: {
            querystring: Type.Object({
              guid: Type.String(),
            }),
          },
        },
        async (request, reply) => {
          try {
            const { guid } = request.query as {
              guid: string;
            };
            const callRecord = await this.databaseService.getCallByGuid(guid);

            if (!callRecord) {
              return reply.code(404).send({ error: "Audio not found" });
            }

            return reply.send({
              call: callRecord.call,
              summary: callRecord.summary,
            });
          } catch (error) {
            server.log.error(error);
            return reply.code(500).send({ error: "Error retrieving audio" });
          }
        }
      );

      // Get the chat summary
      server.get(
        "/chat/summary",
        {
          schema: {
            querystring: Type.Object({
              callerId: Type.String(),
              date: Type.String(),
            }),
          },
        },
        async (request, reply) => {
          try {
            const { callerId, date } = request.query as {
              callerId: string;
              date: string;
            };
            const summary = await this.databaseService.getChatSummary(
              callerId,
              date
            );
            return summary;
          } catch (error) {
            server.log.error(error);
          }
        }
      );
    };
  }
}
