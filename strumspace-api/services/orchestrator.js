// services/orchestrator.js - The Brain of Your AR Guitar System

const axios = require('axios');
const EventEmitter = require('events');

class ServiceOrchestrator extends EventEmitter {
  constructor(chordDatabase, io) {
    super();
    this.chordDatabase = chordDatabase;
    this.io = io;
    
    // Service registry
    this.services = {
      ai: {
        name: 'AI Guitar Teacher',
        url: process.env.AI_SERVICE_URL || 'http://localhost:3002',
        status: 'unknown',
        lastPing: null,
        responseTime: null,
        requestQueue: [],
        capabilities: ['natural_language', 'chord_detection', 'text_to_speech'],
        retryCount: 0,
        maxRetries: 3
      },
      cv: {
        name: 'CV Guitar Vision',
        url: process.env.CV_SERVICE_URL || 'http://localhost:5000',
        status: 'unknown',
        lastPing: null,
        responseTime: null,
        requestQueue: [],
        capabilities: ['guitar_detection', 'ar_overlay', 'real_time_tracking'],
        retryCount: 0,
        maxRetries: 3
      }
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerMinute: 0,
      lastMinuteRequests: []
    };
    
    this.startHealthMonitoring();
    this.startMetricsCollection();
    console.log('🎯 Service Orchestrator initialized');
  }

  // MAIN COORDINATION FUNCTION
  async processUserRequest(question, imageData, userId, sessionId) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    console.log(`🎯 [${requestId}] Processing request for user ${userId}: "${question}"`);
    
    this.updateMetrics('request_started');
    
    try {
      // Step 1: AI Processing with intelligent fallback
      console.log(`🤖 [${requestId}] Sending to AI service...`);
      const aiResponse = await this.callAIServiceWithFallback(question, userId, requestId);
      
      // Step 2: Get chord data from your database
      let chordData = null;
      if (aiResponse.detectedChords?.length > 0) {
        const chordName = aiResponse.detectedChords[0].toLowerCase().replace(/\s+/g, '');
        chordData = this.getChordData(chordName);
        console.log(`🎸 [${requestId}] Found chord data: ${chordData?.name || 'not found'}`);
      }
      
      // Step 3: CV Processing for AR positions
      let arPositions = null;
      if (chordData && imageData) {
        console.log(`📷 [${requestId}] Sending to CV service...`);
        arPositions = await this.callCVServiceWithFallback(imageData, chordData, requestId);
      }
      
      // Step 4: Coordinate real-time updates
      this.broadcastCoordinatedResponse({
        requestId,
        aiResponse: aiResponse.response,
        chordData,
        arPositions: arPositions?.chord_positions || [],
        audioUrl: aiResponse.audioUrl,
        sessionId,
        userId
      });
      
      const processingTime = Date.now() - startTime;
      this.updateMetrics('request_success', processingTime);
      
      console.log(`✅ [${requestId}] Request completed in ${processingTime}ms`);
      
      return {
        success: true,
        requestId,
        aiResponse: aiResponse.response,
        chordData,
        arPositions: arPositions?.chord_positions || [],
        audioUrl: aiResponse.audioUrl,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics('request_failed', processingTime);
      console.error(`❌ [${requestId}] Request failed after ${processingTime}ms:`, error.message);
      
      return this.handleRequestError(error, { requestId, question, userId, sessionId });
    }
  }

  // AI SERVICE COMMUNICATION
  async callAIServiceWithFallback(question, userId, requestId) {
    const service = this.services.ai;
    
    if (service.status === 'healthy') {
      try {
        const startTime = Date.now();
        const response = await axios.post(`${service.url}/process-question`, {
          question,
          userId,
          requestId
        }, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        service.responseTime = Date.now() - startTime;
        service.retryCount = 0;
        
        console.log(`✅ [${requestId}] AI service responded in ${service.responseTime}ms`);
        return response.data;
        
      } catch (error) {
        console.log(`⚠️ [${requestId}] AI service failed: ${error.message}`);
        service.retryCount++;
        
        if (service.retryCount <= service.maxRetries) {
          console.log(`🔄 [${requestId}] Retrying AI service (${service.retryCount}/${service.maxRetries})`);
          await this.delay(1000 * service.retryCount); // Exponential backoff
          return this.callAIServiceWithFallback(question, userId, requestId);
        }
        
        return this.getFallbackAIResponse(question, requestId);
      }
    } else {
      console.log(`⚠️ [${requestId}] AI service unavailable, using fallback`);
      return this.getFallbackAIResponse(question, requestId);
    }
  }

  // CV SERVICE COMMUNICATION
  async callCVServiceWithFallback(imageData, chordData, requestId) {
    const service = this.services.cv;
    
    if (service.status === 'healthy') {
      try {
        const startTime = Date.now();
        const response = await axios.post(`${service.url}/detect`, {
          image: imageData,
          chord: chordData,
          requestId
        }, {
          timeout: 8000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        service.responseTime = Date.now() - startTime;
        service.retryCount = 0;
        
        console.log(`✅ [${requestId}] CV service responded in ${service.responseTime}ms`);
        return response.data;
        
      } catch (error) {
        console.log(`⚠️ [${requestId}] CV service failed: ${error.message}`);
        service.retryCount++;
        
        if (service.retryCount <= service.maxRetries) {
          console.log(`🔄 [${requestId}] Retrying CV service (${service.retryCount}/${service.maxRetries})`);
          await this.delay(1000 * service.retryCount);
          return this.callCVServiceWithFallback(imageData, chordData, requestId);
        }
        
        return this.getFallbackCVResponse(chordData, requestId);
      }
    } else {
      console.log(`⚠️ [${requestId}] CV service unavailable, using fallback`);
      return this.getFallbackCVResponse(chordData, requestId);
    }
  }

  // INTELLIGENT FALLBACKS
  getFallbackAIResponse(question, requestId) {
    console.log(`🤖 [${requestId}] Using AI fallback response`);
    
    // Smart fallback based on question analysis
    const chordMatch = question.match(/([A-G][#b]?\s*(major|minor|maj|min|m|7|sus|dim)?)/i);
    
    if (chordMatch) {
      const chordName = chordMatch[0];
      return {
        response: `Here's how to play ${chordName}. Place your fingers as shown in the AR overlay. The AI service will be back online soon!`,
        detectedChords: [chordName],
        audioUrl: null,
        fallback: true,
        source: 'orchestrator_fallback'
      };
    }
    
    return {
      response: "I'm having trouble processing your question right now, but try asking about a specific chord like 'A major' and I'll show you the finger positions!",
      detectedChords: [],
      audioUrl: null,
      fallback: true,
      source: 'orchestrator_fallback'
    };
  }

  getFallbackCVResponse(chordData, requestId) {
    console.log(`📷 [${requestId}] Using CV fallback response`);
    
    // Generate basic AR positions based on chord data
    const fallbackPositions = chordData.positions.map((pos, index) => ({
      x: 200 + (pos.fret * 35), // Basic positioning
      y: 150 + (pos.string * 30),
      finger: pos.finger,
      string: pos.string,
      fret: pos.fret,
      confidence: 0.5,
      fallback: true
    }));
    
    return {
      success: true,
      guitar_detected: false,
      chord_positions: fallbackPositions,
      transformation: { center: [320, 240], angle: 0, scale: 1.0 },
      fallback: true,
      message: 'Using basic positioning - CV service will be back online soon'
    };
  }

  // 📡 REAL-TIME COORDINATION
  broadcastCoordinatedResponse(data) {
    // Send to frontend
    this.io.emit('coordinated-response', {
      requestId: data.requestId,
      aiResponse: data.aiResponse,
      audioUrl: data.audioUrl,
      timestamp: Date.now()
    });
    
    // Send chord data for AR if available
    if (data.chordData) {
      this.io.emit('chord-highlight', {
        requestId: data.requestId,
        chord: data.chordData,
        arPositions: data.arPositions,
        sessionId: data.sessionId
      });
    }
    
    console.log(`📡 Coordinated response broadcast for request ${data.requestId}`);
  }

  // 🏥 HEALTH MONITORING
  startHealthMonitoring() {
    console.log('🏥 Starting health monitoring...');
    
    // Check immediately
    this.checkAllServicesHealth();
    
    // Then check every 30 seconds
    setInterval(() => {
      this.checkAllServicesHealth();
    }, 30000);
    
    // Quick pulse every 10 seconds for active services
    setInterval(() => {
      this.quickHealthPulse();
    }, 10000);
  }

  async checkAllServicesHealth() {
    console.log('🏥 Running full health check...');
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      await this.checkServiceHealth(serviceName);
    }
    
    this.emitHealthStatus();
  }

  async quickHealthPulse() {
    for (const [serviceName, service] of Object.entries(this.services)) {
      if (service.status === 'healthy') {
        await this.pingService(serviceName);
      }
    }
  }

  async checkServiceHealth(serviceName) {
    const service = this.services[serviceName];
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${service.url}/health`, { 
        timeout: 5000 
      });
      
      if (response.status === 200) {
        const wasDown = service.status !== 'healthy';
        service.status = 'healthy';
        service.lastPing = Date.now();
        service.responseTime = Date.now() - startTime;
        service.retryCount = 0;
        
        if (wasDown) {
          console.log(`🎉 ${service.name} is back online!`);
          this.emit('service-recovered', { serviceName, service });
        }
      }
    } catch (error) {
      const wasHealthy = service.status === 'healthy';
      service.status = 'down';
      service.responseTime = null;
      
      if (wasHealthy) {
        console.log(`💀 ${service.name} went down: ${error.message}`);
        this.emit('service-down', { serviceName, service, error });
      }
    }
  }

  async pingService(serviceName) {
    const service = this.services[serviceName];
    try {
      await axios.get(`${service.url}/ping`, { timeout: 2000 });
      service.lastPing = Date.now();
    } catch (error) {
      // Silent fail for ping - full health check will catch it
    }
  }

  emitHealthStatus() {
    const status = this.getSystemStatus();
    this.io.emit('system-health', status);
    
    // Log status changes
    const healthyCount = Object.values(this.services)
      .filter(s => s.status === 'healthy').length;
    
    console.log(`🏥 System health: ${status.overall} (${healthyCount}/2 services healthy)`);
  }

  // 📊 METRICS AND MONITORING
  startMetricsCollection() {
    console.log('📊 Starting metrics collection...');
    
    // Reset per-minute counters every minute
    setInterval(() => {
      this.metrics.lastMinuteRequests = [];
    }, 60000);
    
    // Calculate requests per minute every 10 seconds
    setInterval(() => {
      this.calculateRequestsPerMinute();
    }, 10000);
  }

  updateMetrics(event, responseTime = null) {
    const now = Date.now();
    
    switch (event) {
      case 'request_started':
        this.metrics.totalRequests++;
        this.metrics.lastMinuteRequests.push(now);
        break;
        
      case 'request_success':
        this.metrics.successfulRequests++;
        this.updateAverageResponseTime(responseTime);
        break;
        
      case 'request_failed':
        this.metrics.failedRequests++;
        break;
    }
  }

  updateAverageResponseTime(newTime) {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = newTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * 0.8) + (newTime * 0.2);
    }
  }

  calculateRequestsPerMinute() {
    const oneMinuteAgo = Date.now() - 60000;
    this.metrics.requestsPerMinute = this.metrics.lastMinuteRequests
      .filter(timestamp => timestamp > oneMinuteAgo).length;
  }

  // 📋 SYSTEM STATUS AND UTILITIES
  getSystemStatus() {
    const healthyServices = Object.values(this.services)
      .filter(service => service.status === 'healthy').length;
    
    let overall;
    if (healthyServices === 2) overall = 'excellent';
    else if (healthyServices === 1) overall = 'degraded';
    else overall = 'critical';
    
    return {
      overall,
      services: this.services,
      metrics: this.metrics,
      uptime: process.uptime(),
      timestamp: Date.now(),
      chordDatabase: {
        totalChords: Object.keys(this.chordDatabase).length,
        difficulties: [...new Set(Object.values(this.chordDatabase).map(c => c.difficulty))]
      }
    };
  }

  getChordData(chordName) {
    return this.chordDatabase[chordName] || null;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  handleRequestError(error, context) {
    return {
      success: false,
      error: 'Request processing failed',
      message: 'We encountered an issue processing your request. Please try again.',
      context: {
        requestId: context.requestId,
        timestamp: Date.now()
      },
      fallback: true
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🔧 SERVICE REGISTRATION
  registerService(serviceName, serviceData) {
    if (this.services[serviceName]) {
      this.services[serviceName] = {
        ...this.services[serviceName],
        ...serviceData,
        registeredAt: Date.now()
      };
      
      console.log(`🔧 Service registered: ${serviceName}`);
      this.emit('service-registered', { serviceName, serviceData });
    }
  }
}

module.exports = ServiceOrchestrator;
