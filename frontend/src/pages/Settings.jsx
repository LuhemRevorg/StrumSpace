import React, { useState } from 'react';
import styles from '../styles/Settings.module.css';

const initialSettings = {
  username: 'john_doe',
  email: 'john@example.com',
  notifications: true,
  theme: 'dark',
  language: 'English',
  password: '',
  receiveNewsletter: false,
};

export default function Settings() {
  const [settings, setSettings] = useState(initialSettings);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});

  const themes = ['light', 'dark', 'solarized'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese'];

  const validate = () => {
    let newErrors = {};
    if (!settings.username.trim()) newErrors.username = 'Username is required';
    if (!settings.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email address';
    if (settings.password && settings.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setEditing(false);
    alert('Settings saved!');
  };

  return (
    <div className={styles.container}>
      <h2>User Settings</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Username
          <input
            type="text"
            name="username"
            value={settings.username}
            onChange={handleChange}
            disabled={!editing}
            className={errors.username ? styles.errorInput : ''}
          />
          {errors.username && <small className={styles.errorMsg}>{errors.username}</small>}
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={settings.email}
            onChange={handleChange}
            disabled={!editing}
            className={errors.email ? styles.errorInput : ''}
          />
          {errors.email && <small className={styles.errorMsg}>{errors.email}</small>}
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={settings.password}
            onChange={handleChange}
            placeholder={editing ? 'Enter new password' : '******'}
            disabled={!editing}
            className={errors.password ? styles.errorInput : ''}
          />
          {errors.password && <small className={styles.errorMsg}>{errors.password}</small>}
        </label>

        <label>
          Notifications
          <input
            type="checkbox"
            name="notifications"
            checked={settings.notifications}
            onChange={handleChange}
            disabled={!editing}
          />
        </label>

        <label>
          Receive Newsletter
          <input
            type="checkbox"
            name="receiveNewsletter"
            checked={settings.receiveNewsletter}
            onChange={handleChange}
            disabled={!editing}
          />
        </label>

        <label>
          Theme
          <select
            name="theme"
            value={settings.theme}
            onChange={handleChange}
            disabled={!editing}
          >
            {themes.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </label>

        <label>
          Language
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            disabled={!editing}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </label>

        <div className={styles.buttons}>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={styles.editBtn}
            >
              Edit Settings
            </button>
          )}

          {editing && (
            <>
              <button type="submit" className={styles.saveBtn}>Save</button>
              <button
                type="button"
                onClick={() => {
                  setSettings(initialSettings);
                  setErrors({});
                  setEditing(false);
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
