import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import Sidebar from '../components/Sidebar';
import SinglePlayer from './Singleplayer';

function Dashboard() {
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

  const sendToAI = () => {
    if (!audioBlob) return;

    // You'd send this blob to backend like so:
    // const formData = new FormData();
    // formData.append('audio', audioBlob, 'recording.mp3');
    // fetch('/api/analyze', { method: 'POST', body: formData })
    console.log('MP3 ready to be sent:', audioBlob);
    // send to gaurnag
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <SinglePlayer/>
      </div>
    </div>
  );
}

export default Dashboard;
