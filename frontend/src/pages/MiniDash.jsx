import React from 'react';
import styles from '../styles/MiniDash.module.css';

const MiniDash = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to StrumSpace</h1>
      
      <div className={styles.grid}>
        <a href="/single" className={styles.card}>
          <h2>Single Player</h2>
          <p>Practice at your own pace.</p>
        </a>

        <a href="/multi" className={styles.card}>
          <h2>Multiplayer</h2>
          <p>Jam together with friends online.</p>
        </a>

        <a href="/catalog" className={styles.card}>
          <h2>Song Catalog</h2>
          <p>Explore and pick songs to learn.</p>
        </a>

        <a href="/freeplay" className={styles.card}>
          <h2>Freeplay Random Chords</h2>
          <p>Improvise with random chords anytime.</p>
        </a>

        <a href="/chord" className={styles.card}>
          <h2>Custom Chords / Sequences</h2>
          <p>Create custom chords or practice famous ones.</p>
        </a>
        
        <a href="/settings" className={styles.card}>
          <h2>Settings</h2>
          <p>Common settings for your best experience!</p>
        </a>

      </div>
    </div>
  );
};

export default MiniDash;
