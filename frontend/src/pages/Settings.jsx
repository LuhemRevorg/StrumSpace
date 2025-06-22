import React from 'react';

const userSettings = {
    username: 'john_doe',
    email: 'john@example.com',
    notifications: true,
    theme: 'dark',
};

export default function Settings() {
    return (
        <div style={{ maxWidth: 500, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2>User Settings</h2>
            <div style={{ marginBottom: '1rem' }}>
                <strong>Username:</strong> {userSettings.username}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <strong>Email:</strong> {userSettings.email}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <strong>Notifications:</strong> {userSettings.notifications ? 'Enabled' : 'Disabled'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <strong>Theme:</strong> {userSettings.theme.charAt(0).toUpperCase() + userSettings.theme.slice(1)}
            </div>
        </div>
    );
}