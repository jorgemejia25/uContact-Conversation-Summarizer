import * as cheerio from "cheerio";

import { SummaryRequest } from "./types";
import axios from "axios";
import { injectable } from "tsyringe";

/**
 * Service for generating summaries from web page content.
 */
@injectable()
export class SummaryService {
  private openaiApiKey = process.env.OPENAI_API_KEY || "";

  /**
   * Processes a message that may contain a URL to generate a summary.
   * @param request An object containing the message and optional language.
   * @returns A promise that resolves to the summary string or an error message.
   */
  async processUrl(request: SummaryRequest): Promise<string> {
    // Extract URL from the message using regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = request.message.match(urlRegex);
    
    if (!urls || urls.length === 0) {
      const noUrlMessages = {
        'es': "No se encontró ninguna URL en el mensaje.",
        'en': "No URL found in the message.",
        'pt': "Nenhuma URL encontrada na mensagem."
      };
      
      const language = request.language && ['es', 'en', 'pt'].includes(request.language) ? request.language : 'es';
      return noUrlMessages[language as keyof typeof noUrlMessages];
    }
    
    // Process the first URL found in the message
    const url = urls[0];
    try {
      const content = await this.scrapeContent(url);
      return this.generateSummary(content, request.language);
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      
      const errorMessages = {
        'es': `Error al procesar la URL (${url}): `,
        'en': `Error processing URL (${url}): `,
        'pt': `Erro ao processar URL (${url}): `
      };
      
      const language = request.language && ['es', 'en', 'pt'].includes(request.language) ? request.language : 'es';
      return errorMessages[language as keyof typeof errorMessages] + 
        (error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Scrapes content from the given URL.
   * @param url The URL of the web page to scrape.
   * @returns A promise that resolves to the scraped content as a string.
   */
  private async scrapeContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        timeout: 10000,
      });
      console.log("Tipo de respuesta:", typeof response.data);

      // La respuesta ya es HTML, no es necesario verificar si es string
      const $ = cheerio.load(response.data);
      const bodyText = $("body").text();

      if (!bodyText) throw new Error("Contenido HTML vacío");

      return bodyText.substring(0, 3000);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw new Error(
        `Falló la extracción: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Generates a summary from the provided text using OpenAI's API.
   * @param text The text to summarize.
   * @param language The language to use for the summary (es, en, pt).
   * @returns A promise that resolves to the summary string.
   */
  private async generateSummary(text: string, language: string = 'es'): Promise<string> {
    try {
      const languageInstructions = {
        'es': {
          systemMessage: "Eres un experto en crear resúmenes concisos e informativos en español.",
          userPrompt: `Por favor, proporciona un resumen conciso del siguiente texto en 3-5 oraciones en español:\n\n${text}`
        },
        'en': {
          systemMessage: "You are an expert at creating concise and informative summaries in English.",
          userPrompt: `Please provide a concise summary of the following text in 3-5 sentences in English:\n\n${text}`
        },
        'pt': {
          systemMessage: "Você é um especialista em criar resumos concisos e informativos em português.",
          userPrompt: `Por favor, forneça um resumo conciso do seguinte texto em 3-5 frases em português:\n\n${text}`
        }
      };
      
      // Default to Spanish if language is not specified or invalid
      const selectedLanguage = language && ['es', 'en', 'pt'].includes(language) ? language : 'es';
      const instructions = languageInstructions[selectedLanguage as keyof typeof languageInstructions];

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: instructions.systemMessage
            },
            {
              role: "user",
              content: instructions.userPrompt
            }
          ],
          max_tokens: 300,
          temperature: 0.2
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.openaiApiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating summary:", error);
      
      // Error messages in the appropriate language
      const errorMessages = {
        'es': "No se pudo generar un resumen: ",
        'en': "Failed to generate a summary: ",
        'pt': "Não foi possível gerar um resumo: "
      };
      
      const selectedLanguage = language && ['es', 'en', 'pt'].includes(language) ? language : 'es';
      const errorPrefix = errorMessages[selectedLanguage as keyof typeof errorMessages];
      
      return errorPrefix + (error instanceof Error ? error.message : String(error));
    }
  }
}
