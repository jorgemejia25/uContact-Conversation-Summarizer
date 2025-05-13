import * as fs from "fs";
import * as path from "path";

import { PoolRecord } from "../../types/pool_record";
import { SummaryService } from "../summary/service";
import axios from "axios";
import { convertToMp3 } from "../../utils/audio";
import { executeQuery } from "./database";

interface CallRecord {
  fecha: string;
  horas: string;
  guids: string;
  duraciones: string;
}

/**
 * Service for handling database queries related to call records.
 */
export class DatabaseService {
  private readonly filesDir: string;

  constructor(
    private readonly summaryService: SummaryService = new SummaryService()
  ) {
    // Ensure files directory exists
    this.filesDir = path.join(process.cwd(), "files");
    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }
  }

  /**
   * Get call records grouped by date for a specific source number
   * @param src The source phone number
   * @returns Array of call records with date, times and GUIDs
   */
  public async getCallsByDateForSource(src: string): Promise<CallRecord[]> {
    // disposition is only answered
    const query = `
    SELECT
      DATE(calldate) AS fecha,
      GROUP_CONCAT(TIME(calldate) ORDER BY calldate SEPARATOR ', ') AS horas,
      GROUP_CONCAT(guid ORDER BY calldate SEPARATOR ', ') AS guids,
      GROUP_CONCAT(duration ORDER BY calldate SEPARATOR ', ') AS duraciones 
    FROM cdr_repo
    WHERE (src = ? OR dst = ?)
      AND disposition = 'ANSWERED'
      AND duration > 15
    GROUP BY DATE(calldate)
    ORDER BY fecha ASC
    `;

    try {
      const result = await executeQuery<CallRecord[]>(query, [src, src]);
      return result;
    } catch (error) {
      console.error("Error retrieving call records:", error);
      throw error;
    }
  }

  /**
   * Get the call by GUID
   * @param guid The GUID of the call
   * @returns The call record with summary
   */
  public async getCallByGuid(guid: string): Promise<{
    call: PoolRecord;
    summary: string;
  } | null> {
    const query = `SELECT * FROM cdr_repo WHERE guid = ? AND disposition = 'ANSWERED' LIMIT 1`;
    try {
      const result = await executeQuery<PoolRecord[]>(query, [guid]);

      // if result is empty, return null
      if (result.length === 0) {
        return null;
      }

      // format date to YYYYMMDD
      const callDate = new Date(result[0].calldate);
      const formattedDate = callDate
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");

      // full path of the file = /var/spool/asterisk/monitor/YYYYMMDD/guid.gsm
      const sourceFile = `/var/spool/asterisk/monitor/${formattedDate}/${guid}.gsm`;

      // read the file
      const fileContent = fs.readFileSync(sourceFile);

      // convert file to mp3
      const mp3 = await convertToMp3(fileContent);

      console.log("Mp3 creado");

      // save the mp3 file in the files directory
      const mp3Path = path.join(this.filesDir, `${guid}.mp3`);
      console.log(mp3Path);
      fs.writeFileSync(mp3Path, mp3);

      console.log("Guardando mp3");

      try {
        // generate summary
        const summary = await this.summaryService.summarizeAudio(mp3Path);
        console.log(summary);
        return { call: result[0], summary };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Log the complete error structure
          console.error("Error en la API de OpenAI:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            code: error.code,
            headers: error.response?.headers,
            request: {
              method: error.config?.method,
              url: error.config?.url,
              headers: error.config?.headers,
              data: error.config?.data,
            },
          });

          // Log the raw response data for debugging
          if (error.response?.data) {
            console.error(
              "Respuesta de error completa:",
              JSON.stringify(error.response.data, null, 2)
            );
          }

          // Si hay un mensaje de error específico de la API, lo usamos
          const errorMessage =
            error.response?.data?.error?.message || error.message;
          throw new Error(`Error al procesar el audio: ${errorMessage}`);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error retrieving call record:", error);
      throw error;
    }
  }

  /**
   * Get the chat summary
   *
   * @param callerId The caller ID
   * @param date The date of the chat
   * @returns The chat summary
   */
  public async getChatSummary(callerId: string, date: string): Promise<string> {
    const query = `
      SELECT callerid, message, dateprocessed
      FROM sms_repo
      WHERE DATE(dateprocessed) = '${date}'
        AND callerid = '${callerId}';
    `;

    const result = await executeQuery<
      {
        callerid: string;
        message: string;
        dateprocessed: string;
      }[]
    >(query);

    // generate summary
    const summary = await this.summaryService.generateSummary(
      result.map((item) => item.message).join("\n")
    );

    return summary;
  }

  /**
   * Get all dates when a phone number has sent messages
   * @param callerId The phone number to search for
   * @returns Array of dates with message counts
   */
  public async getChatDates(
    callerId: string
  ): Promise<{ fecha: string; mensajes: number }[]> {
    const query = `
      SELECT 
        DATE(dateprocessed) as fecha,
        COUNT(*) as mensajes
      FROM sms_repo
      WHERE callerid = ?
      GROUP BY DATE(dateprocessed)
      ORDER BY fecha DESC;
    `;

    try {
      const result = await executeQuery<{ fecha: string; mensajes: number }[]>(
        query,
        [callerId]
      );
      return result;
    } catch (error) {
      console.error("Error retrieving chat dates:", error);
      throw error;
    }
  }
}
