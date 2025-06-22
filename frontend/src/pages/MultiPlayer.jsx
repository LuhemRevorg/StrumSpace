import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import mockSongs from '../assets/mockSongs';

function MultiPlayers() {
  // existing refs and states
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const timerRef = useRef(null);

  // new state variables
  const [hoveredSongId, setHoveredSongId] = useState(null);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  // get selected song data easily
  const selectedSong = mockSongs.find((s) => s.id === selectedSongId);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setVideoError(true);
      }
    }

    startCamera();
  }, []);

  // mock progression example in song data:
  // Each song object should have a 'progression' array:
  // progression: [{chord: 'C', time: 0}, {chord: 'G', time: 5000}, ...]
  // For demo, we will fake progression timing

  useEffect(() => {
    let interval;
    if (sessionStarted && selectedSong?.progression) {
      interval = setInterval(() => {
        setCurrentChordIndex((prev) => {
          if (prev < selectedSong.progression.length - 1) return prev + 1;
          else return 0; // loop or stop? You decide
        });
      }, 3000); // advance chord every 3 seconds (adjust as needed)
    }
    return () => clearInterval(interval);
  }, [sessionStarted, selectedSong]);

  const startRecording = () => {
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/mp3' });
      setAudioBlob(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const onSongClick = (id) => {
    if (sessionStarted) return; // prevent changing songs mid session
    setSelectedSongId(id);
    setShowPopup(true);
  };

  const onCancel = () => {
    setShowPopup(false);
    setSelectedSongId(null);
  };

  const onStart = () => {
    setShowPopup(false);
    setSessionStarted(true);
    setCurrentChordIndex(0);
    if (audioRef.current && selectedSong?.audio) {
      audioRef.current.src = selectedSong.audio;
      audioRef.current.play().catch((e) => console.log('Audio play error:', e));
    }
  };

  const onEndSession = () => {
    setSessionStarted(false);
    setSelectedSongId(null);
    setCurrentChordIndex(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // clear source
    }
  };

  return (
    <div className={styles.playerWrapper}>
      <h1>Multi Player Mode</h1>

      <div className={styles.topSectionForSplitScreen}>
        <div className={styles.videoContainer}>
          <p>Player 1 (You)</p>
          {videoError ? (
            <div className={styles.offline}>
              <p>📵 Offline</p>
              <small>Camera access not granted</small>
            </div>
          ) : (
            <video ref={videoRef} className={styles.video} autoPlay muted playsInline />
          )}
        </div>

        <div className={styles.videoContainer}>
          <p>Player 2</p>
          <div className={styles.offline}>
            <p>Waiting for player 2</p>
          </div>
        </div>
      </div>

      <div className={styles.bottomSection} style={{ flexDirection: 'column' }}>
        <div
          className={styles.catalogScroll}
          style={{
            maxHeight: sessionStarted ? '120px' : '300px',
            overflowY: sessionStarted ? 'hidden' : 'auto',
            pointerEvents: sessionStarted ? 'none' : 'auto', // freeze scroll & clicks on catalog during session
            transition: 'max-height 0.3s ease',
          }}
        >
          {mockSongs.map((song) => {
            const isSelected = selectedSongId === song.id;
            return (
              <div
                key={song.id}
                className={`${styles.albumCard} ${
                  hoveredSongId === song.id ? styles.hovered : ''
                } ${isSelected ? styles.selected : ''}`}
                onMouseEnter={() => setHoveredSongId(song.id)}
                onMouseLeave={() => setHoveredSongId(null)}
                onClick={() => onSongClick(song.id)}
              >
                <img src={song.cover} alt={song.title} className={styles.albumCover} />
                <p className={styles.songTitle}>{song.title}</p>
              </div>
            );
          })}
        </div>

        {/* Popup for progression */}
        {showPopup && selectedSong && (
          <div className={styles.popupOverlay}>
            <div className={styles.popup}>
              <h2>{selectedSong.title} - Progression</h2>
              <ul>
                {selectedSong.progression?.map((step, i) => (
                  <li key={i}>
                    {step.chord} {i === currentChordIndex ? '← Current' : ''}
                  </li>
                )) || <li>No progression data available.</li>}
              </ul>
              <div className={styles.popupButtons}>
                <button onClick={onStart}>Start</button>
                <button onClick={onCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Session Control */}
        {sessionStarted && (
  <div>
    <div className={styles.sessionControls}>
      <p>
        Now Playing: <strong>{selectedSong.title}</strong> - Chord:{' '}
        <span>{selectedSong.progression?.[currentChordIndex]?.chord || '-'}</span>
      </p>
      <button onClick={onEndSession}>End Session</button>
    </div>

    <div className={styles.progression}>
      <h3>Current Progression</h3>
      <ul>
        {selectedSong.progression?.map((step, i) => (
          <li
            key={i}
            className={i === currentChordIndex ? styles.current : ''}
          >
            {step.chord} {i === currentChordIndex ? '← Current' : ''}
          </li>
        )) || <li>No progression data available.</li>}
      </ul>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

export default MultiPlayers;
