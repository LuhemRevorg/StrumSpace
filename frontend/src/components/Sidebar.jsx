import React, { useState } from 'react';
import styles from '../styles/Sidebar.module.css';
import { Menu } from 'lucide-react';
import logo from '../logos/logo_dark.jpeg';

function Sidebar({ onTabChange, activeTab }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  const tabs = [
    { key: 'minidash', label: 'Dashboard' },
    { key: 'catalog', label: 'Song Catalog' },
    { key: 'single', label: 'Single Player' },
    { key: 'multi', label: 'Multi Player' },
    { key: 'freeplay', label: 'Freeplay Random Chords' },
  ];

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.topSection}>
        <button className={styles.hamburger} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        {!collapsed && (
          <h2 className={styles.logo}>
            
          </h2>
        )}
      </div>

      {!collapsed && (
        <ul className={styles.nav}>
          {tabs.map((tab) => (
            <li
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`${styles.navLink} ${activeTab === tab.key ? styles.active : ''}`}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      )}
            <button onClick={() => window.location.href = '/'}
              className={`${styles.navLink} styles.active`}
            >Back home?</button>
      <img src={logo} alt="Logo" className={styles.logoImage} />
    </div>
  );
}

export default Sidebar;
