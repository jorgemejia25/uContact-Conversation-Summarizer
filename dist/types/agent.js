"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRequestSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
/**
 * Schema for validating an agent chat request.
 */
exports.AgentRequestSchema = typebox_1.Type.Object({
    number: typebox_1.Type.String({
        minLength: 8,
        maxLength: 15,
        pattern: "^[0-9+]+$",
        description: "Phone number of the user",
    }),
    message: typebox_1.Type.String({
        minLength: 1,
        description: "User message to the agent",
    }),
    contextUrl: typebox_1.Type.Optional(typebox_1.Type.String({
        minLength: 1,
        description: "Optional URL to provide context for the response (web pages)",
    })),
    pdfUrl: typebox_1.Type.Optional(typebox_1.Type.String({
        minLength: 1,
        description: "Optional PDF URL to provide context for the response",
    })),
    excelUrl: typebox_1.Type.Optional(typebox_1.Type.String({
        minLength: 1,
        description: "Optional Excel file URL (.xlsx or .xls) to provide context for the response",
    })),
    language: typebox_1.Type.Optional(typebox_1.Type.Enum({ es: "es", en: "en", pt: "pt" }, {
        default: "es",
        description: "Language for the response: es (Spanish), en (English), or pt (Portuguese)",
    })),
});
