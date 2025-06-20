"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const service_1 = require("../summary/service");
const axios_1 = __importDefault(require("axios"));
const audio_1 = require("../../utils/audio");
const database_1 = require("./database");
/**
 * Service for handling database queries related to call records.
 */
class DatabaseService {
    constructor(summaryService = new service_1.SummaryService()) {
        this.summaryService = summaryService;
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
    async getCallsByDateForSource(src) {
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
            const result = await (0, database_1.executeQuery)(query, [src, src]);
            return result;
        }
        catch (error) {
            console.error("Error retrieving call records:", error);
            throw error;
        }
    }
    /**
     * Get the call by GUID
     * @param guid The GUID of the call
     * @returns The call record with summary
     */
    async getCallByGuid(guid) {
        const query = `SELECT * FROM cdr_repo WHERE guid = ? AND disposition = 'ANSWERED' LIMIT 1`;
        try {
            const result = await (0, database_1.executeQuery)(query, [guid]);
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
            const mp3 = await (0, audio_1.convertToMp3)(fileContent);
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
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
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
                        console.error("Respuesta de error completa:", JSON.stringify(error.response.data, null, 2));
                    }
                    // Si hay un mensaje de error específico de la API, lo usamos
                    const errorMessage = error.response?.data?.error?.message || error.message;
                    throw new Error(`Error al procesar el audio: ${errorMessage}`);
                }
                throw error;
            }
        }
        catch (error) {
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
    async getChatSummary(callerId, date) {
        const query = `
      SELECT callerid, message, dateprocessed
      FROM sms_repo
      WHERE DATE(dateprocessed) = ?
        AND callerid = ?;
    `;
        const result = await (0, database_1.executeQuery)(query, [date, callerId]);
        if (result.length === 0) {
            return "No hay mensajes para este día";
        }
        // generate summary
        const summary = await this.summaryService.generateSummary(result.map((item) => item.message).join("\n"));
        return summary;
    }
    /**
     * Get all dates when a phone number has sent messages
     * @param callerId The phone number to search for
     * @returns Array of dates with message counts
     */
    async getChatDates(callerId) {
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
            const result = await (0, database_1.executeQuery)(query, [callerId]);
            return result;
        }
        catch (error) {
            console.error("Error retrieving chat dates:", error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
