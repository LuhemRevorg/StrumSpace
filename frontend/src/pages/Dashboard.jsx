import { useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import Sidebar from '../components/Sidebar';
import SinglePlayer from './Singleplayer';
import Catalog from './Catalog';
import MultiPlayer from './Multiplayer';
import Settings from './Settings';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // default

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SinglePlayer />;
      case 'catalog':
        return <Catalog />;
      case 'multi':
        return <MultiPlayer />;
      case 'settings':
        return <Settings />;
      default:
        return <SinglePlayer />;
    }
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
      <div className={styles.mainContent}>
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default Dashboard;
