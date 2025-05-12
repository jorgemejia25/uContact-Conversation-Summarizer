import { Type } from "@sinclair/typebox";

/**
 * Interface representing a request to summarize content from a message that may contain a URL.
 */
export interface SummaryRequest {
  message: string;
  language?: string; // 'es' (Spanish), 'en' (English), or 'pt' (Portuguese)
}

/**
 * Schema for validating a summary request.
 */
export const SummaryRequestSchema = Type.Object({
  message: Type.String({
    minLength: 1,
    description: "Message that may contain a URL to analyze",
  }),
  language: Type.Optional(
    Type.Enum(
      { es: "es", en: "en", pt: "pt" },
      {
        default: "es",
        description:
          "Language for the summary: es (Spanish), en (English), or pt (Portuguese)",
      }
    )
  ),
});
