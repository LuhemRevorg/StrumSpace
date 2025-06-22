import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';
import { Menu } from 'lucide-react';
import logo from '../logos/logo_dark.jpeg';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.topSection}>
        <button className={styles.hamburger} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        {!collapsed && (
          <h2 className={styles.logo}>
            <Link to="/" className={styles.logoLink}>StrumSpace Studio</Link>
          </h2>
        )}
      </div>

      {!collapsed && (
        <ul className={styles.nav}>
          <li><Link to="/single" className={styles.navLink}>Dashboard</Link></li>
          <li><Link to="/catalog" className={styles.navLink}>Song Catalog</Link></li>
          <li><Link to="/multi" className={styles.navLink}>Multi Player</Link></li>
          <li><Link to="/settings" className={styles.navLink}>Settings</Link></li>
        </ul>
      )}

      <img src={logo} alt="Logo" className={styles.logoImage} />
    </div>
  );
}

export default Sidebar;
