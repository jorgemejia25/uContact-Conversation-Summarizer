"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryRequestSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
/**
 * Schema for validating a summary request.
 */
exports.SummaryRequestSchema = typebox_1.Type.Object({
    message: typebox_1.Type.String({
        minLength: 1,
        description: "Message that may contain a URL to analyze",
    }),
    language: typebox_1.Type.Optional(typebox_1.Type.Enum({ es: "es", en: "en", pt: "pt" }, {
        default: "es",
        description: "Language for the summary: es (Spanish), en (English), or pt (Portuguese)",
    })),
});
