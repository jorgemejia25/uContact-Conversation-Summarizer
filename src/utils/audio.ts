import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

// Configurar ffmpeg con el instalador
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Convierte un archivo de audio a formato MP3
 * @param inputBuffer Buffer del archivo de audio a convertir
 * @returns Promise<Buffer> Buffer del archivo MP3 convertido
 */
export async function convertToMp3(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Crear un archivo temporal para el input
    const tempInputPath = path.join(
      process.cwd(),
      "files",
      `temp_input_${Date.now()}.gsm`
    );
    const tempOutputPath = path.join(
      process.cwd(),
      "files",
      `temp_output_${Date.now()}.mp3`
    );

    try {
      // Escribir el buffer de entrada a un archivo temporal
      fs.writeFileSync(tempInputPath, inputBuffer);

      // Configurar la conversión
      ffmpeg(tempInputPath)
        .toFormat("mp3")
        .audioBitrate("128k")
        .audioChannels(1)
        .audioFrequency(44100)
        .on("error", (err: Error) => {
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
          } catch (err) {
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
        } catch (err) {
          console.error("Error limpiando archivos temporales:", err);
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}
