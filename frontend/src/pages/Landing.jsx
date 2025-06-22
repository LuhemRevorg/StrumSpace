import styles from '../styles/Landing.module.css';
import GuitarCanvas from '../components/GuitarCanvas';
import Navbar from '../components/Navbar';
import vmusic from '../images/vmusic.webp';
import music3 from '../images/music3.png';
import musi from '../images/musi.png';

export default function Landing() {
  const handleNavigate = () => {
    window.location.href = '/dashboard';
  };

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
          <button className={styles.cta} onClick={handleNavigate}>Start Learning</button>
          
        </div>

        <div className={styles.right}>
          <GuitarCanvas />
        </div>
      </div>
      <div className={styles.musicStrip}>
        <img src={musi} alt="Music Strip" height={100}/>
        <img src={musi} alt="Music Strip" height={100}/>
        <img src={musi} alt="Music Strip" height={100}/>
        <img src={musi} alt="Music Strip" height={100}/>
        <img src={musi} alt="Music Strip" height={100}/>
        <img src={musi} alt="Music Strip" height={100}/>
      </div>


      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerText}>
            <h2>StrumSpace</h2>
            <p>Where Music Meets Innovation</p>
          </div>
          {/* <div className={styles.footerImages}>
            <img src={vmusic} alt="VMusic" className={styles.footerImage} />
            <img src={music3} alt="Music3" className={styles.footer} />
          </div> */}
        </div>
        <div className={styles.footerLinks}>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact Us</a>
        </div>
      </div>  
    </>
  );
}
