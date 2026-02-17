/**
 * Main App Component
 * Setup routing and app structure
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/:dashboardId" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
