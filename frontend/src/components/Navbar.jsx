import { useEffect, useState } from 'react';
import styles from '../styles/Navbar.module.css';
import LiLo from '../logos/logo_light.jpeg';
import DaLo from '../logos/logo_dark.jpeg';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <img
        src={scrolled ? LiLo : DaLo}
        alt="Logo"
        className={styles.logo}
      />
      <button className={styles.button}>Sign Up</button>
    </nav>
  );
}
