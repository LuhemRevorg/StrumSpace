import './App.css';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import SinglePlayer from './pages/Singleplayer';
import Catalog from './pages/Catalog';
import MultiPlayer from './pages/MultiPlayer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
          <Route path="/multi" element={<MultiPlayer />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
