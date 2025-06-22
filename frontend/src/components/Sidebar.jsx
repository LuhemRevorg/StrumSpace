import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';
import { Menu } from 'lucide-react'; // or use any icon lib like react-icons

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
        {!collapsed && <h2 className={styles.logo}>
            <Link to="/" className={styles.logoLink}>
              StrumSpace
            </Link> 
        </h2>}
      </div>

      {!collapsed && (
        <ul className={styles.nav}>
          <li>Dashboard</li>
          <li>AI Prompts</li>
          <li>Video Library</li>
          <li>Settings</li>
        </ul>
      )}
    </div>
  );
}

export default Sidebar;
