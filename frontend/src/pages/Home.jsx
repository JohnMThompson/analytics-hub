/**
 * Home/Dashboard List Page
 * Shows all available dashboards
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { LoadingSpinner, ErrorAlert } from '../components/shared';

export default function Home() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getDashboards();
      // API returns { dashboards: [...], total: ... }
      const data = response.dashboards || [];
      setDashboards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const getThemePreview = (dashboardId) => {
    if (dashboardId === 'mortgage_rates') {
      return { label: 'Mortgage Theme', accent: 'bg-cyan-100 text-cyan-800' };
    }
    if (dashboardId === 'swim_tracking') {
      return { label: 'Swim Theme', accent: 'bg-blue-100 text-blue-800' };
    }
    return { label: 'Default Theme', accent: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="dashboard-shell theme-default">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <h1 className="dashboard-title">Analytics Dashboard</h1>
            <p className="dashboard-subtitle">Choose a dashboard to view</p>
          </div>
          <span className="dashboard-badge">Reporting Package</span>
        </div>
      </header>

      <main className="dashboard-content">
        {error && (
          <ErrorAlert error={error} onRetry={fetchDashboards} />
        )}

        {dashboards.length === 0 ? (
          <div className="dashboard-panel p-6 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>No dashboards available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              (() => {
                const themePreview = getThemePreview(dashboard.id);
                return (
                  <Link
                    key={dashboard.id}
                    to={`/dashboard/${dashboard.id}`}
                    className="dashboard-panel p-6 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {dashboard.title}
                      </h2>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${themePreview.accent}`}>
                        {themePreview.label}
                      </span>
                    </div>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                      {dashboard.description}
                    </p>
                    <span className="dashboard-badge">View Dashboard</span>
                  </Link>
                );
              })()
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
