import * as XLSX from "xlsx";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

import { isValidUrl, normalizeUrl } from "../../utils/url-encoder";

import FormData from "form-data";
import { SummaryRequest } from "../../types/summary";
import { WebhookRequest } from "../../types/respond_webhook";
import axios from "axios";
import { injectable } from "tsyringe";
import { pdfCache } from "../../utils/pdf-cache";
import puppeteer from "puppeteer";

// Import pdf-parse correctly
const pdfParse = require("pdf-parse");

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
        es: "No se encontró ninguna URL en el mensaje.",
        en: "No URL found in the message.",
        pt: "Nenhuma URL encontrada na mensagem.",
      };

      const language =
        request.language && ["es", "en", "pt"].includes(request.language)
          ? request.language
          : "es";
      return noUrlMessages[language as keyof typeof noUrlMessages];
    }

    // Process the first URL found in the message
    const url = urls[0];
    try {
      const content = await this.scrapeContent(url);

      // Si el contenido está vacío o es demasiado corto, es posible que estemos siendo bloqueados
      // o que el sitio use JavaScript para cargar el contenido
      if (!content || content.trim().length < 100) {
        const insufficientContentMessages = {
          es: `No se pudo extraer suficiente contenido de la URL (${url}). Es posible que el sitio tenga protección contra scraping o use JavaScript para cargar el contenido.`,
          en: `Could not extract sufficient content from URL (${url}). The site may have scraping protection or use JavaScript to load content.`,
          pt: `Não foi possível extrair conteúdo suficiente da URL (${url}). O site pode ter proteção contra scraping ou usar JavaScript para carregar conteúdo.`,
        };

        const language =
          request.language && ["es", "en", "pt"].includes(request.language)
            ? request.language
            : "es";

        return insufficientContentMessages[
          language as keyof typeof insufficientContentMessages
        ];
      }

      return this.generateSummary(content, request.language);
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);

      const errorMessages = {
        es: `Error al procesar la URL (${url}): `,
        en: `Error processing URL (${url}): `,
        pt: `Erro ao processar URL (${url}): `,
      };

      const language =
        request.language && ["es", "en", "pt"].includes(request.language)
          ? request.language
          : "es";
      return (
        errorMessages[language as keyof typeof errorMessages] +
        (error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Public method to scrape content from a URL for external services.
   * @param url The URL to scrape content from.
   * @returns A promise that resolves to the scraped content.
   */
  public async getScrapeContent(url: string): Promise<string> {
    // Check if the URL is a PDF
    if (this.isPdfUrl(url)) {
      console.log("Detected PDF URL, processing as PDF:", url);
      return this.processPdfFromUrl(url);
    }

    // Check if the URL is an Excel file
    if (this.isExcelUrl(url)) {
      console.log("Detected Excel URL, processing as Excel:", url);
      return this.processExcelFromUrl(url);
    }

    return this.scrapeContent(url);
  }

  /**
   * Checks if a URL points to a PDF file.
   * @param url The URL to check.
   * @returns True if the URL appears to be a PDF.
   */
  private isPdfUrl(url: string): boolean {
    const urlLower = url.toLowerCase();
    // Check if URL ends with .pdf or contains pdf in query parameters
    return (
      urlLower.endsWith(".pdf") ||
      urlLower.includes(".pdf?") ||
      urlLower.includes("pdf=") ||
      urlLower.includes("filetype=pdf")
    );
  }

  /**
   * Checks if a URL points to an Excel file (.xlsx or .xls).
   * @param url The URL to check.
   * @returns True if the URL appears to be an Excel file.
   */
  private isExcelUrl(url: string): boolean {
    const urlLower = url.toLowerCase();
    return (
      urlLower.endsWith(".xlsx") ||
      urlLower.endsWith(".xls") ||
      urlLower.includes(".xlsx?") ||
      urlLower.includes(".xls?")
    );
  }

  /**
   * Downloads and extracts text from a PDF URL.
   * @param url The PDF URL to process.
   * @returns A promise that resolves to the extracted text.
   */
  public async processPdfFromUrl(url: string): Promise<string> {
    try {
      // Normalize the URL first
      const normalizedUrl = normalizeUrl(url);

      // Validate URL
      if (!isValidUrl(normalizedUrl)) {
        throw new Error("Invalid URL format");
      }

      // Check cache first using normalized URL
      const cachedContent = pdfCache.get(normalizedUrl);
      if (cachedContent) {
        return cachedContent;
      }

      console.log("Downloading PDF from:", normalizedUrl);

      // Download the PDF with conservative limits
      const response = await axios.get(normalizedUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/pdf,*/*",
        },
        timeout: 15000, // Reduced to 15 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // Reduced to 10MB max file size
        maxRedirects: 3, // Limit redirects
      });

      // Verify content type
      const contentType = response.headers["content-type"];
      if (contentType && !contentType.includes("pdf")) {
        console.warn(
          `Warning: Expected PDF but got content-type: ${contentType}`
        );
      }

      const fileSizeMB = (response.data.byteLength / (1024 * 1024)).toFixed(2);
      console.log(`PDF downloaded successfully, size: ${fileSizeMB}MB`);

      // Extract text from PDF
      const data = await pdfParse(response.data);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error(
          "No text could be extracted from the PDF - file may be image-based or corrupted"
        );
      }

      console.log(
        `Text extracted from PDF, length: ${data.text.length} characters`
      );
      console.log(
        `PDF info - Pages: ${data.numpages}, Title: ${
          data.info?.Title || "N/A"
        }`
      );

      // Clean and limit the text
      const cleanedText = data.text
        .replace(/\s+/g, " ") // Replace multiple whitespace with single space
        .trim()
        .substring(0, 4000); // Reduced to 4000 characters for better performance

      // Cache the processed content using normalized URL
      pdfCache.set(
        normalizedUrl,
        cleanedText,
        response.data.byteLength,
        data.numpages,
        data.info?.Title
      );

      return cleanedText;
    } catch (error) {
      console.error("Error processing PDF:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          throw new Error(
            "PDF download timeout - file too large or server too slow. Try a smaller PDF file."
          );
        } else if (error.response?.status === 404) {
          throw new Error("PDF file not found (404)");
        } else if (error.response?.status === 403) {
          throw new Error("Access denied to PDF file (403)");
        } else if (error.response?.status === 413) {
          throw new Error("PDF file too large for server to handle");
        }
      }

      throw new Error(
        `Failed to process PDF: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Downloads and extracts text from an Excel file URL.
   * @param url The Excel URL to process.
   * @returns A promise that resolves to the extracted text.
   */
  public async processExcelFromUrl(url: string): Promise<string> {
    try {
      const normalizedUrl = normalizeUrl(url);
      if (!isValidUrl(normalizedUrl)) {
        throw new Error("Invalid URL format");
      }
      // Check cache first (reuse pdfCache for simplicity)
      const cachedContent = pdfCache.get(normalizedUrl);
      if (cachedContent) {
        return cachedContent;
      }
      console.log("Downloading Excel from:", normalizedUrl);
      const response = await axios.get(normalizedUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, */*",
        },
        timeout: 15000,
        maxContentLength: 10 * 1024 * 1024, // 10MB
        maxRedirects: 3,
      });

      const contentType = response.headers["content-type"];
      if (
        contentType &&
        !contentType.includes("sheet") &&
        !contentType.includes("excel")
      ) {
        console.warn(
          `Warning: Expected Excel but got content-type: ${contentType}`
        );
      }

      const workbook = XLSX.read(response.data, { type: "buffer" });
      let text = "";
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<
          Array<any>
        >;
        text += this.convertRowsToStructuredText(rows, sheetName) + "\n";
      });

      if (!text.trim()) {
        throw new Error("No text could be extracted from the Excel file");
      }

      const cleanedText = text.replace(/\s+/g, " ").trim().substring(0, 4000);

      // Cache with pages = 0
      pdfCache.set(
        normalizedUrl,
        cleanedText,
        response.data.byteLength,
        0,
        workbook.Props?.Title as string | undefined
      );

      return cleanedText;
    } catch (error) {
      console.error("Error processing Excel:", error);
      throw new Error(
        `Failed to process Excel: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  private convertRowsToStructuredText(
    rows: Array<Array<any>>,
    sheetName: string
  ): string {
    if (!rows || rows.length === 0) return "";
    const headers = rows[0].map((h, idx) =>
      h ? String(h).trim() : `col${idx}`
    );
    let result = `### Hoja: ${sheetName}\n`;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const pairs = headers.map((h, idx) => `${h}: ${row[idx] ?? ""}`);
      result += pairs.join(", ") + "\n";
    }
    return result;
  }

  /**
   * Scrapes content from the given URL using multiple methods (Axios and Puppeteer).
   * @param url The URL of the web page to scrape.
   * @returns A promise that resolves to the scraped content as a string.
   */
  private async scrapeContent(url: string): Promise<string> {
    try {
      // Temporally disabled Puppeteer due to Chrome not being available
      // First attempt with Puppeteer (headless browser)
      // try {
      //   console.log("Intentando scraping con Puppeteer:", url);
      //   const content = await this.scrapeWithPuppeteer(url);
      //   if (content && content.trim().length > 100) {
      //     console.log("Contenido extraído con Puppeteer exitoso");
      //     return content;
      //   }
      // } catch (puppeteerError) {
      //   console.error("Error en scraping con Puppeteer:", puppeteerError);
      //   // Si Puppeteer falla, continuamos con el método tradicional
      // }

      // Using Axios and Cheerio for scraping
      console.log("Intentando scraping con Axios/Cheerio:", url);
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          Referer: "https://www.google.com/",
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      // Intentamos extraer contenido relevante del sitio de forma más específica
      // Primero intentamos con los elementos que normalmente contienen la descripción del producto
      let productContent = "";

      // Para sitios de e-commerce (como tiendaenlinea.claro.com.gt)
      // Extraemos título, precio, descripción y características del producto
      const productTitle =
        $("h1").first().text().trim() ||
        $(".product-title").text().trim() ||
        $("title").text().trim();
      const productPrice = $(
        ".price, .product-price, [class*='price'], [id*='price']"
      )
        .first()
        .text()
        .trim();
      const productDesc = $(
        ".product-description, .description, [class*='description'], [id*='description'], [class*='product-details']"
      )
        .text()
        .trim();
      const productFeatures = $(
        ".product-features, .features, [class*='features'], [class*='specifications']"
      )
        .text()
        .trim();

      // Si encontramos alguna información específica del producto, la utilizamos
      if (productTitle || productPrice || productDesc || productFeatures) {
        productContent = `
          Título: ${productTitle}
          Precio: ${productPrice}
          Descripción: ${productDesc}
          Características: ${productFeatures}
        `;
      }

      // Si encontramos contenido específico de producto, lo usamos; de lo contrario, extraemos el contenido general
      const mainContent =
        productContent ||
        $("#main-content, .main-content, [role='main']").text() ||
        $("article").text() ||
        $(".content, .container").text();

      // Si aún no tenemos contenido útil, intentamos con el body
      const bodyText = mainContent || $("body").text();

      if (!bodyText || bodyText.trim().length < 50) {
        throw new Error("No se pudo extraer contenido útil de la página");
      }

      // Limpiamos el texto
      const cleanedText = bodyText
        .replace(/\s+/g, " ") // Reemplaza múltiples espacios, tabs y saltos de línea con un solo espacio
        .trim()
        .substring(0, 3000); // Limitamos a 3000 caracteres para la API de OpenAI

      console.log(
        "Contenido extraído con Axios/Cheerio (primeros 200 caracteres):",
        cleanedText.substring(0, 200)
      );
      return cleanedText;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw new Error(
        `Falló la extracción: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Scrapes content using Puppeteer, which can render JavaScript.
   * @param url The URL to scrape.
   * @returns The extracted content.
   */
  private async scrapeWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Configurar un User-Agent convincente
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
      );

      // Configurar viewpoint para simular un dispositivo desktop
      await page.setViewport({ width: 1366, height: 768 });

      // Navegar a la URL con timeout de 30 segundos
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Esperar un momento para que el JavaScript cargue todo el contenido dinámico
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extraer información específica para productos
      const content = await page.evaluate(() => {
        // Función helper para limpiar texto
        const cleanText = (text: string) =>
          text ? text.trim().replace(/\s+/g, " ") : "";

        // Buscar elementos de producto
        const title =
          document.querySelector("h1")?.textContent ||
          document.querySelector("title")?.textContent ||
          document.querySelector(".product-title")?.textContent ||
          "";

        const price =
          document.querySelector(
            '.price, .product-price, [class*="price"], [id*="price"]'
          )?.textContent || "";

        const description =
          document.querySelector(
            '.product-description, .description, [class*="description"], [id*="description"]'
          )?.textContent || "";

        const features =
          document.querySelector(
            '.product-features, .features, [class*="features"], [class*="specifications"]'
          )?.textContent || "";

        // Si es un producto, formateamos la información
        if (title || price || description || features) {
          return `
            Título: ${cleanText(title)}
            Precio: ${cleanText(price)}
            Descripción: ${cleanText(description)}
            Características: ${cleanText(features)}
          `;
        }

        // Si no encontramos información específica, obtenemos el contenido principal
        const mainContent =
          document.querySelector(
            '#main-content, .main-content, [role="main"], article, .content, .container'
          )?.textContent || "";

        return mainContent || document.body.textContent || "";
      });

      // Limpiar el contenido obtenido
      const cleanedContent = content
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 3000);

      console.log(
        "Contenido extraído con Puppeteer (primeros 200 caracteres):",
        cleanedContent.substring(0, 200)
      );

      return cleanedContent;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generates a summary from the provided text using OpenAI's API.
   * @param text The text to summarize.
   * @param language The language to use for the summary (es, en, pt).
   * @returns A promise that resolves to the summary string.
   */
  public async generateSummary(
    text: string,
    language: string = "es"
  ): Promise<string> {
    try {
      const languageInstructions = {
        es: {
          systemMessage:
            "Eres un experto en crear resúmenes detallados e informativos en español. Tu objetivo es proporcionar la información más relevante y clara posible, estructurada de manera que sea fácil de entender.",
          userPrompt: `Por favor, genera un resumen detallado y completo del siguiente contenido web. 
Si es un producto, incluye características principales, precio, especificaciones técnicas y cualquier otra información relevante.
Si es un artículo, estructura el resumen para incluir los puntos principales, ideas clave y conclusiones.
Organiza la información de manera clara y ordenada, utilizando un lenguaje preciso y profesional en español:

${text}`,
        },
        en: {
          systemMessage:
            "You are an expert at creating detailed and informative summaries in English. Your goal is to provide the most relevant and clear information possible, structured in a way that is easy to understand.",
          userPrompt: `Please generate a detailed and comprehensive summary of the following web content.
If it's a product, include main features, price, technical specifications, and any other relevant information.
If it's an article, structure the summary to include the main points, key ideas, and conclusions.
Organize the information in a clear and orderly manner, using precise and professional language in English:

${text}`,
        },
        pt: {
          systemMessage:
            "Você é um especialista em criar resumos detalhados e informativos em português. Seu objetivo é fornecer as informações mais relevantes e claras possíveis, estruturadas de maneira fácil de entender.",
          userPrompt: `Por favor, gere um resumo detalhado e abrangente do seguinte conteúdo da web.
Se for um produto, inclua características principais, preço, especificações técnicas e qualquer outra informação relevante.
Se for um artigo, estruture o resumo para incluir os pontos principais, ideias-chave e conclusões.
Organize as informações de maneira clara e ordenada, utilizando linguagem precisa e profissional em português:

${text}`,
        },
      };

      // Default to Spanish if language is not specified or invalid
      const selectedLanguage =
        language && ["es", "en", "pt"].includes(language) ? language : "es";
      const instructions =
        languageInstructions[
          selectedLanguage as keyof typeof languageInstructions
        ];

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: instructions.systemMessage,
            },
            {
              role: "user",
              content: instructions.userPrompt,
            },
          ],
          max_tokens: 500, // Aumentado para permitir respuestas más largas
          temperature: 0.3, // Reducido para obtener respuestas más consistentes
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating summary:", error);

      // Error messages in the appropriate language
      const errorMessages = {
        es: "No se pudo generar un resumen: ",
        en: "Failed to generate a summary: ",
        pt: "Não foi possível gerar um resumo: ",
      };

      const selectedLanguage =
        language && ["es", "en", "pt"].includes(language) ? language : "es";
      const errorPrefix =
        errorMessages[selectedLanguage as keyof typeof errorMessages];

      return (
        errorPrefix + (error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Generates a summary from the provided text using OpenAI's API and Respond.io Webhook.
   */
  async generateSummaryFromWebhook(request: WebhookRequest): Promise<void> {
    console.log("Recibiendo petición:", request);
  }

  /**
   * Transcribes and summarizes an audio file using OpenAI's Whisper model.
   * @param audioFilePath The path to the local MP3 file.
   * @returns A promise that resolves to the summary of the audio content.
   */
  async summarizeAudio(audioFilePath: string): Promise<string> {
    try {
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found at path: ${audioFilePath}`);
      }

      // Check if file is an MP3
      if (!audioFilePath.toLowerCase().endsWith(".mp3")) {
        throw new Error("Only MP3 files are supported");
      }

      console.log(`Transcribing audio file: ${audioFilePath}`);

      // First, transcribe the audio using Whisper API
      const formData = new FormData();
      formData.append("file", fs.createReadStream(audioFilePath));
      formData.append("model", "whisper-1");
      formData.append("response_format", "json");

      const transcriptionResponse = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            ...formData.getHeaders(),
          },
        }
      );

      const transcription = transcriptionResponse.data.text;

      if (!transcription || transcription.trim().length === 0) {
        throw new Error("The audio file could not be transcribed or is empty");
      }

      console.log("Audio successfully transcribed, generating summary...");

      // Now generate a summary from the transcription
      return this.generateSummary(transcription);
    } catch (error) {
      console.error("Error processing audio file:", error);
      return `Error processing audio file: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Extracts text from a local Excel file path.
   * @param filePath Absolute or relative path to the Excel file
   */
  public async processExcelFromFile(filePath: string): Promise<string> {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Excel file not found at ${resolvedPath}`);
      }

      const data = fs.readFileSync(resolvedPath);
      const workbook = XLSX.read(data, { type: "buffer" });
      let text = "";
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<
          Array<any>
        >;
        text += this.convertRowsToStructuredText(rows, sheetName) + "\n";
      });

      if (!text.trim()) {
        throw new Error("No text could be extracted from the Excel file");
      }

      const cleanedText = text.replace(/\s+/g, " ").trim().substring(0, 4000);

      // Cache content keyed by absolute path
      pdfCache.set(
        resolvedPath,
        cleanedText,
        data.byteLength,
        0,
        workbook.Props?.Title as string | undefined
      );

      return cleanedText;
    } catch (error) {
      console.error("Error processing local Excel:", error);
      throw new Error(
        `Failed to process local Excel: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }
}
