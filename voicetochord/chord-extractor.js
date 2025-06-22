require('dotenv').config();
const fs = require('fs');
const { OpenAI } = require('openai');
const { io } = require('socket.io-client');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Connect to the Flask Socket.IO server
const socket = io('http://localhost:3002'); // Adjust if Flask runs elsewhere

socket.on('connect', () => {
  console.log(' Node.js socket connected to Flask server');
});

socket.on('analyze-audio', async (data) => {
  const audioPath = data.audioPath;

  console.log('Received audio path:', audioPath);

  try {
    const transcript = await transcribeWithWhisper(audioPath);
    console.log("Transcript:", transcript);
    const chord = await extractChordWithGPT(transcript);
    console.log(" Detected chord:", chord);

    // Send result back to Flask server
    socket.emit('chord-detected', {
      chord: chord || "Unknown",
      file: audioPath
    });

  } catch (error) {
    console.error(" Error:", error.message);
    socket.emit('chord-detected', {
      chord: 'Error: ' + error.message,
      file: audioPath
    });
  }
});

async function transcribeWithWhisper(audioPath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-1",
    response_format: "text"
  });
  return transcription;
}

async function extractChordWithGPT(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // Use "gpt-4o" if preferred
    messages: [
      {
        role: "system",
        content: "Extract ONLY the guitar chord name from this text. Return JUST the chord name in standard notation (e.g. 'Bm', 'C#7'). If unclear, return 'Unknown'."
      },
      {
        role: "user",
        content: text
      }
    ],
    max_tokens: 10,
    temperature: 0
  });

  return response.choices[0].message.content.trim();
}
