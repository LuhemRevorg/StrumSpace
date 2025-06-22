
require('dotenv').config();
const fs = require('fs');
const { OpenAI } = require('openai');
const { io } = require('socket.io-client');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const flaskSocket = io('http://localhost:3002');

const guitarSocket = io('http://localhost:3001');

flaskSocket.on('connect', () => {
  console.log('🐍 Node.js connected to Flask server (port 3002)');
});

flaskSocket.on('disconnect', () => {
  console.log('🐍 Disconnected from Flask server');
});

flaskSocket.on('connect_error', (error) => {
  console.error('🐍 Flask connection error:', error);
});

// ===== GUITAR API CONNECTION HANDLERS =====
guitarSocket.on('connect', () => {
  console.log('🎸 Node.js connected to Guitar API backend (port 3001)');
  
 guitarSocket.emit('ai-service-register', {
    serviceName: 'AI Guitar Teacher',
    capabilities: ['voice_recognition', 'chord_detection', 'whisper_transcription'],
    version: '1.0.0',
    timestamp: Date.now()
  });
});

guitarSocket.on('disconnect', () => {
  console.log('🎸 Disconnected from Guitar API backend');
});

guitarSocket.on('connect_error', (error) => {
  console.error('🎸 Guitar API connection error:', error);
  console.log('🔄 Make sure Guitar API server is running on port 3001');
});

// Listen for responses from your Guitar API backend
guitarSocket.on('chord-processed', (data) => {
  console.log('✅ Guitar API successfully processed chord:', data.chord.name);
  console.log(`📊 Chord details: ${data.chord.difficulty} difficulty, ${data.chord.positions.length} finger positions`);
});

guitarSocket.on('chord-error', (data) => {
  console.error('❌ Guitar API error:', data.error);
  console.log('💡 Available chords:', data.availableChords?.slice(0, 5).join(', '));
});

guitarSocket.on('system-health', (data) => {
  console.log('📊 Guitar API system status:', data.overall);
});

// ===== MAIN AUDIO PROCESSING (ENHANCED) =====
flaskSocket.on('analyze-audio', async (data) => {
  const audioPath = data.audioPath;
  const sessionId = data.sessionId || `session_${Date.now()}`;
  
  console.log('📁 Received audio analysis request:', audioPath);
  console.log('👤 Session ID:', sessionId);
  
  try {
    console.log('🎙️ Transcribing audio with Whisper...');
    const transcript = await transcribeWithWhisper(audioPath);
    console.log('📝 Transcript:', transcript);
    
    console.log('🧠 Extracting chord with GPT...');
    const chord = await extractChordWithGPT(transcript);
    console.log('🎸 Detected chord:', chord);
    
    flaskSocket.emit('chord-detected', {
      chord: chord || "Unknown",
      file: audioPath,
      transcript: transcript,
      sessionId: sessionId,
      timestamp: Date.now()
    });
    
    if (chord && chord !== "Unknown" && !chord.toLowerCase().includes('error')) {
      
      console.log(`🎯 Sending chord "${chord}" to Guitar API backend...`);
      
      guitarSocket.emit('chord-detected', {
        chord: chord,
        sessionId: sessionId,
        confidence: calculateConfidence(transcript, chord),
        source: 'voice_whisper_gpt',
        metadata: {
          originalText: transcript,
          audioFile: audioPath,
          processingTime: Date.now() - (data.startTime || Date.now()),
          whisperModel: 'whisper-1',
          gptModel: 'gpt-3.5-turbo'
        },
        timestamp: Date.now()
      });
      
      console.log(`✅ Successfully sent chord "${chord}" to Guitar API`);
      
    } else {
      console.log('⚠️ No valid chord detected, skipping Guitar API send');
      
      guitarSocket.emit('chord-detection-failed', {
        reason: 'No chord detected',
        originalText: transcript,
        sessionId: sessionId,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Audio processing error:', error.message);
    
    flaskSocket.emit('chord-detected', {
      chord: 'Error: ' + error.message,
      file: audioPath,
      sessionId: sessionId,
      timestamp: Date.now()
    });
    
    guitarSocket.emit('chord-detection-error', {
      error: error.message,
      audioFile: audioPath,
      sessionId: sessionId,
      timestamp: Date.now()
    });
  }
});

async function transcribeWithWhisper(audioPath) {
  const startTime = Date.now();
  
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "text",
      language: "en" // Optional: specify language for better accuracy
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Whisper transcription completed in ${processingTime}ms`);
    
    return transcription;
    
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error.message);
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

async function extractChordWithGPT(text) {
  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Extract ONLY the guitar chord name from the user's text. 

RULES:
- Return JUST the chord name in standard notation (e.g., 'Am', 'Bm', 'C', 'D7', 'F#m')
- If multiple chords mentioned, return the FIRST one
- If no chord is mentioned, return 'Unknown'
- Common variations to recognize:
  * "A minor" → "Am"
  * "B minor" → "Bm" 
  * "C major" → "C"
  * "D seven" → "D7"
  * "F sharp minor" → "F#m"
  * "E flat" → "Eb"

EXAMPLES:
- "How do I play B minor?" → "Bm"
- "Show me A major chord" → "A"
- "Can you help with D seven?" → "D7"
- "What's the weather like?" → "Unknown"`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 15,
      temperature: 0, // Deterministic output
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });
    
    const processingTime = Date.now() - startTime;
    const extractedChord = response.choices[0].message.content.trim();
    
    console.log(`⏱️ GPT chord extraction completed in ${processingTime}ms`);
    console.log(`🎯 GPT extracted: "${extractedChord}" from: "${text}"`);
    
    return extractedChord;
    
  } catch (error) {
    console.error('❌ GPT chord extraction failed:', error.message);
    throw new Error(`GPT extraction failed: ${error.message}`);
  }
}

function calculateConfidence(transcript, chord) {
  // Simple confidence calculation based on text clarity
  const transcriptLength = transcript.length;
  const chordMentioned = transcript.toLowerCase().includes(chord.toLowerCase());
  const hasQuestionWords = /how|what|show|play|teach|help/i.test(transcript);
  
  let confidence = 0.5; // Base confidence
  
  if (chordMentioned) confidence += 0.3;
  if (hasQuestionWords) confidence += 0.2;
  if (transcriptLength > 10) confidence += 0.1;
  if (transcriptLength < 5) confidence -= 0.2;
  
  return Math.min(0.99, Math.max(0.1, confidence));
}

// ===== TEST FUNCTIONS (FOR DEBUGGING) =====
function testGuitarAPIConnection() {
  console.log('🧪 Testing Guitar API connection...');
  
  guitarSocket.emit('chord-detected', {
    chord: "Am",
    sessionId: "test_session",
    confidence: 0.95,
    source: 'manual_test',
    timestamp: Date.now()
  });
  
  console.log('✅ Test chord "Am" sent to Guitar API');
}

function testChordDetection(testText) {
  console.log(`🧪 Testing chord detection with: "${testText}"`);
  
  extractChordWithGPT(testText)
    .then(chord => {
      console.log(`🎸 Test result: "${chord}"`);
      
      if (chord !== "Unknown") {
        guitarSocket.emit('chord-detected', {
          chord: chord,
          sessionId: "test_session",
          confidence: 0.8,
          source: 'manual_test',
          metadata: { originalText: testText },
          timestamp: Date.now()
        });
      }
    })
    .catch(error => {
      console.error('❌ Test failed:', error.message);
    });
}

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AI service...');
  
  flaskSocket.disconnect();
  guitarSocket.disconnect();
  
  console.log('✅ Disconnected from all servers');
  process.exit(0);
});

console.log('🚀 AI Guitar Teacher Service Starting...');
console.log('🐍 Connecting to Flask server on port 3002...');
console.log('🎸 Connecting to Guitar API backend on port 3001...');
console.log('🎙️ Whisper + GPT chord detection ready!');
console.log('📡 Waiting for audio analysis requests...');

setTimeout(() => {
  if (guitarSocket.connected) {
    console.log('✅ All connections established successfully!');
    // Uncomment to run tests:
    // testGuitarAPIConnection();
    // testChordDetection("How do I play B minor?");
  } else {
    console.log('⚠️ Guitar API connection not established. Check if server is running on port 3001.');
  }
}, 2000);