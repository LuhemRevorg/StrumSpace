// server.js - Updated with Service Orchestration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Import your new orchestrator
const ServiceOrchestrator = require('./services/orchestrator');

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
app.use(express.json({ limit: '10mb' })); // Increased for image data

// Store active sessions
const activeSessions = new Map();

// CHORD DATABASE
const chordDatabase = {
    // MAJOR CHORDS (Beginner)
    "a": {
      "id": "a",
      "name": "A Major",
      "displayName": "A",
      "difficulty": "beginner",
      "positions": [
        { "string": 2, "fret": 2, "finger": 1 },
        { "string": 3, "fret": 2, "finger": 2 },
        { "string": 4, "fret": 2, "finger": 3 }
      ],
      "tips": "Keep fingers curved and press firmly behind the frets",
      "audioUrl": "/audio/chords/a.mp3"
    },
    "amajor": { "redirect": "a" },
    
    "c": {
      "id": "c",
      "name": "C Major",
      "displayName": "C",
      "difficulty": "beginner",
      "positions": [
        { "string": 2, "fret": 1, "finger": 1 },
        { "string": 4, "fret": 2, "finger": 2 },
        { "string": 5, "fret": 3, "finger": 3 }
      ],
      "tips": "Stretch your fingers and avoid touching other strings",
      "audioUrl": "/audio/chords/c.mp3"
    },
    "cmajor": { "redirect": "c" },
    
    "d": {
      "id": "d",
      "name": "D Major",
      "displayName": "D",
      "difficulty": "beginner",
      "positions": [
        { "string": 1, "fret": 2, "finger": 1 },
        { "string": 2, "fret": 2, "finger": 3 },
        { "string": 3, "fret": 3, "finger": 2 }
      ],
      "tips": "Form a triangle with your fingers",
      "audioUrl": "/audio/chords/d.mp3"
    },
    "dmajor": { "redirect": "d" },
    
    "e": {
      "id": "e",
      "name": "E Major", 
      "displayName": "E",
      "difficulty": "beginner",
      "positions": [
        { "string": 3, "fret": 1, "finger": 1 },
        { "string": 5, "fret": 2, "finger": 2 },
        { "string": 4, "fret": 2, "finger": 3 }
      ],
      "tips": "Similar to Em but add one finger on the G string",
      "audioUrl": "/audio/chords/e.mp3"
    },
    "emajor": { "redirect": "e" },
    
    "g": {
      "id": "g",
      "name": "G Major",
      "displayName": "G",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 3, "finger": 2 },
        { "string": 6, "fret": 3, "finger": 1 },
        { "string": 5, "fret": 2, "finger": 3 }
      ],
      "tips": "Use fingertips and arch your hand",
      "audioUrl": "/audio/chords/g.mp3"
    },
    "gmajor": { "redirect": "g" },
  
    // MINOR CHORDS (Beginner)
    "am": {
      "id": "am",
      "name": "A Minor",
      "displayName": "Am",
      "difficulty": "beginner",
      "positions": [
        { "string": 2, "fret": 1, "finger": 1 },
        { "string": 3, "fret": 2, "finger": 2 },
        { "string": 4, "fret": 2, "finger": 3 }
      ],
      "tips": "Very similar to A major, just move one finger",
      "audioUrl": "/audio/chords/am.mp3"
    },
    "aminor": { "redirect": "am" },
    
    "em": {
      "id": "em",
      "name": "E Minor",
      "displayName": "Em",
      "difficulty": "beginner",
      "positions": [
        { "string": 5, "fret": 2, "finger": 2 },
        { "string": 4, "fret": 2, "finger": 3 }
      ],
      "tips": "One of the easiest chords - great for beginners",
      "audioUrl": "/audio/chords/em.mp3"
    },
    "eminor": { "redirect": "em" },
    
    "dm": {
      "id": "dm",
      "name": "D Minor",
      "displayName": "Dm", 
      "difficulty": "beginner",
      "positions": [
        { "string": 1, "fret": 1, "finger": 1 },
        { "string": 2, "fret": 3, "finger": 3 },
        { "string": 3, "fret": 2, "finger": 2 }
      ],
      "tips": "Keep fingers close to frets and arch your hand",
      "audioUrl": "/audio/chords/dm.mp3"
    },
    "dminor": { "redirect": "dm" },
  
    // INTERMEDIATE CHORDS
    "f": {
      "id": "f",
      "name": "F Major",
      "displayName": "F",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 1, "finger": 1 },
        { "string": 2, "fret": 1, "finger": 1 },
        { "string": 3, "fret": 2, "finger": 2 },
        { "string": 4, "fret": 3, "finger": 4 },
        { "string": 5, "fret": 3, "finger": 3 },
        { "string": 6, "fret": 1, "finger": 1 }
      ],
      "tips": "First barre chord! Press firmly across 1st fret with index finger",
      "audioUrl": "/audio/chords/f.mp3",
      "isBarreChord": true
    },
    "fmajor": { "redirect": "f" },
    
    "bm": {
      "id": "bm",
      "name": "B Minor",
      "displayName": "Bm",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 2, "finger": 1 },
        { "string": 2, "fret": 3, "finger": 2 },
        { "string": 3, "fret": 4, "finger": 4 },
        { "string": 4, "fret": 4, "finger": 3 },
        { "string": 5, "fret": 2, "finger": 1 },
        { "string": 6, "fret": 2, "finger": 1 }
      ],
      "tips": "Barre chord - press index finger across all strings at 2nd fret",
      "audioUrl": "/audio/chords/bm.mp3",
      "isBarreChord": true
    },
    "bminor": { "redirect": "bm" },
  
    // SEVENTH CHORDS
    "a7": {
      "id": "a7",
      "name": "A Dominant 7",
      "displayName": "A7",
      "difficulty": "intermediate",
      "positions": [
        { "string": 2, "fret": 2, "finger": 2 },
        { "string": 4, "fret": 2, "finger": 3 }
      ],
      "tips": "Easy version of A7 - just two fingers!",
      "audioUrl": "/audio/chords/a7.mp3"
    },
    
    "d7": {
      "id": "d7",
      "name": "D Dominant 7",
      "displayName": "D7",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 2, "finger": 2 },
        { "string": 2, "fret": 1, "finger": 1 },
        { "string": 3, "fret": 2, "finger": 3 }
      ],
      "tips": "Great for blues and country music",
      "audioUrl": "/audio/chords/d7.mp3"
    },
    
    "e7": {
      "id": "e7",
      "name": "E Dominant 7",
      "displayName": "E7",
      "difficulty": "intermediate",
      "positions": [
        { "string": 3, "fret": 1, "finger": 1 },
        { "string": 5, "fret": 2, "finger": 2 }
      ],
      "tips": "Like E major but remove one finger",
      "audioUrl": "/audio/chords/e7.mp3"
    },
    
    "g7": {
      "id": "g7",
      "name": "G Dominant 7",
      "displayName": "G7",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 1, "finger": 1 },
        { "string": 6, "fret": 3, "finger": 3 },
        { "string": 5, "fret": 2, "finger": 2 }
      ],
      "tips": "Common in folk and country music",
      "audioUrl": "/audio/chords/g7.mp3"
    },
  
    // POWER CHORDS (Advanced)
    "a5": {
      "id": "a5",
      "name": "A Power Chord",
      "displayName": "A5",
      "difficulty": "intermediate",
      "positions": [
        { "string": 6, "fret": 5, "finger": 1 },
        { "string": 5, "fret": 7, "finger": 3 }
      ],
      "tips": "Great for rock music - only 2 fingers needed",
      "audioUrl": "/audio/chords/a5.mp3"
    },
    
    "e5": {
      "id": "e5",
      "name": "E Power Chord",
      "displayName": "E5",
      "difficulty": "intermediate",
      "positions": [
        { "string": 6, "fret": 0, "finger": 0 },
        { "string": 5, "fret": 2, "finger": 2 }
      ],
      "tips": "Classic rock chord - open low E string",
      "audioUrl": "/audio/chords/e5.mp3"
    },
  
    // SUSPENDED CHORDS
    "dsus2": {
      "id": "dsus2",
      "name": "D Suspended 2",
      "displayName": "Dsus2",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 0, "finger": 0 },
        { "string": 2, "fret": 3, "finger": 3 },
        { "string": 3, "fret": 2, "finger": 2 }
      ],
      "tips": "Creates tension that wants to resolve to D major",
      "audioUrl": "/audio/chords/dsus2.mp3"
    },
    
    "dsus4": {
      "id": "dsus4",
      "name": "D Suspended 4",
      "displayName": "Dsus4",
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 3, "finger": 3 },
        { "string": 2, "fret": 3, "finger": 4 },
        { "string": 3, "fret": 2, "finger": 2 }
      ],
      "tips": "Common in folk music - like D but with pinky added",
      "audioUrl": "/audio/chords/dsus4.mp3"
    },
  
    // CAPO VARIATIONS & ALTERNATIVES
    "cadd9": {
      "id": "cadd9",
      "name": "C Add 9",
      "displayName": "Cadd9", 
      "difficulty": "intermediate",
      "positions": [
        { "string": 1, "fret": 3, "finger": 4 },
        { "string": 2, "fret": 3, "finger": 3 },
        { "string": 4, "fret": 2, "finger": 2 },
        { "string": 5, "fret": 3, "finger": 1 }
      ],
      "tips": "Beautiful open chord - adds color to C major",
      "audioUrl": "/audio/chords/cadd9.mp3"
    },
    
    "g/b": {
      "id": "g/b",
      "name": "G over B",
      "displayName": "G/B",
      "difficulty": "advanced",
      "positions": [
        { "string": 1, "fret": 3, "finger": 4 },
        { "string": 2, "fret": 0, "finger": 0 },
        { "string": 3, "fret": 0, "finger": 0 },
        { "string": 4, "fret": 0, "finger": 0 },
        { "string": 5, "fret": 2, "finger": 2 },
        { "string": 6, "fret": 2, "finger": 1 }
      ],
      "tips": "Bass note is B - creates smooth bass line movement",
      "audioUrl": "/audio/chords/gb.mp3"
    }
  };

// 🎯 INITIALIZE SERVICE ORCHESTRATOR
const orchestrator = new ServiceOrchestrator(chordDatabase, io);

// Listen for orchestrator events
orchestrator.on('service-down', (data) => {
  console.log(`🚨 Service Alert: ${data.serviceName} is down`);
  io.emit('service-alert', {
    type: 'service_down',
    service: data.serviceName,
    message: `${data.service.name} is temporarily unavailable`
  });
});

orchestrator.on('service-recovered', (data) => {
  console.log(`🎉 Service Recovery: ${data.serviceName} is back online`);
  io.emit('service-alert', {
    type: 'service_recovered',
    service: data.serviceName,
    message: `${data.service.name} is back online`
  });
});

// 📡 API ENDPOINTS (Enhanced with orchestration)

// Health check endpoint
app.get('/api/health', (req, res) => {
  const systemStatus = orchestrator.getSystemStatus();
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    system: systemStatus,
    activeSessions: activeSessions.size,
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

// Search chords
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
    .filter(Boolean);
  
  res.json({
    key: key,
    progression: chords,
    available: chords.length > 0
  });
});

// 🎯 NEW: ORCHESTRATED REQUEST ENDPOINT
app.post('/api/process-request', async (req, res) => {
  const { question, imageData, userId, sessionId } = req.body;
  
  if (!question || !userId) {
    return res.status(400).json({
      error: 'Missing required fields: question and userId'
    });
  }
  
  try {
    const result = await orchestrator.processUserRequest(
      question, 
      imageData, 
      userId, 
      sessionId || `session_${Date.now()}`
    );
    
    res.json(result);
  } catch (error) {
    console.error('Request processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request'
    });
  }
});

// System status endpoint
app.get('/api/system-status', (req, res) => {
  res.json(orchestrator.getSystemStatus());
});

// Service registration endpoint
app.post('/api/service/register', (req, res) => {
  const { serviceName, serviceUrl, capabilities } = req.body;
  
  if (!serviceName || !serviceUrl) {
    return res.status(400).json({
      error: 'serviceName and serviceUrl are required'
    });
  }
  
  orchestrator.registerService(serviceName, {
    url: serviceUrl,
    capabilities: capabilities || [],
    registeredAt: Date.now()
  });
  
  console.log(`🔧 Service registered: ${serviceName} at ${serviceUrl}`);
  
  res.json({ 
    status: 'registered',
    message: `${serviceName} successfully registered`,
    timestamp: Date.now()
  });
});

// 🔄 WEBSOCKET HANDLING (Enhanced with orchestration)

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current system status on connect
  socket.emit('system-health', orchestrator.getSystemStatus());
  
  // Session management
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
      message: 'Connected to AR Guitar Learning System',
      systemStatus: orchestrator.getSystemStatus(),
      availableChords: Object.keys(chordDatabase)
    });
  });
  
  // Handle user questions through orchestrator
  socket.on('user-question', async (data) => {
    console.log('❓ User question via WebSocket:', data.question);
    
    try {
      const result = await orchestrator.processUserRequest(
        data.question,
        data.imageData,
        data.userId,
        data.sessionId
      );
      
      // Response is already broadcast by orchestrator
      socket.emit('request-processed', {
        requestId: result.requestId,
        success: result.success
      });
      
    } catch (error) {
      console.error('WebSocket request error:', error);
      socket.emit('request-error', {
        error: 'Failed to process question',
        originalQuestion: data.question
      });
    }
  });
  
  // Handle camera frames for CV processing
  socket.on('camera-frame', (data) => {
    // Forward camera data to CV service via orchestrator
    socket.broadcast.emit('process-frame', {
      imageData: data.imageData,
      sessionId: data.sessionId,
      timestamp: Date.now()
    });
  });
  
  // Handle service communication
  socket.on('ai-response', (data) => {
    console.log('🤖 Direct AI Response received (legacy mode)');
    
    // Forward to frontend
    socket.broadcast.emit('ai-message', {
      response: data.response,
      detectedChords: data.detectedChords || [],
      audioUrl: data.audioUrl,
      timestamp: Date.now()
    });
    
    // Handle chord highlighting
    if (data.detectedChords?.length > 0) {
      const chordName = data.detectedChords[0].toLowerCase().replace(/\s+/g, '');
      const chord = chordDatabase[chordName];
      
      if (chord) {
        socket.broadcast.emit('chord-highlight', {
          chord: chord,
          highlightDuration: 5000,
          source: 'direct_ai'
        });
      }
    }
  });
  
  socket.on('ar-positions', (data) => {
    console.log('📷 Direct AR positions received (legacy mode)');
    
    socket.broadcast.emit('ar-update', {
      positions: data.chord_positions || [],
      transformation: data.transformation,
      guitarDetected: data.guitar_detected,
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    activeSessions.delete(socket.id);
  });
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🎸 AR Guitar API Server with Orchestration running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎵 Try chord API: http://localhost:${PORT}/api/chord/amajor`);
  console.log(`📚 All chords: http://localhost:${PORT}/api/chords`);
  console.log(`🎯 Orchestrated requests: http://localhost:${PORT}/api/process-request`);
  console.log(`📈 System status: http://localhost:${PORT}/api/system-status`);
  console.log(`🔄 WebSocket ready for real-time communication`);
  console.log(`🤖 AI Service expected at: ${process.env.AI_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`📷 CV Service expected at: ${process.env.CV_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`🎯 Service Orchestrator initialized and monitoring services`);
});

