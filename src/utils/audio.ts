import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Convert GSM audio data to MP3 format using ffmpeg
 * @param fileContent The GSM file content as a Buffer or string
 * @returns A Buffer containing the MP3 data
 */
export async function convertToMp3(
  fileContent: Buffer | string
): Promise<Buffer> {
  try {
    // Create temporary files for input and output
    const tempDir = os.tmpdir();
    const tempInputFile = path.join(tempDir, `input-${Date.now()}.gsm`);
    const tempOutputFile = path.join(tempDir, `output-${Date.now()}.mp3`);

    // Write the GSM content to a temporary file
    if (typeof fileContent === "string") {
      fs.writeFileSync(tempInputFile, fileContent, "utf8");
    } else {
      fs.writeFileSync(tempInputFile, fileContent);
    }

    // Run ffmpeg command to convert GSM to MP3
    const ffmpegCommand = `ffmpeg -i "${tempInputFile}" -ar 44100 -ac 2 -ab 192k -f mp3 "${tempOutputFile}"`;
    await execPromise(ffmpegCommand);

    // Read the output MP3 file
    const mp3Buffer = fs.readFileSync(tempOutputFile);

    console.log("Creando archivo mp3");

    // Clean up temporary files
    fs.unlinkSync(tempInputFile);
    fs.unlinkSync(tempOutputFile);

    return mp3Buffer;
  } catch (error) {
    console.error("Error converting GSM to MP3:", error);
    throw new Error(`Failed to convert audio.`);
  }
}
