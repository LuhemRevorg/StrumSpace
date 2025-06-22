import styles from '../styles/Landing.module.css';
import GuitarCanvas from '../components/GuitarCanvas';
import Navbar from '../components/Navbar';

export default function Landing() {
  return (
    <>
      <Navbar />
    <div className={styles.container}>
      <div className={styles.left}>
        <h1>Welcome to StrumSpace</h1>
        <p>
          Learn guitar with a twist — augmented reality overlays, AI voice assistant,
          and real-time visual feedback. Whether you're a beginner or riffing pro,
          StrumSpace makes your guitar glow with possibility. Plug in, zone out, and strum smarter.
        </p>
        <button className={styles.cta}>Start Learning</button>
      </div>
      <div className={styles.right}>
        <GuitarCanvas />
      </div>
    </div>
    </>
  );
}
