import './App.css';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SinglePlayer from './pages/Singleplayer';
import Catalog from './pages/Catalog';
import MiniDash from './pages/MiniDash';
import FreePlay from './pages/Freeplay';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MultiPlayers from './pages/MultiPlayer';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/single" element={<SinglePlayer />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/freeplay" element={<FreePlay />} />
          <Route path="/multi" element={<MultiPlayers />} />
          <Route path="/minidash" element={<MiniDash />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
