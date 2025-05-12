import * as fs from "fs";

import { PoolRecord } from "../../types/pool_record";
import { SummaryService } from "../summary/service";
import { convertToMp3 } from "../../utils/audio";
import { executeQuery } from "./database";

interface CallRecord {
  fecha: string;
  horas: string;
}

/**
 * Service for handling database queries related to call records.
 */
export class DatabaseService {
  constructor(
    private readonly summaryService: SummaryService = new SummaryService()
  ) {}

  /**
   * Get call records grouped by date for a specific source number
   * @param src The source phone number
   * @returns Array of call records with date and times
   */
  public async getCallsByDateForSource(src: string): Promise<CallRecord[]> {
    // disposition is only answered
    const query = `
      SELECT
        DATE(calldate) AS fecha,
        GROUP_CONCAT(TIME(calldate) ORDER BY calldate SEPARATOR ', ') AS horas
      FROM cdr_repo
      WHERE src = ? AND disposition = 'ANSWERED'
      GROUP BY DATE(calldate)
      ORDER BY fecha ASC
    `;

    try {
      const result = await executeQuery<CallRecord[]>(query, [src]);
      return result;
    } catch (error) {
      console.error("Error retrieving call records:", error);
      throw error;
    }
  }

  /**
   * Get the call by date and time
   * @param date The date of the call
   * @param time The time of the call
   * @returns The call record
   */
  public async getCallByDateAndTime(
    date: string,
    time: string
  ): Promise<{
    call: PoolRecord;
    summary: string;
  } | null> {
    // take only 1 record
    const query = `SELECT * FROM cdr_repo WHERE DATE(calldate) = ? AND TIME(calldate) = ? AND disposition = 'ANSWERED' LIMIT 1`;
    try {
      const result = await executeQuery<PoolRecord[]>(query, [date, time]);

      // if result is empty, return null
      if (result.length === 0) {
        return null;
      }

      // format date to YYYYMMDD
      const formattedDate = date.split("-").join("");

      // full path of the file = /var/spool/asterisk/monitor/YYYYMMDD/guid.gsm
      const file = `/var/spool/asterisk/monitor/${formattedDate}/${result[0].guid}.gsm`;

      // read the file
      const fileContent = fs.readFileSync(file);

      // convert file to mp3
      const mp3 = await convertToMp3(fileContent);

      // save the mp3 file in the /var/spool/asterisk/monitor/YYYYMMDD/guid.mp3
      const mp3Path = `/var/spool/asterisk/monitor/${formattedDate}/${result[0].guid}.mp3`;

      fs.writeFileSync(mp3Path, mp3);

      // generate summary
      const summary = await this.summaryService.summarizeAudio(mp3Path);

      console.log(summary);

      return { call: result[0], summary };
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
}
