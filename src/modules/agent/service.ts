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

      // Get context from URL if provided
      let contextContent = "";
      if (request.contextUrl) {
        try {
          contextContent = await this.getUrlContext(request.contextUrl);
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

          // Convert fecha to proper SQL date format (YYYY-MM-DD)
          if (typeof dateRecord.fecha === "string") {
            // If it's a full date string with timezone info, parse and format it
            if (
              dateRecord.fecha.includes("GMT") ||
              dateRecord.fecha.includes("T") ||
              dateRecord.fecha.length > 10
            ) {
              const date = new Date(dateRecord.fecha);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split("T")[0];
              }
            }
          }

          console.log(
            `Processing date: ${dateRecord.fecha} -> ${formattedDate}`
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
      // Use the summary service's scraping functionality
      const content = await this.summaryService.getScrapeContent(url);
      return content.substring(0, 2000); // Limit context length
    } catch (error) {
      console.error("Error scraping URL context:", error);
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
