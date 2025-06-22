import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import mockSongs from '../assets/mockSongs';

function MultiPlayers() {
  /* ─────────── Refs & State ─────────── */
  const videoRef      = useRef(null);
  const audioRef      = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef         = useRef(null);

  const [isRecording,       setIsRecording]       = useState(false);
  const [recordingTime,     setRecordingTime]     = useState(0);
  const [audioBlob,         setAudioBlob]         = useState(null);
  const [videoError,        setVideoError]        = useState(false);

  const [hoveredSongId,     setHoveredSongId]     = useState(null);
  const [selectedSongId,    setSelectedSongId]    = useState(null);
  const [showPopup,         setShowPopup]         = useState(false);
  const [sessionStarted,    setSessionStarted]    = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  const selectedSong = mockSongs.find((s) => s.id === selectedSongId);

  /* ─────────── Camera startup ─────────── */
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setVideoError(true);
      }
    }
    startCamera();
  }, []);

  /* ─────────── Chord-sync with audioRef ─────────── */
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !sessionStarted || !selectedSong?.progression) return;

    const handleTimeUpdate = () => {
      const t = audioEl.currentTime;
      const prog = selectedSong.progression;

      // Find last index whose start <= current time
      let idx = prog.findIndex(
        (step, i) => t >= step.start && (i === prog.length - 1 || t < prog[i + 1].start)
      );
      if (idx === -1) idx = 0; // fallback
      if (idx !== currentChordIndex) setCurrentChordIndex(idx);
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => audioEl.removeEventListener('timeupdate', handleTimeUpdate);
  }, [sessionStarted, selectedSong, currentChordIndex]);

  /* ─────────── Recording helpers ─────────── */
  const startRecording = () => {
    const stream = videoRef.current?.srcObject;
    if (!stream) return;
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () =>
      setAudioBlob(new Blob(chunks, { type: 'audio/mp3' }));

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    timerRef.current = setInterval(
      () => setRecordingTime((p) => p + 1),
      1000
    );
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  /* ─────────── Song selection & session control ─────────── */
  const onSongClick = (id) => {
    if (sessionStarted) return;
    setSelectedSongId(id);
    setShowPopup(true);
  };

  const onCancel = () => {
    setShowPopup(false);
    setSelectedSongId(null);
  };

  const onStart = () => {
    if (!selectedSong) return;
    setShowPopup(false);
    setSessionStarted(true);
    setCurrentChordIndex(0);

    if (audioRef.current) {
      audioRef.current.src = selectedSong.audio;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) => console.warn('Audio play error:', e));
    }
  };

  const onEndSession = () => {
    setSessionStarted(false);
    setCurrentChordIndex(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
  };

  /* ─────────── JSX ─────────── */
  return (
    <div className={styles.playerWrapper}>
      <h1>Multi Player Mode</h1>

      {/* Hidden audio element for track playback */}
      <audio ref={audioRef} hidden />

      {/* ───── Top (video split-screen) ───── */}
      <div className={styles.topSectionForSplitScreen}>
        <div className={styles.videoContainer}>
          <p>Player 1 (You)</p>
          {videoError ? (
            <div className={styles.offline}>
              <p>📵 Offline</p>
              <small>Camera access not granted</small>
            </div>
          ) : (
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              muted
              playsInline
            />
          )}
        </div>

        <div className={styles.videoContainer}>
          <p>Player 2</p>
          <div className={styles.offline}>
            <p>Waiting for player 2</p>
          </div>
        </div>
      </div>

      {/* ───── Bottom (catalog + controls) ───── */}
      <div className={styles.bottomSection} style={{ flexDirection: 'column' }}>
        {/* Album / song catalog */}
        <div
          className={styles.catalogScroll}
          style={{
            maxHeight: sessionStarted ? '120px' : '300px',
            overflowY: sessionStarted ? 'hidden' : 'auto',
            pointerEvents: sessionStarted ? 'none' : 'auto',
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

        {/* Progression popup before starting */}
        {showPopup && selectedSong && (
          <div className={styles.popupOverlay}>
            <div className={styles.popup}>
              <h2>{selectedSong.title} – Progression</h2>
              <ul className={styles.progressionList}>
                {selectedSong.progression?.map((step, i) => (
                  <li key={i}>{step.chord}</li>
                )) || <li>No progression data available.</li>}
              </ul>
              <div className={styles.popupButtons}>
                <button onClick={onStart}>Start</button>
                <button onClick={onCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Live session info */}
        {sessionStarted && selectedSong && (
          <>
            <div className={styles.sessionControls}>
              <p>
                Now Playing: <strong>{selectedSong.title}</strong> – Chord:{' '}
                <span>{selectedSong.progression?.[currentChordIndex]?.chord || '-'}</span>
              </p>
              <button onClick={onEndSession}>End Session</button>
            </div>

            <div className={styles.progression}>
              <ul>
                {selectedSong.progression
                  ?.slice(currentChordIndex) // show current & upcoming chords
                  .map((step, i) => (
                    <li
                      key={i}
                      className={i === 0 ? styles.current : ''}
                    >
                      {step.chord} {i === 0 ? '← Current' : ''}
                    </li>
                  )) || <li>No progression data available.</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MultiPlayers;
