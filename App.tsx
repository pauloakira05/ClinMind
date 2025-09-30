import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainMenu from './pages/MainMenu';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import ManualEntry from './pages/ManualEntry';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<MainMenu />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/manual" element={<ManualEntry />} />
      </Routes>
    </Router>
  );
}

export default App;