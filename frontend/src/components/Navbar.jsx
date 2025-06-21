import styles from '../styles/Navbar.module.css';
import logo from '/logo.png'; // Placeholder image path
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const handleSignUp = () => {
        navigate('/signup');
    };

  return (
    <nav className={styles.navbar}>
      <img src={logo} alt="StrumSpace Logo" className={styles.logo} />
      <button className={styles.button} onClick={handleSignUp}>Sign Up</button>
    </nav>
  );
}
