/**
 * Swim Tracking Dashboard
 * Displays swimming statistics, daily distances, and workout records
 */

import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  LoadingSpinner,
  ErrorAlert,
  MetricCard,
  Card,
  DashboardSection,
  KpiGrid,
  DataTablePanel,
} from '../components/shared';
import {
  BarChartPanel,
  ColumnChartPanel,
  DonutChartPanel,
  PieChartPanel,
} from '../components/charts';
import { formatDecimal, formatDurationHours, formatInteger } from '../utils/formatters';

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

  const strokeDistribution = strokes
    ? [
      { stroke: 'Freestyle', yards: strokes.freestyle || 0 },
      { stroke: 'Backstroke', yards: strokes.backstroke || 0 },
      { stroke: 'Breaststroke', yards: strokes.breaststroke || 0 },
      { stroke: 'Butterfly', yards: strokes.butterfly || 0 },
    ]
    : [];

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
                value={formatInteger(summary.workout_count)}
                unit="sessions"
                variant="emphasis"
              />
              <MetricCard
                label="Total Distance"
                value={formatDecimal(summary.total_miles, 2)}
                unit="miles"
              />
              <MetricCard
                label="Total Time"
                value={formatDurationHours(summary.total_hours)}
                state="neutral"
              />
              <MetricCard
                label="Total Yards"
                value={formatInteger(summary.total_yards)}
                unit="yards"
              />
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Daily Distance Chart */}
        {dailyData.length > 0 && (
          <DashboardSection title="Daily Distance (Yards)">
            <ColumnChartPanel
              data={dailyData}
              xKey="date"
              bars={[{ dataKey: 'total_yards', name: 'Distance (yards)', color: 'var(--chart-4)' }]}
              height={400}
              valueFormatter={(value) => `${formatInteger(value)} yards`}
              labelFormatter={(date) => `Date: ${date}`}
            />
          </DashboardSection>
        )}

        {/* Stroke Breakdown KPIs */}
        {strokeDistribution.length > 0 && (
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

        {/* Bar / Pie / Donut Charts */}
        {strokeDistribution.length > 0 && (
          <>
            <DashboardSection title="Stroke Distribution (Bar)">
              <BarChartPanel
                data={strokeDistribution}
                yKey="stroke"
                barKey="yards"
                barName="Distance (yards)"
                valueFormatter={(value) => `${formatInteger(value)} yards`}
                labelFormatter={(stroke) => `Stroke: ${stroke}`}
              />
            </DashboardSection>
            <DashboardSection title="Stroke Distribution (Pie & Donut)">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartPanel
                  data={strokeDistribution}
                  dataKey="yards"
                  nameKey="stroke"
                  valueFormatter={(value) => `${formatInteger(value)} yards`}
                />
                <DonutChartPanel
                  data={strokeDistribution}
                  dataKey="yards"
                  nameKey="stroke"
                  valueFormatter={(value) => `${formatInteger(value)} yards`}
                />
              </div>
            </DashboardSection>
          </>
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
