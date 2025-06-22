import React, { useState } from 'react';
import styles from '../styles/Sidebar.module.css';
import { Menu } from 'lucide-react';
import logo from '../logos/logo_dark.jpeg';

function Sidebar({ onTabChange, activeTab }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  const handleTabClick = (tab) => {
    onTabChange(tab);
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.topSection}>
        <button className={styles.hamburger} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        {!collapsed && (
          <h2 className={styles.logo}>
            <span className={styles.logoLink}>StrumSpace Studio</span>
          </h2>
        )}
      </div>

      {!collapsed && (
        <ul className={styles.nav}>
          <li onClick={() => handleTabClick('dashboard')} className={activeTab === 'dashboard' ? styles.active : ''}>Dashboard</li>
          <li onClick={() => handleTabClick('catalog')} className={activeTab === 'catalog' ? styles.active : ''}>Song Catalog</li>
          <li onClick={() => handleTabClick('multi')} className={activeTab === 'multi' ? styles.active : ''}>Multi Player</li>
          <li onClick={() => handleTabClick('settings')} className={activeTab === 'settings' ? styles.active : ''}>Settings</li>
        </ul>
      )}

      <img src={logo} alt="Logo" className={styles.logoImage} />
    </div>
  );
}

export default Sidebar;
