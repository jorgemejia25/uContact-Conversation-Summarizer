const axios = require("axios");
const path = require("path");

// Path to your audio file - replace with an actual path to an MP3 file
const audioFilePath = path.resolve(__dirname, "sample.mp3");

async function testAudioSummary() {
  try {
    console.log("Testing audio summarization with file:", audioFilePath);

    const response = await axios.post(
      "http://localhost:8000/api/summarize/audio",
      {
        audioFilePath: audioFilePath,
      }
    );

    console.log("Summary result:", response.data);
  } catch (error) {
    console.error(
      "Error testing audio summary:",
      error.response?.data || error.message
    );
  }
}

testAudioSummary();
