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
  const year = new Date().getFullYear();

  return (
    <div className="dashboard-shell theme-default">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <h1 className="dashboard-title">Analytics and Reporting Hub</h1>
            <p className="dashboard-subtitle">Choose a dashboard to view</p>
          </div>
          <a
            href="https://github.com/JohnMThompson/ai-analytics"
            target="_blank"
            rel="noreferrer"
            aria-label="Open project GitHub repository"
            className="dashboard-link focus-ring inline-flex items-center justify-center rounded-full border p-2"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 1.5A10.5 10.5 0 0 0 8.68 22c.52.09.7-.22.7-.5v-1.92c-2.86.62-3.47-1.2-3.47-1.2-.46-1.18-1.13-1.5-1.13-1.5-.92-.63.08-.62.08-.62 1.02.07 1.56 1.05 1.56 1.05.9 1.55 2.37 1.1 2.95.84.09-.66.35-1.1.64-1.35-2.28-.26-4.67-1.14-4.67-5.06 0-1.12.4-2.03 1.05-2.75-.1-.26-.46-1.32.1-2.74 0 0 .85-.27 2.8 1.05a9.6 9.6 0 0 1 5.1 0c1.95-1.32 2.8-1.05 2.8-1.05.56 1.42.2 2.48.1 2.74.66.72 1.05 1.63 1.05 2.75 0 3.93-2.4 4.8-4.69 5.05.36.31.68.93.68 1.88v2.79c0 .28.18.59.7.5A10.5 10.5 0 0 0 12 1.5Z" />
            </svg>
          </a>
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
              <Link
                key={dashboard.id}
                to={`/dashboard/${dashboard.id}`}
                className="dashboard-panel p-6 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {dashboard.title}
                  </h2>
                </div>
                <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                  {dashboard.description}
                </p>
                <span className="dashboard-badge">View Dashboard</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer className="dashboard-footer">
        <p>© {year} John Thompson</p>
      </footer>
    </div>
  );
}
