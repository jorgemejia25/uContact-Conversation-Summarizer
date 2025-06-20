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
exports.convertToMp3 = convertToMp3;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
// Configurar ffmpeg con el instalador
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
/**
 * Convierte un archivo de audio a formato MP3
 * @param inputBuffer Buffer del archivo de audio a convertir
 * @returns Promise<Buffer> Buffer del archivo MP3 convertido
 */
async function convertToMp3(inputBuffer) {
    return new Promise((resolve, reject) => {
        // Crear un archivo temporal para el input
        const tempInputPath = path.join(process.cwd(), "files", `temp_input_${Date.now()}.gsm`);
        const tempOutputPath = path.join(process.cwd(), "files", `temp_output_${Date.now()}.mp3`);
        try {
            // Escribir el buffer de entrada a un archivo temporal
            fs.writeFileSync(tempInputPath, inputBuffer);
            // Configurar la conversión
            (0, fluent_ffmpeg_1.default)(tempInputPath)
                .toFormat("mp3")
                .audioBitrate("128k")
                .audioChannels(1)
                .audioFrequency(44100)
                .on("error", (err) => {
                console.error("Error en la conversión:", err);
                cleanup();
                reject(err);
            })
                .on("end", () => {
                try {
                    // Leer el archivo MP3 convertido
                    const mp3Buffer = fs.readFileSync(tempOutputPath);
                    cleanup();
                    resolve(mp3Buffer);
                }
                catch (err) {
                    cleanup();
                    reject(err);
                }
            })
                .save(tempOutputPath);
            // Función para limpiar archivos temporales
            function cleanup() {
                try {
                    if (fs.existsSync(tempInputPath)) {
                        fs.unlinkSync(tempInputPath);
                    }
                    if (fs.existsSync(tempOutputPath)) {
                        fs.unlinkSync(tempOutputPath);
                    }
                }
                catch (err) {
                    console.error("Error limpiando archivos temporales:", err);
                }
            }
        }
        catch (err) {
            reject(err);
        }
    });
}
