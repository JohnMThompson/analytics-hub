/**
 * Main App Component
 * Setup routing and app structure
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { trackPageView } from './utils/analytics';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/:dashboardId" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
