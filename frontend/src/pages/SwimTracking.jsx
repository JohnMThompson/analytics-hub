/**
 * Swim Tracking Dashboard
 * Displays swimming statistics, daily distances, and workout records
 */

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  LoadingSpinner,
  ErrorAlert,
  MetricCard,
  Card,
  DashboardSection,
  KpiGrid,
  ChartPanel,
  DataTablePanel,
} from '../components/shared';

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
    <DashboardLayout
      title="Swim Tracking"
      subtitle="Personal swimming statistics and workout history"
      themeClass="theme-swim"
    >
        {error && (
          <ErrorAlert error={error} onRetry={fetchSwimData} />
        )}

        {/* Summary Section */}
        {summary && (
          <DashboardSection title="1-Year Summary (Last 365 Days)">
            <KpiGrid columns={4}>
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
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Daily Distance Chart */}
        {dailyData.length > 0 && (
          <DashboardSection title="Daily Distance (Yards)">
            <ChartPanel>
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
            </ChartPanel>
          </DashboardSection>
        )}

        {/* Stroke Breakdown */}
        {strokes && (
          <DashboardSection title="Distance by Stroke">
            <KpiGrid columns={4}>
              <Card className="p-6 border-l-4 border-blue-500">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Freestyle</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{strokes.freestyle}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
              <Card className="p-6 border-l-4 border-green-500">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Backstroke</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{strokes.backstroke}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
              <Card className="p-6 border-l-4 border-purple-500">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Breaststroke</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{strokes.breaststroke}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
              <Card className="p-6 border-l-4 border-orange-500">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Butterfly</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{strokes.butterfly}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Records Table */}
        {records.length > 0 && (
          <DashboardSection title="Recent Workouts">
            <DataTablePanel>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>Date & Time</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>Duration</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>Distance (yards)</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>Location</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={record.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(record.start_date_time)}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{formatTime(record.duration)}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{record.total_distance_yards}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{record.location || '—'}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{record.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTablePanel>
          </DashboardSection>
        )}
    </DashboardLayout>
  );
}
