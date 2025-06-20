"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookRequestSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
/**
 * Schema for validating a webhook request.
 */
exports.WebhookRequestSchema = typebox_1.Type.Object({
    event_type: typebox_1.Type.String({
        minLength: 1,
        description: "Type of the event being triggered",
    }),
    event_id: typebox_1.Type.String({
        description: "Unique identifier for the event",
    }),
    contact: typebox_1.Type.Object({
        id: typebox_1.Type.Number(),
        firstName: typebox_1.Type.String(),
        lastName: typebox_1.Type.String(),
        phone: typebox_1.Type.String(),
        email: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.String()]),
        language: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.String()]),
        profilePic: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.String()]),
        countryCode: typebox_1.Type.String(),
        status: typebox_1.Type.String(),
        assignee: typebox_1.Type.Object({
            id: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.Number()]),
            firstName: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.String()]),
            lastName: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.String()]),
            email: typebox_1.Type.Union([typebox_1.Type.Null(), typebox_1.Type.String()]),
        }),
        created_at: typebox_1.Type.Number(),
        lifecycle: typebox_1.Type.String(),
    }),
    message: typebox_1.Type.Object({
        messageId: typebox_1.Type.Number(),
        channelMessageId: typebox_1.Type.String(),
        contactId: typebox_1.Type.Number(),
        channelId: typebox_1.Type.Number(),
        traffic: typebox_1.Type.String(),
        timestamp: typebox_1.Type.Number(),
        message: typebox_1.Type.Object({
            type: typebox_1.Type.String(),
            text: typebox_1.Type.String(),
        }),
    }),
    channel: typebox_1.Type.Object({
        id: typebox_1.Type.Number(),
        name: typebox_1.Type.String(),
        source: typebox_1.Type.String(),
        meta: typebox_1.Type.String(),
        created_at: typebox_1.Type.Number(),
    }),
});
