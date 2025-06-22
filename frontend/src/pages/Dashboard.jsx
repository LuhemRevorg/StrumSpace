import { useEffect, useRef } from 'react';
import styles from '../styles/Dashboard.module.css';
import Sidebar from '../components/Sidebar';

function Dashboard() {
  const videoRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    }

    startCamera();
  }, []);

  return (
    <div className={styles.wrapper} style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.videoContainer}>
          <video ref={videoRef} className={styles.video} autoPlay muted />
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.chatbox}>
            <h3>Chat with AI</h3>
            <textarea placeholder="Type your prompt..." />
            <button>Send</button>
          </div>

          <div className={styles.rightBox}>
            <h3>Right Side Box</h3>
            <p>Placeholder for future content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
