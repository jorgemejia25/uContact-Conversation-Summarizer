import * as path from "path";

import { AgentRequest } from "../../types/agent";
import { DatabaseService } from "../database/service";
import { SummaryService } from "../summary/service";
import axios from "axios";
import { injectable } from "tsyringe";

/**
 * Service for handling agent chat functionality.
 */
@injectable()
export class AgentService {
  private openaiApiKey = process.env.OPENAI_API_KEY || "";

  constructor(
    private readonly databaseService: DatabaseService = new DatabaseService(),
    private readonly summaryService: SummaryService = new SummaryService()
  ) {}

  /**
   * Processes an agent chat request with conversation history and optional context URL.
   * @param request An object containing the number, message, optional context URL, and language.
   * @returns A promise that resolves to the agent's response.
   */
  async processAgentRequest(request: AgentRequest): Promise<string> {
    try {
      // Get conversation history for the user
      const conversationHistory = await this.getConversationHistory(
        request.number
      );

      // Get context from URL or PDF if provided
      let contextContent = "";

      // Handle PDF URL if provided
      if (request.pdfUrl) {
        try {
          contextContent = await this.getPdfContext(request.pdfUrl);
          console.log("PDF context successfully extracted");
        } catch (error) {
          console.error("Error getting PDF context:", error);
          // Add a note about PDF processing failure to the context
          const pdfErrorMessages = {
            es: "Nota: No se pudo procesar el documento PDF proporcionado debido a un error técnico (archivo muy grande, timeout, o formato no compatible). Responderé basándome en tu historial de conversaciones.",
            en: "Note: Could not process the provided PDF document due to a technical error (file too large, timeout, or incompatible format). I'll respond based on your conversation history.",
            pt: "Nota: Não foi possível processar o documento PDF fornecido devido a um erro técnico (arquivo muito grande, timeout ou formato incompatível). Responderei com base no seu histórico de conversas.",
          };

          const language = request.language || "es";
          contextContent =
            pdfErrorMessages[language as keyof typeof pdfErrorMessages];
        }
      }

      // Handle Excel URL if provided (and no PDF context yet)
      if (request.excelUrl && !contextContent) {
        try {
          contextContent = await this.getExcelContext(request.excelUrl);
          console.log("Excel context successfully extracted");
        } catch (error) {
          console.error("Error getting Excel context:", error);
          // Add a note about Excel processing failure
          const excelErrorMessages = {
            es: "Nota: No se pudo procesar el archivo Excel proporcionado debido a un error técnico (archivo muy grande, timeout o formato no compatible). Responderé basándome en tu historial de conversaciones.",
            en: "Note: Could not process the provided Excel file due to a technical error (file too large, timeout, or incompatible format). I'll respond based on your conversation history.",
            pt: "Nota: Não foi possível processar o arquivo Excel fornecido devido a um erro técnico (arquivo muito grande, timeout ou formato incompatível). Responderei com base no seu histórico de conversas.",
          };

          const language = request.language || "es";
          contextContent =
            excelErrorMessages[language as keyof typeof excelErrorMessages];
        }
      }

      // Si no se proporcionó excelUrl y aún no tenemos contexto, usa el Excel de muestra
      if (!request.excelUrl && !contextContent) {
        try {
          const defaultExcelPath = path.join("files", "sample.xlsx");
          contextContent = await this.getExcelContext(defaultExcelPath);
          console.log("Default Excel context extracted");
        } catch (error) {
          console.error("Error getting default Excel context:", error);
        }
      }

      // Handle regular web URL if provided (and no PDF or Excel was processed)
      if (request.contextUrl && !contextContent) {
        try {
          contextContent = await this.getUrlContext(request.contextUrl);
          console.log("Web context successfully extracted");
        } catch (error) {
          console.error("Error getting URL context:", error);
          // Continue without context if URL fails
        }
      }

      // Generate agent response
      return await this.generateAgentResponse(
        request.message,
        conversationHistory,
        contextContent,
        request.language || "es"
      );
    } catch (error) {
      console.error("Error processing agent request:", error);

      const errorMessages = {
        es: "Lo siento, ha ocurrido un error procesando tu mensaje. Por favor intenta de nuevo.",
        en: "Sorry, an error occurred processing your message. Please try again.",
        pt: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
      };

      const language = request.language || "es";
      return errorMessages[language as keyof typeof errorMessages];
    }
  }

  /**
   * Gets conversation history for a phone number from chat records.
   * @param phoneNumber The phone number to get history for.
   * @returns A string containing the conversation history.
   */
  private async getConversationHistory(phoneNumber: string): Promise<string> {
    try {
      // Get chat dates for the phone number
      const chatDates = await this.databaseService.getChatDates(phoneNumber);

      if (chatDates.length === 0) {
        return "No hay historial de conversaciones previas.";
      }

      // Get the last 3 conversation dates
      const recentDates = chatDates.slice(0, 3);
      let conversationHistory = "";

      for (const dateRecord of recentDates) {
        try {
          // Format the date properly for SQL query
          let formattedDate = dateRecord.fecha;

          console.log(
            `Original date: "${
              dateRecord.fecha
            }", type: ${typeof dateRecord.fecha}, length: ${
              dateRecord.fecha?.length
            }`
          );

          // Convert fecha to proper SQL date format (YYYY-MM-DD)
          if (typeof dateRecord.fecha === "string") {
            // Always try to parse the date and convert to YYYY-MM-DD format
            const date = new Date(dateRecord.fecha);
            console.log(
              `Parsed date: ${date}, isValid: ${!isNaN(date.getTime())}`
            );

            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split("T")[0];
              console.log(`Converted to: ${formattedDate}`);
            } else {
              console.error(`Failed to parse date: ${dateRecord.fecha}`);
              // If parsing fails, try to extract just the date part if it's already in YYYY-MM-DD format
              const dateMatch = dateRecord.fecha.match(/\d{4}-\d{2}-\d{2}/);
              if (dateMatch) {
                formattedDate = dateMatch[0];
                console.log(`Extracted date part: ${formattedDate}`);
              }
            }
          }

          console.log(
            `Final processed date: ${dateRecord.fecha} -> ${formattedDate}`
          );

          const summary = await this.databaseService.getChatSummary(
            phoneNumber,
            formattedDate
          );
          conversationHistory += `Fecha ${formattedDate}: ${summary}\n`;
        } catch (error) {
          console.error(
            `Error getting chat summary for ${dateRecord.fecha}:`,
            error
          );
        }
      }

      return (
        conversationHistory ||
        "No se pudo obtener el historial de conversaciones."
      );
    } catch (error) {
      console.error("Error getting conversation history:", error);
      return "No se pudo acceder al historial de conversaciones.";
    }
  }

  /**
   * Gets context content from a URL.
   * @param url The URL to scrape for context.
   * @returns A string containing the context content.
   */
  private async getUrlContext(url: string): Promise<string> {
    try {
      // Use the summary service's scraping functionality for web pages
      const content = await this.summaryService.getScrapeContent(url);
      return content.substring(0, 2000); // Limit context length
    } catch (error) {
      console.error("Error scraping URL context:", error);
      throw error;
    }
  }

  /**
   * Gets context content from a PDF URL.
   * @param pdfUrl The PDF URL to process.
   * @returns A string containing the PDF context content.
   */
  private async getPdfContext(pdfUrl: string): Promise<string> {
    try {
      // Use the summary service's PDF processing functionality
      const content = await this.summaryService.processPdfFromUrl(pdfUrl);
      return content.substring(0, 3000); // Allow more content for PDFs
    } catch (error) {
      console.error("Error processing PDF context:", error);
      throw error;
    }
  }

  /**
   * Gets context content from a Excel URL.
   * @param excelPathOrUrl The Excel URL or path to process.
   * @returns A string containing the Excel context content.
   */
  private async getExcelContext(excelPathOrUrl: string): Promise<string> {
    try {
      const isRemote =
        excelPathOrUrl.startsWith("http://") ||
        excelPathOrUrl.startsWith("https://");
      const content = isRemote
        ? await this.summaryService.processExcelFromUrl(excelPathOrUrl)
        : await this.summaryService.processExcelFromFile(excelPathOrUrl);
      return content.substring(0, 3000);
    } catch (error) {
      console.error("Error processing Excel context:", error);
      throw error;
    }
  }

  /**
   * Generates an agent response using OpenAI GPT based on message, history, and context.
   * @param message The current user message.
   * @param conversationHistory The conversation history.
   * @param contextContent Optional context from URL.
   * @param language The response language.
   * @returns A promise that resolves to the agent's response.
   */
  private async generateAgentResponse(
    message: string,
    conversationHistory: string,
    contextContent: string = "",
    language: string = "es"
  ): Promise<string> {
    const languagePrompts = {
      es: {
        systemPrompt: `Eres un asistente virtual inteligente y empático. Tu trabajo es ayudar al usuario respondiendo de manera útil, clara y natural. 

Tienes acceso a:
1. El historial de conversaciones previas del usuario
2. Información de contexto adicional (si se proporciona una URL)

Instrucciones:
- Responde en español de manera conversacional y amigable
- Utiliza el historial de conversaciones para personalizar tu respuesta
- Si hay información de contexto de una URL, úsala para enriquecer tu respuesta
- Sé conciso pero completo en tus respuestas
- Si no tienes suficiente información, pregunta de manera amable`,
        contextPrefix: "Información de contexto adicional:",
        historyPrefix: "Historial de conversaciones previas:",
        userMessagePrefix: "Mensaje actual del usuario:",
      },
      en: {
        systemPrompt: `You are an intelligent and empathetic virtual assistant. Your job is to help the user by responding in a useful, clear, and natural way.

You have access to:
1. The user's previous conversation history
2. Additional context information (if a URL is provided)

Instructions:
- Respond in English conversationally and friendly
- Use conversation history to personalize your response
- If there's context information from a URL, use it to enrich your response
- Be concise but complete in your responses
- If you don't have enough information, ask politely`,
        contextPrefix: "Additional context information:",
        historyPrefix: "Previous conversation history:",
        userMessagePrefix: "Current user message:",
      },
      pt: {
        systemPrompt: `Você é um assistente virtual inteligente e empático. Seu trabalho é ajudar o usuário respondendo de forma útil, clara e natural.

Você tem acesso a:
1. O histórico de conversas anteriores do usuário
2. Informações de contexto adicional (se uma URL for fornecida)

Instruções:
- Responda em português de forma conversacional e amigável
- Use o histórico de conversas para personalizar sua resposta
- Se houver informações de contexto de uma URL, use-as para enriquecer sua resposta
- Seja conciso mas completo em suas respostas
- Se não tiver informações suficientes, pergunte de forma educada`,
        contextPrefix: "Informações de contexto adicional:",
        historyPrefix: "Histórico de conversas anteriores:",
        userMessagePrefix: "Mensagem atual do usuário:",
      },
    };

    const prompts =
      languagePrompts[language as keyof typeof languagePrompts] ||
      languagePrompts.es;

    let prompt = prompts.systemPrompt + "\n\n";

    if (
      conversationHistory &&
      conversationHistory.trim() !==
        "No hay historial de conversaciones previas."
    ) {
      prompt += `${prompts.historyPrefix}\n${conversationHistory}\n\n`;
    }

    if (contextContent) {
      prompt += `${prompts.contextPrefix}\n${contextContent}\n\n`;
    }

    prompt += `${prompts.userMessagePrefix}\n${message}`;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return (
        response.data.choices[0]?.message?.content ||
        "No se pudo generar una respuesta."
      );
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error("Error generando respuesta del agente");
    }
  }
}
