import { Type } from "@sinclair/typebox";

/**
 * Interface representing a request to the agent chat.
 */
export interface AgentRequest {
  number: string;
  message: string;
  contextUrl?: string;
  pdfUrl?: string;
  language?: string; // 'es' (Spanish), 'en' (English), or 'pt' (Portuguese)
}

/**
 * Schema for validating an agent chat request.
 */
export const AgentRequestSchema = Type.Object({
  number: Type.String({
    minLength: 8,
    maxLength: 15,
    pattern: "^[0-9+]+$",
    description: "Phone number of the user",
  }),
  message: Type.String({
    minLength: 1,
    description: "User message to the agent",
  }),
  contextUrl: Type.Optional(
    Type.String({
      format: "uri",
      description:
        "Optional URL to provide context for the response (web pages)",
    })
  ),
  pdfUrl: Type.Optional(
    Type.String({
      format: "uri",
      description: "Optional PDF URL to provide context for the response",
    })
  ),
  language: Type.Optional(
    Type.Enum(
      { es: "es", en: "en", pt: "pt" },
      {
        default: "es",
        description:
          "Language for the response: es (Spanish), en (English), or pt (Portuguese)",
      }
    )
  ),
});
