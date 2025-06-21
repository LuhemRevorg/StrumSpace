# 🎸 AR Guitar API - Team Integration Guide

## 🎯 Quick Start for AI & CV Teams

Your API backend is running with advanced service orchestration. Here's everything you need to connect your services.

---

## 📡 **API Server Details**

- **Main API**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`
- **System Status**: `http://localhost:3001/api/system-status`

---

## 🤖 **For AI Team Integration**

### **Your Service Should Run On**
- **Port**: `3002`
- **URL**: `http://localhost:3002`
- **Health Endpoint**: `http://localhost:3002/health`

### **Required Endpoints in Your AI Service**

#### 1. Health Check Endpoint
```javascript
// GET /health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'AI Guitar Teacher',
    capabilities: ['natural_language', 'chord_detection', 'text_to_speech'],
    timestamp: Date.now()
  });
});
```

#### 2. Process Question Endpoint
```javascript
// POST /process-question
app.post('/process-question', async (req, res) => {
  const { question, userId, requestId } = req.body;
  
  try {
    // Your AI processing here
    const aiResponse = await processWithGPT(question);
    const detectedChords = extractChords(aiResponse);
    const audioUrl = await textToSpeech(aiResponse);
    
    res.json({
      response: aiResponse,
      detectedChords: detectedChords,
      audioUrl: audioUrl,
      confidence: 0.95,
      requestId: requestId
    });
  } catch (error) {
    res.status(500).json({ error: 'AI processing failed' });
  }
});
```

### **Expected Request Format**
```json
{
  "question": "How do I play A major?",
  "userId": "user123",
  "requestId": "req_1640995200000_abc123"
}
```

### **Expected Response Format**
```json
{
  "response": "A major is great for beginners! Place your first finger...",
  "detectedChords": ["A major", "A"],
  "audioUrl": "https://your-tts-service.com/audio/response123.mp3",
  "confidence": 0.95,
  "requestId": "req_1640995200000_abc123"
}
```

### **WebSocket Communication (Alternative)**
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  // Register your service
  socket.emit('service-register', {
    serviceName: 'AI Guitar Teacher',
    serviceUrl: 'http://localhost:3002',
    capabilities: ['natural_language', 'chord_detection', 'text_to_speech']
  });
});

// Listen for questions
socket.on('process-question', async (data) => {
  // Process question with your AI
  const result = await processQuestion(data.question);
  
  // Send response back
  socket.emit('ai-response', {
    response: result.response,
    detectedChords: result.detectedChords,
    audioUrl: result.audioUrl,
    requestId: data.requestId
  });
});
```

---

## 📷 **For CV Team Integration**

### **Your Service Should Run On**
- **Port**: `5000`
- **URL**: `http://localhost:5000`
- **Health Endpoint**: `http://localhost:5000/health`

### **Required Endpoints in Your CV Service**

#### 1. Health Check Endpoint
```python
# GET /health
@app.route('/health', methods=['GET'])
def health_check():
    return {
        'status': 'healthy',
        'service': 'CV Guitar Vision', 
        'capabilities': ['guitar_detection', 'ar_overlay', 'real_time_tracking'],
        'timestamp': time.time() * 1000
    }
```

#### 2. Guitar Detection & AR Positioning
```python
# POST /detect
@app.route('/detect', methods=['POST'])
def detect_guitar():
    data = request.json
    image_data = data.get('image')
    chord_data = data.get('chord') 
    request_id = data.get('requestId')
    
    try:
        # Your CV processing here
        guitar_detected = detect_guitar_in_image(image_data)
        transformation = calculate_transformation(image_data)
        
        if guitar_detected and chord_data:
            positions = calculate_ar_positions(chord_data['positions'], transformation)
        else:
            positions = generate_fallback_positions(chord_data)
        
        return {
            'success': True,
            'guitar_detected': guitar_detected,
            'chord_positions': positions,
            'transformation': transformation,
            'requestId': request_id
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500
```

### **Expected Request Format**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "chord": {
    "name": "A Major",
    "positions": [
      {"string": 2, "fret": 2, "finger": 1},
      {"string": 3, "fret": 2, "finger": 2},
      {"string": 4, "fret": 2, "finger": 3}
    ]
  },
  "requestId": "req_1640995200000_abc123"
}
```

### **Expected Response Format**
```json
{
  "success": true,
  "guitar_detected": true,
  "chord_positions": [
    {
      "x": 195.5,
      "y": 220.3,
      "finger": 1,
      "string": 2,
      "fret": 2,
      "confidence": 0.95
    }
  ],
  "transformation": {
    "center": [320, 240],
    "angle": 0.1,
    "scale": 1.2
  },
  "requestId": "req_1640995200000_abc123"
}
```

### **WebSocket Communication (Alternative)**
```python
import socketio

sio = socketio.Client()

@sio.event
def connect():
    # Register your service
    sio.emit('service-register', {
        'serviceName': 'CV Guitar Vision',
        'serviceUrl': 'http://localhost:5000', 
        'capabilities': ['guitar_detection', 'ar_overlay', 'real_time_tracking']
    })

@sio.on('highlight-chord')
def highlight_chord(data):
    chord_data = data['chordData']
    
    # Calculate AR positions
    positions = calculate_ar_positions(chord_data['positions'])
    
    # Send back AR positions
    sio.emit('ar-positions', {
        'chord_name': chord_data['name'],
        'chord_positions': positions,
        'guitar_detected': True
    })

# Connect to API server
sio.connect('http://localhost:3001')
```

---

## 🔄 **Complete Workflow**

### **1. User Asks Question**
```
User: "How do I play B minor?"
↓ Frontend sends to API
```

### **2. API Orchestrates**
```
API Server:
1. Receives question
2. Sends to AI service (HTTP or WebSocket)
3. Waits for AI response
4. Extracts chord from AI response  
5. Gets chord data from database
6. Sends chord + image to CV service
7. Receives AR positions from CV
8. Broadcasts complete response to frontend
```

### **3. Response Flow**
```
AI Response: "B minor can be tricky! Try placing..."
↓
API gets "B minor" chord data from database
↓ 
CV calculates AR positions for B minor
↓
Frontend displays: AI text + speech + AR overlay
```

---

## 🧪 **Testing Your Integration**

### **Test AI Service Connection**
```bash
# 1. Start your AI service on port 3002
# 2. Test health check
curl http://localhost:3002/health

# 3. Test question processing
curl -X POST http://localhost:3002/process-question \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I play A major?", "userId": "test"}'
```

### **Test CV Service Connection**
```bash
# 1. Start your CV service on port 5000  
# 2. Test health check
curl http://localhost:5000/health

# 3. Test detection
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: application/json" \
  -d '{"image": "test", "chord": {"name": "A Major", "positions": []}}'
```

### **Test Full Integration**
```bash
# Test orchestrated request with both services running
curl -X POST http://localhost:3001/api/process-request \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I play A major?",
    "userId": "test-user",
    "imageData": "data:image/jpeg;base64,test"
  }'
```

---

## 🏥 **Service Health Monitoring**

The API server automatically monitors your services:

- **Health checks every 30 seconds**
- **Automatic fallbacks if services are down**
- **Real-time alerts when services recover**
- **Performance metrics tracking**

Check system status: `http://localhost:3001/api/system-status`

---

## 🚨 **Troubleshooting**

### **AI Service Not Detected**
1. Ensure service runs on port 3002
2. Implement `/health` endpoint
3. Check API server logs for connection errors

### **CV Service Not Detected** 
1. Ensure service runs on port 5000
2. Implement `/health` endpoint  
3. Check for CORS issues

### **Integration Issues**
1. Check request/response formats match exactly
2. Verify content-type headers
3. Monitor API server logs for error details
4. Use `/api/system-status` for service health

### **WebSocket Issues**
1. Ensure socket.io client connects to correct URL
2. Check for proper event emission/listening
3. Monitor browser dev tools for WebSocket errors

---

## 🎯 **Success Checklist**

### **For AI Team:**
- [ ] Service runs on port 3002
- [ ] `/health` endpoint returns 200 status
- [ ] `/process-question` accepts and processes requests
- [ ] Detects chord names in user questions
- [ ] Returns expected JSON format
- [ ] API server shows "AI service is healthy"

### **For CV Team:**
- [ ] Service runs on port 5000  
- [ ] `/health` endpoint returns 200 status
- [ ] `/detect` accepts image and chord data
- [ ] Calculates screen coordinates for finger positions
- [ ] Returns expected JSON format
- [ ] API server shows "CV service is healthy"

### **System Integration:**
- [ ] Both services show as "healthy" in `/api/system-status`
- [ ] `/api/process-request` works end-to-end
- [ ] Real-time WebSocket communication functional
- [ ] Frontend receives coordinated responses

---

## 🚀 **Next Steps After Integration**

1. **Test with real data** - Use actual user questions and guitar images
2. **Performance optimization** - Monitor response times and optimize
3. **Error handling** - Test edge cases and error scenarios  
4. **Load testing** - Ensure system handles multiple concurrent users
5. **Demo preparation** - Prepare smooth demo workflow

---

## 📞 **Support**

If you need help integrating:
1. Check API server logs for detailed error messages
2. Use `/api/system-status` to debug service connectivity
3. Test individual endpoints before full integration
4. Monitor health checks to ensure services stay connected