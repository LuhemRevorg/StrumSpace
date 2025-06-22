import React from 'react';
import styles from '../styles/MiniDash.module.css';

const MiniDash = ({ setActiveTab }) => {
  const renderActiveTab = () => {
  switch (activeTab) {
    case 'minidash':
      return <MiniDash setActiveTab={setActiveTab} />;
    case 'single':
      return <SinglePlayer />;
    case 'catalog':
      return <Catalog />;
    case 'multi':
      return <MultiPlayer />;
    case 'freeplay':
      return <div>🎸 Freeplay Mode Coming Soon</div>; // temp
    case 'chord':
      return <div>🎼 Chord Builder Coming Soon</div>; // temp
    default:
      return <SinglePlayer />;
  }
};

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to StrumSpace</h1>

      <div className={styles.grid}>
        <div className={styles.card} onClick={() => setActiveTab('single')}>
          <h2>Single Player</h2>
          <p>Practice at your own pace.</p>
        </div>

        <div className={styles.card} onClick={() => setActiveTab('multi')}>
          <h2>Multiplayer</h2>
          <p>Jam together with friends online.</p>
        </div>

        <div className={styles.card} onClick={() => setActiveTab('catalog')}>
          <h2>Song Catalog</h2>
          <p>Explore and pick songs to learn.</p>
        </div>

        <div className={styles.card} onClick={() => setActiveTab('freeplay')}>
          <h2>Freeplay Random Chords</h2>
          <p>Improvise with random chords anytime.</p>
        </div>

        <div className={styles.card} onClick={() => setActiveTab('chord')}>
          <h2>Custom Chords / Sequences</h2>
          <p>Create custom chords or practice famous ones.</p>
        </div>
      </div>
    </div>
  );
};

export default MiniDash;
