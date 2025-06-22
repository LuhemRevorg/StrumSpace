import { useState } from 'react';
import styles from '../styles/Dashboard.module.css';
import Sidebar from '../components/Sidebar';
import SinglePlayer from './Singleplayer';
import Catalog from './Catalog';
import MultiPlayer from './MultiPlayer';
import MiniDash from './MiniDash';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('minidash'); // default

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'minidash':
        return <MiniDash />;
      case 'single':
        return <SinglePlayer />;
      case 'catalog':
        return <Catalog />;
      case 'multi':
        return <MultiPlayer />;
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
