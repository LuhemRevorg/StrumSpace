import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Dashboard.module.css';

function SinglePlayer({ onAudioReady }) {
  // Core refs and state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);

  // Chord progression state
  const [sessionId, setSessionId] = useState(null);
  const [currentChord, setCurrentChord] = useState(null);
  const [chordSequence, setChordSequence] = useState([]);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [arPositions, setArPositions] = useState([]);
  const [guitarDetected, setGuitarDetected] = useState(false);
  const [chordFeedback, setChordFeedback] = useState('');
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // System state
  const [cameraReady, setCameraReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);

  // Configuration
  const API_URL = 'http://localhost:5001'; // CV Service
  const FRAME_THROTTLE = 1000; // Send frame every 1 second

  // =========================
  // 🎥 CAMERA INITIALIZATION
  // =========================
  useEffect(() => {
    let mounted = true;
    
    async function initializeCamera() {
      try {
        console.log('🎥 [CAMERA] Requesting camera access...');
        setTranscript('Requesting camera access...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }, 
          audio: true 
        });
        
        if (!mounted) return;
        
        console.log('✅ [CAMERA] Stream obtained');
        console.log('📹 [CAMERA] Video tracks:', stream.getVideoTracks().length);
        console.log('🎤 [CAMERA] Audio tracks:', stream.getAudioTracks().length);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setTranscript('Camera connecting...');
          
          // Enhanced video event listeners
          videoRef.current.onloadedmetadata = () => {
            if (!mounted) return;
            
            console.log('📹 [CAMERA] Metadata loaded');
            console.log('📐 [CAMERA] Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            console.log('🎬 [CAMERA] Ready state:', videoRef.current.readyState);
            
            setCameraReady(true);
            setTranscript('Camera ready! Initializing session...');
          };
          
          videoRef.current.onplay = () => {
            if (!mounted) return;
            console.log('▶️ [CAMERA] Video playing');
          };
          
          videoRef.current.onerror = (e) => {
            console.error('❌ [CAMERA] Video error:', e);
            setTranscript('Camera error occurred');
          };
        }
        
      } catch (err) {
        console.error('❌ [CAMERA] Error:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        
        let errorMessage = 'Camera access failed';
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and refresh.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
        }
        
        setTranscript(errorMessage);
      }
    }

    initializeCamera();
    
    return () => {
      mounted = false;
      // Cleanup camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // =========================
  // 🎸 SESSION INITIALIZATION
  // =========================
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🎸 [SESSION] Creating session:', newSessionId);
    setSessionId(newSessionId);
  }, []);

  // Create session when sessionId is set
  useEffect(() => {
    if (sessionId) {
      createChordSession(sessionId, 'beginner');
    }
  }, [sessionId]);

  // Start frame capture when both camera and session are ready
  useEffect(() => {
    if (cameraReady && sessionReady && sessionId && !animationRef.current) {
      console.log('🚀 [SYSTEM] Starting frame capture - camera and session ready');
      setTranscript('System ready! Play your guitar...');
      startFrameCapture();
    }
  }, [cameraReady, sessionReady, sessionId]);

  // =========================
  // 📡 API FUNCTIONS
  // =========================
  const createChordSession = async (sessionId, difficulty) => {
    try {
      console.log('🎸 [API] Creating chord session...');
      
      const response = await fetch(`${API_URL}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, difficulty })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [API] Session created:', data);
        
        setCurrentChord(data.current_chord);
        setChordSequence(data.chord_sequence);
        setChordFeedback(`Ready! Play ${data.current_chord} chord`);
        setSessionReady(true);
        
      } else {
        console.warn('⚠️ [API] Session creation failed');
        setChordFeedback('CV service not available - basic recording mode');
        setSessionReady(false);
      }
    } catch (error) {
      console.error('❌ [API] Session creation error:', error);
      setChordFeedback('CV service offline - recording only');
      setSessionReady(false);
    }
  };

  const processFrame = async (imageData) => {
    if (isProcessingFrame || !sessionId) return;
    
    setIsProcessingFrame(true);
    
    try {
      const response = await fetch(`${API_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          session_id: sessionId,
          requestId: `frame_${Date.now()}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 [CV] Frame processed:', {
          guitarDetected: data.guitar_detected,
          positions: data.chord_positions?.length || 0
        });
        
        setGuitarDetected(data.guitar_detected);
        setArPositions(data.chord_positions || []);
        
        // Update current chord if it changed
        if (data.current_chord && data.current_chord !== currentChord) {
          setCurrentChord(data.current_chord);
        }
      }
    } catch (error) {
      console.warn('⚠️ [CV] Frame processing failed:', error.message);
    } finally {
      setIsProcessingFrame(false);
    }
  };

  const verifyChord = async (audioBlob) => {
    if (!sessionId) return;
    
    try {
      console.log('🎵 [VERIFY] Verifying chord...');
      
      const response = await fetch(`${API_URL}/verify-chord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [VERIFY] Result:', data);
        
        setChordFeedback(data.message);
        setAttempts(data.attempts || attempts);
        
        if (data.is_correct) {
          setScore(data.score || score + 10);
          
          if (data.session_complete) {
            setIsSessionComplete(true);
            setChordFeedback('🎉 Congratulations! Session complete!');
            stopFrameCapture();
          } else if (data.next_chord) {
            setCurrentChord(data.next_chord);
            updateProgress();
          }
        }
      }
    } catch (error) {
      console.error('❌ [VERIFY] Error:', error);
      setChordFeedback('Chord verification offline');
    }
  };

  const updateProgress = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_URL}/session/${sessionId}/status`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
        setScore(data.score);
        setAttempts(data.attempts);
        
        console.log('📊 [PROGRESS] Updated:', {
          progress: data.progress,
          score: data.score
        });
      }
    } catch (error) {
      console.warn('⚠️ [PROGRESS] Update failed:', error.message);
    }
  };

  const skipChord = async () => {
    if (!sessionId) return;
    
    try {
      console.log('⏭️ [SKIP] Skipping chord...');
      
      const response = await fetch(`${API_URL}/session/${sessionId}/next`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SKIP] Result:', data);
        
        if (data.session_complete) {
          setIsSessionComplete(true);
          setChordFeedback('🎉 Session complete!');
          stopFrameCapture();
        } else if (data.next_chord) {
          setCurrentChord(data.next_chord);
          setChordFeedback(`Skipped to ${data.next_chord}`);
          updateProgress();
        }
      }
    } catch (error) {
      console.error('❌ [SKIP] Error:', error);
      setChordFeedback('Skip function offline');
    }
  };

  // =========================
  // 🎬 VIDEO PROCESSING
  // =========================
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !sessionReady) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState < 2 || video.videoWidth === 0) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw AR overlay
    drawArOverlay(ctx, canvas);
    
    // Send frame to CV service (throttled)
    const now = Date.now();
    if (now % FRAME_THROTTLE < 50) { // Roughly every FRAME_THROTTLE ms
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      processFrame(imageData);
    }
  };

  const drawArOverlay = (ctx, canvas) => {
    // Draw AR finger positions
    arPositions.forEach((pos, index) => {
      // Position circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = guitarDetected ? '#ff0000' : '#ffaa00';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Finger number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pos.finger || (index + 1), pos.x, pos.y + 4);
    });
    
    // Draw current chord name
    if (currentChord) {
      ctx.fillStyle = guitarDetected ? '#00ff00' : '#ffaa00';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${currentChord}`, 20, 45);
    }
    
    // Draw status indicators
    ctx.fillStyle = guitarDetected ? '#00ff00' : '#ff6600';
    ctx.font = '14px Arial';
    ctx.fillText(
      guitarDetected ? '🎸 Guitar Detected' : '📷 Looking for guitar...', 
      20, 
      canvas.height - 20
    );
    
    // Draw progress bar
    if (progress > 0) {
      const barWidth = 200;
      const barHeight = 8;
      const barX = canvas.width - barWidth - 20;
      const barY = 20;
      
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Progress
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(barX, barY, (barWidth * progress) / 100, barHeight);
      
      // Progress text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(progress)}%`, canvas.width - 20, barY + 20);
    }
  };

  const startFrameCapture = () => {
    if (animationRef.current) return; // Already running
    
    console.log('🎬 [CAPTURE] Starting frame capture loop');
    
    const captureLoop = () => {
      captureFrame();
      animationRef.current = requestAnimationFrame(captureLoop);
    };
    
    captureLoop();
  };

  const stopFrameCapture = () => {
    if (animationRef.current) {
      console.log('🛑 [CAPTURE] Stopping frame capture');
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // =========================
  // 🎤 RECORDING FUNCTIONS
  // =========================
  const startRecording = () => {
    if (!videoRef.current?.srcObject) {
      setChordFeedback('Camera not ready for recording');
      return;
    }
  
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);
  
    let chunks = [];
  
    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
  
        const audioBlob = new Blob([e.data], { type: 'audio/webm' });
  
        // 🔄 Send to backend immediately
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('audio', audioBlob, 'chunk.webm');
  
        try {
          const res = await fetch(`${API_URL}/verify-chord`, {
            method: 'POST',
            body: formData,
          });
  
          const data = await res.json();
          console.log('🔁 [Real-Time Verify]', data);
  
          if (data.is_correct) {
            setChordFeedback(data.message);
            setScore(data.score);
            setCurrentChord(data.next_chord || currentChord);
            updateProgress();
          } else {
            setChordFeedback(data.message);
            setAttempts(data.attempts);
          }
        } catch (err) {
          console.error('🚨 Streaming error:', err);
        }
      }
    };
  
    mediaRecorder.onstop = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingTime(0);
    };
  
    mediaRecorder.start(1000); // ⏱️ Emit audio every 1000ms
  
    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };  
  
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  // =========================
  // 🔄 SESSION MANAGEMENT
  // =========================
  const restartSession = () => {
    console.log('🔄 [SESSION] Restarting...');
    
    // Reset state
    setIsSessionComplete(false);
    setProgress(0);
    setScore(0);
    setAttempts(0);
    setChordFeedback('');
    setSessionReady(false);
    
    // Create new session
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  };

  // =========================
  // 🧹 CLEANUP
  // =========================
  useEffect(() => {
    return () => {
      stopFrameCapture();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // =========================
  // 📊 DEBUG LOGGING
  // =========================
  useEffect(() => {
    console.log('=== 🔍 SYSTEM STATUS ===');
    console.log('📹 Camera ready:', cameraReady);
    console.log('🎸 Session ready:', sessionReady);
    console.log('🆔 Session ID:', sessionId);
    console.log('🎵 Current chord:', currentChord);
    console.log('📊 Progress:', progress, '%');
    console.log('🎯 Score:', score);
    console.log('🔄 Attempts:', attempts);
    console.log('🎸 Guitar detected:', guitarDetected);
    console.log('📍 AR positions:', arPositions.length);
    console.log('========================');
  }, [cameraReady, sessionReady, sessionId, currentChord, progress, score, attempts, guitarDetected, arPositions]);

  // =========================
  // 🎨 RENDER COMPONENT
  // =========================
  return (
    <div className={styles.playerWrapper}>
      {/* Video Display Area */}
      <div className={styles.videoContainer}>
        {/* Hidden video element */}
        <video 
  ref={videoRef} 
  autoPlay 
  muted 
  playsInline
  style={{ width: '640px', height: '480px', border: '1px solid red' }}
/>
        
        {/* Canvas with AR overlay */}
        <canvas 
          ref={canvasRef}
          className={styles.video}
          style={{ 
            border: '2px solid #333',
            backgroundColor: '#000',
            width: '100%',
            height: 'auto',
            maxWidth: '640px'
          }}
        />
        
        {/* Status overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {!cameraReady ? '📷 Camera starting...' :
           !sessionReady ? '🎸 Session loading...' :
           '✅ System ready'}
        </div>
      </div>

      {/* Controls Area */}
      <div className={styles.bottomSection}>
        {/* Recording Controls */}
        <div className={styles.toolsBox}>
          <h3>🎸 Guitar Learning Controls</h3>
          
          {/* Chord progression info */}
          {currentChord && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '18px', color: '#2d3748' }}>
                  Current Chord: {currentChord}
                </strong>
              </div>
              
              {progress > 0 && (
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                  Progress: {Math.round(progress)}% | Score: {score} | Attempts: {attempts}
                </div>
              )}
              
              {chordSequence.length > 0 && (
                <div style={{ fontSize: '12px', color: '#888' }}>
                  <strong>Sequence:</strong> {chordSequence.join(' → ')}
                </div>
              )}
            </div>
          )}
          
          {/* Recording status */}
          <div style={{ marginBottom: '10px' }}>
            <strong>Recording Duration:</strong> {recordingTime}s
          </div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            {!isSessionComplete ? (
              <>
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={!cameraReady}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: cameraReady ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: cameraReady ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🎤 {currentChord ? `Record ${currentChord}` : 'Start Recording'}
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ⏹️ Stop Recording ({recordingTime}s)
                  </button>
                )}
                
                {currentChord && sessionReady && (
                  <button 
                    onClick={skipChord}
                    style={{ 
                      padding: '12px 16px',
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ⏭️ Skip
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={restartSession}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🔄 Start New Session
              </button>
            )}
          </div>
        </div>

        {/* Feedback Area */}
        <div className={styles.transcriptBox}>
          <h3>📢 Live Feedback</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.5',
              color: '#2d3748'
            }}>
              {chordFeedback || transcript || 'Position your guitar in the camera view and start playing!'}
            </p>
          </div>
          
          {/* System status */}
          {sessionId && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px',
              backgroundColor: '#f1f3f4',
              borderRadius: '4px',
              fontSize: '12px', 
              color: '#5f6368' 
            }}>
              <div><strong>System Status:</strong></div>
              <div>📷 Camera: {cameraReady ? 'Ready' : 'Starting...'}</div>
              <div>🎸 Session: {sessionReady ? 'Active' : 'Loading...'}</div>
              <div>🔍 Detection: {guitarDetected ? 'Guitar found' : 'Looking for guitar...'}</div>
              {arPositions.length > 0 && (
                <div>📍 AR Positions: {arPositions.length} markers</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SinglePlayer;
