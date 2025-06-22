import React, { useState } from 'react';
import styles from '../styles/Signup.module.css';
import { FaDiscord, FaGoogle, FaApple } from 'react-icons/fa';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MusicRain from '../components/MusicRain';

<Canvas
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    width: '100%',
    height: '100vh',
  }}
  camera={{ position: [0, 0, 10], fov: 45 }}
>
  <ambientLight intensity={0.6} />
  <directionalLight position={[0, 5, 5]} intensity={1.2} />
  <MusicRain /> {/* Now using your actual falling notes */}
</Canvas>



const Signup = () => {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        // TODO: Add signup logic (API call)
        setSuccess('Account created successfully!');
        setForm({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        });
    };

    return (
        <div style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.wrapper}>
            {/* Left: Signup Form */}
            <div className={styles.container}>
                <h2 className={styles.title}>Sign Up</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label className={styles.label}>Username</label>
                        <input className={styles.input} name="username" value={form.username} onChange={handleChange} required />
                    </div>
                    <div className={styles.group}>
                        <label className={styles.label}>Email</label>
                        <input className={styles.input} name="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className={styles.group}>
                        <label className={styles.label}>Password</label>
                        <input className={styles.input} type="password" name="password" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className={styles.group}>
                        <label className={styles.label}>Confirm Password</label>
                        <input className={styles.input} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div style={{ color: '#06fcd4', fontSize: '0.95rem', textAlign: 'center' }}>{success}</div>}
                    <button className={styles.button}>SIGN UP</button>
                </form>
                <div className={styles.socialButtonGroup}>
                    <button className={`${styles.socialButton} ${styles.discord}`}> <FaDiscord size={20} /> </button>
                    <button className={`${styles.socialButton} ${styles.google}`}> <FaGoogle size={20} /> </button>
                    <button className={`${styles.socialButton} ${styles.apple}`}> <FaApple size={20} /> </button>
                </div>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry />
                    <meshStandardMaterial color="hotpink" />
                    </mesh>
                </div>
            </div>
        </div>
    );
};

export default Signup;
