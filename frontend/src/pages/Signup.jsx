import React, { useState } from 'react';
import styles from '../styles/Signup.module.css';

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
                <div className={styles.socialButton}>
                    <button className={`${styles.socialButton} ${styles.discord}`}>Discord</button>
                    <button className={`${styles.socialButton} ${styles.google}`}>Google</button>
                    <button className={`${styles.socialButton} ${styles.apple}`}>Apple</button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
