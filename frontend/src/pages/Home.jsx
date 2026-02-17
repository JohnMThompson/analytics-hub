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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Choose a dashboard to view</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <ErrorAlert error={error} onRetry={fetchDashboards} />
        )}

        {dashboards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No dashboards available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Link
                key={dashboard.id}
                to={`/dashboard/${dashboard.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {dashboard.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {dashboard.description}
                </p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  View Dashboard
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
