//server.js - Your main API server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active sessions for real-time communication
const activeSessions = new Map();

// 🎸 CHORD DATABASE - Your core data
const chordDatabase = {
  "amajor": {
    "id": "amajor",
    "name": "A Major",
    "displayName": "A",
    "difficulty": "beginner",
    "positions": [
      { "string": 2, "fret": 2, "finger": 1 },
      { "string": 3, "fret": 2, "finger": 2 },
      { "string": 4, "fret": 2, "finger": 3 }
    ],
    "tips": "Keep fingers curved and press firmly behind the frets",
    "audioUrl": "/audio/chords/amajor.mp3"
  },
  "eminor": {
    "id": "eminor",
    "name": "E Minor",
    "displayName": "Em",
    "difficulty": "beginner",
    "positions": [
      { "string": 5, "fret": 2, "finger": 2 },
      { "string": 4, "fret": 2, "finger": 3 }
    ],
    "tips": "One of the easiest chords - great for beginners",
    "audioUrl": "/audio/chords/eminor.mp3"
  },
  "dmajor": {
    "id": "dmajor",
    "name": "D Major",
    "displayName": "D",
    "difficulty": "beginner",
    "positions": [
      { "string": 1, "fret": 2, "finger": 1 },
      { "string": 2, "fret": 2, "finger": 3 },
      { "string": 3, "fret": 3, "finger": 2 }
    ],
    "tips": "Form a triangle with your fingers",
    "audioUrl": "/audio/chords/dmajor.mp3"
  },
  "cmajor": {
    "id": "cmajor",
    "name": "C Major",
    "displayName": "C",
    "difficulty": "intermediate",
    "positions": [
      { "string": 2, "fret": 1, "finger": 1 },
      { "string": 4, "fret": 2, "finger": 2 },
      { "string": 5, "fret": 3, "finger": 3 }
    ],
    "tips": "Stretch your fingers and avoid touching other strings",
    "audioUrl": "/audio/chords/cmajor.mp3"
  },
  "gmajor": {
    "id": "gmajor",
    "name": "G Major",
    "displayName": "G",
    "difficulty": "intermediate",
    "positions": [
      { "string": 1, "fret": 3, "finger": 2 },
      { "string": 6, "fret": 3, "finger": 1 },
      { "string": 5, "fret": 2, "finger": 3 }
    ],
    "tips": "Use fingertips and arch your hand",
    "audioUrl": "/audio/chords/gmajor.mp3"
  }
};

// API ENDPOINTS

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      api: 'running',
      websocket: `${activeSessions.size} active sessions`
    },
    uptime: process.uptime()
  });
});

// Get specific chord data
app.get('/api/chord/:name', (req, res) => {
  const chordName = req.params.name.toLowerCase().replace(/\s+/g, '');
  const chord = chordDatabase[chordName];
  
  if (!chord) {
    return res.status(404).json({ 
      error: 'Chord not found',
      available: Object.keys(chordDatabase),
      suggestion: 'Try: amajor, eminor, dmajor, cmajor, or gmajor'
    });
  }
  
  console.log(`✅ Chord requested: ${chord.name}`);
  res.json(chord);
});

// Get all available chords
app.get('/api/chords', (req, res) => {
  const difficulty = req.query.difficulty;
  let chords = Object.values(chordDatabase);
  
  if (difficulty) {
    chords = chords.filter(chord => chord.difficulty === difficulty);
  }
  
  res.json({
    total: chords.length,
    chords: chords
  });
});

// Search chords by name
app.get('/api/chords/search', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  
  if (!query) {
    return res.status(400).json({ error: 'Search query required. Use ?q=search_term' });
  }
  
  const results = Object.values(chordDatabase).filter(chord => 
    chord.name.toLowerCase().includes(query) ||
    chord.displayName.toLowerCase().includes(query)
  );
  
  res.json({
    query: query,
    found: results.length,
    results: results
  });
});

// Get chord progressions
app.get('/api/progression/:key', (req, res) => {
  const key = req.params.key.toUpperCase();
  
  const progressions = {
    'C': ['cmajor', 'aminor', 'fmajor', 'gmajor'],
    'G': ['gmajor', 'eminor', 'cmajor', 'dmajor'], 
    'D': ['dmajor', 'bminor', 'gmajor', 'amajor'],
    'A': ['amajor', 'fsharpminor', 'dmajor', 'emajor'],
    'E': ['emajor', 'csharpminor', 'amajor', 'bmajor']
  };
  
  const chordNames = progressions[key] || progressions['G'];
  const chords = chordNames
    .map(name => chordDatabase[name])
    .filter(Boolean); // Remove any undefined chords
  
  res.json({
    key: key,
    progression: chords,
    available: chords.length > 0
  });
});

// 🔄 WEBSOCKET HANDLING - Real-time communication with AI and CV services

io.on('connection', (socket) => {
  console.log('🔌 Frontend connected:', socket.id);
  
  // When frontend joins a session
  socket.on('join-session', (data) => {
    const { userId, sessionId } = data;
    activeSessions.set(socket.id, { 
      userId, 
      sessionId, 
      connectedAt: Date.now() 
    });
    
    console.log(`👤 User ${userId} joined session ${sessionId}`);
    
    socket.emit('session-joined', { 
      sessionId, 
      message: 'Connected to guitar learning session',
      availableChords: Object.keys(chordDatabase)
    });
  });
  
  // Handle user questions (forward to AI service)
  socket.on('user-question', (data) => {
    console.log('❓ User question:', data.question);
    
    // Broadcast to AI service (your AI friend will receive this)
    socket.broadcast.emit('process-question', {
      question: data.question,
      userId: data.userId,
      sessionId: data.sessionId,
      timestamp: Date.now()
    });
  });
  
  // Handle AI responses (from your AI friend)
  socket.on('ai-response', (data) => {
    console.log('🤖 AI Response received:', data.response?.substring(0, 50) + '...');
    
    // Forward to frontend
    socket.broadcast.emit('ai-message', {
      response: data.response,
      detectedChords: data.detectedChords || [],
      audioUrl: data.audioUrl,
      timestamp: Date.now()
    });
    
    // If AI detected a chord, get the chord data and send to CV
    if (data.detectedChords?.length > 0) {
      const chordName = data.detectedChords[0].toLowerCase().replace(/\s+/g, '');
      const chord = chordDatabase[chordName];
      
      if (chord) {
        console.log(`🎸 Sending chord data for: ${chord.name}`);
        socket.broadcast.emit('chord-data', chord);
      }
    }
  });
  
  // Handle AR positions (from your CV friend)
  socket.on('ar-positions', (data) => {
    console.log('📷 AR positions received for chord');
    
    // Forward to frontend for display
    socket.broadcast.emit('ar-update', {
      positions: data.chord_positions || [],
      transformation: data.transformation,
      guitarDetected: data.guitar_detected,
      timestamp: Date.now()
    });
  });
  
  // Handle image data for CV processing
  socket.on('camera-frame', (data) => {
    // Forward camera data to CV service
    socket.broadcast.emit('process-frame', {
      imageData: data.imageData,
      sessionId: data.sessionId,
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Frontend disconnected:', socket.id);
    activeSessions.delete(socket.id);
  });
});

// SYSTEM STATUS ENDPOINTS

app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    activeSessions: activeSessions.size,
    availableChords: Object.keys(chordDatabase).length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now()
  });
});

// Service registration endpoint (for your friends' services)
app.post('/api/service/register', (req, res) => {
  const { serviceName, serviceUrl, capabilities } = req.body;
  
  console.log(`🔧 Service registered: ${serviceName} at ${serviceUrl}`);
  console.log(`📋 Capabilities: ${capabilities?.join(', ') || 'none specified'}`);
  
  res.json({ 
    status: 'registered',
    message: `${serviceName} successfully registered`,
    timestamp: Date.now()
  });
});

// START SERVER

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🎸 AR Guitar API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎵 Try chord API: http://localhost:${PORT}/api/chord/amajor`);
  console.log(`📚 All chords: http://localhost:${PORT}/api/chords`);
  console.log(`🔄 WebSocket ready for real-time communication`);
});