/**
 * Swim Tracking Dashboard
 * Displays swimming statistics, daily distances, and workout records
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api';
import { LoadingSpinner, ErrorAlert, MetricCard, Card } from '../components/shared';

export default function SwimTracking() {
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [records, setRecords] = useState([]);
  const [strokes, setStrokes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSwimData();
  }, []);

  const fetchSwimData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [sum, daily, recs, strokeData] = await Promise.all([
        apiClient.getDashboardEndpoint('swim_tracking', 'summary', { days: 365 }),
        apiClient.getDashboardEndpoint('swim_tracking', 'distance_by_date', { days: 365 }),
        apiClient.getDashboardEndpoint('swim_tracking', 'records', { days: 365, limit: 50 }),
        apiClient.getDashboardEndpoint('swim_tracking', 'stroke_breakdown', { days: 365 }),
      ]);

      setSummary(sum);
      setDailyData(Array.isArray(daily) ? daily : []);
      setRecords(Array.isArray(recs) ? recs : []);
      setStrokes(strokeData);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch swim data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Swim Tracking</h1>
            <p className="text-gray-600 mt-1">Personal swimming statistics and workout history</p>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Dashboards
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <ErrorAlert error={error} onRetry={fetchSwimData} />
        )}

        {/* Summary Section */}
        {summary && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1-Year Summary (Last 365 Days)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                label="Total Workouts"
                value={summary.workout_count}
                unit="sessions"
              />
              <MetricCard
                label="Total Distance"
                value={summary.total_miles}
                unit="miles"
              />
              <MetricCard
                label="Total Time"
                value={summary.total_hours}
                unit="hours"
              />
              <MetricCard
                label="Total Yards"
                value={summary.total_yards}
                unit="yards"
              />
            </div>
          </div>
        )}

        {/* Daily Distance Chart */}
        {dailyData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Daily Distance (Yards)</h2>
            <Card className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval={Math.floor(dailyData.length / 10)}
                  />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    formatter={(value) => `${value} yards`}
                    labelFormatter={(date) => `Date: ${date}`}
                  />
                  <Bar
                    dataKey="total_yards"
                    fill="#0284c7"
                    name="Distance (yards)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Stroke Breakdown */}
        {strokes && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Distance by Stroke</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 border-l-4 border-blue-500">
                <p className="text-sm font-medium text-gray-600 mb-2">Freestyle</p>
                <p className="text-3xl font-bold text-gray-900">{strokes.freestyle}</p>
                <p className="text-xs text-gray-500 mt-1">yards</p>
              </Card>
              <Card className="p-6 border-l-4 border-green-500">
                <p className="text-sm font-medium text-gray-600 mb-2">Backstroke</p>
                <p className="text-3xl font-bold text-gray-900">{strokes.backstroke}</p>
                <p className="text-xs text-gray-500 mt-1">yards</p>
              </Card>
              <Card className="p-6 border-l-4 border-purple-500">
                <p className="text-sm font-medium text-gray-600 mb-2">Breaststroke</p>
                <p className="text-3xl font-bold text-gray-900">{strokes.breaststroke}</p>
                <p className="text-xs text-gray-500 mt-1">yards</p>
              </Card>
              <Card className="p-6 border-l-4 border-orange-500">
                <p className="text-sm font-medium text-gray-600 mb-2">Butterfly</p>
                <p className="text-3xl font-bold text-gray-900">{strokes.butterfly}</p>
                <p className="text-xs text-gray-500 mt-1">yards</p>
              </Card>
            </div>
          </div>
        )}

        {/* Records Table */}
        {records.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Workouts</h2>
            <Card className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date & Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Distance (yards)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={record.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-4 text-gray-600">{formatDateTime(record.start_date_time)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatTime(record.duration)}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{record.total_distance_yards}</td>
                      <td className="py-3 px-4 text-gray-600">{record.location || '—'}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{record.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
