import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Dashboard.module.css';

function SinglePlayer({ onAudioReady }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    }

    startCamera();
  }, []);

  const startRecording = () => {
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/mp3' });
      setAudioBlob(blob);
      if (onAudioReady) onAudioReady(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  return (
    <div className={styles.playerWrapper}>
      <div className={styles.videoContainer}>
        <video ref={videoRef} className={styles.video} autoPlay muted />
      </div>

      <div className={styles.bottomSection}>
        <div className={styles.toolsBox}>
          <h3>Recording Controls</h3>
          <p>Duration: {recordingTime}s</p>
          {!isRecording ? (
            <button onClick={startRecording}>Start Recording</button>
          ) : (
            <button onClick={stopRecording}>Stop Recording</button>
          )}
        </div>

        <div className={styles.transcriptBox}>
          <h3>Live Transcript</h3>
          <p>{transcript || 'Transcribed text will appear here...'}</p>
        </div>
      </div>
    </div>
  );
}

export default SinglePlayer;
