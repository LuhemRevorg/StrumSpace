import React from 'react'
import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import mockSongs from '../assets/mockSongs';

function MultiPlayers() {
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
        <h1>Multi Player Mode</h1>
        <div className={styles.topSectionForSplitScreen}>
            <div className={styles.videoContainer}>
                Player 1
            <video ref={videoRef} className={styles.video} autoPlay muted />
            </div>

            <div className={styles.videoContainer}>
                Player 2
            <video ref={videoRef} className={styles.video} autoPlay muted />
            </div>
        </div>
        <div className={styles.bottomSection}>
          <div className={styles.catalogScroll}>
            {mockSongs.map((song) => (
              <div key={song.id} className={styles.albumCard}>
                <img src={song.cover} alt={song.title} className={styles.albumCover} />
                <p className={styles.songTitle}>{song.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

export default MultiPlayers;