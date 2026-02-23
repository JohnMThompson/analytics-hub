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
import DataTable from '../components/table';
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
  const timeframeLabel = 'Last 365 days';

  const recentWorkoutColumns = [
    {
      key: 'start_date_time',
      header: 'Date & Time',
      render: (row) => formatDateTime(row.start_date_time),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'right',
      render: (row) => formatTime(row.duration),
    },
    {
      key: 'total_distance_yards',
      header: 'Distance (yards)',
      tone: 'primary',
      align: 'right',
      render: (row) => formatInteger(row.total_distance_yards),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => row.location || '—',
    },
    {
      key: 'comments',
      header: 'Comments',
      tone: 'muted',
      className: 'text-xs max-w-[260px] truncate',
      render: (row) => row.comments || '—',
    },
  ];
  const averageYardsPerWorkout = summary?.workout_count ? Math.round((summary.total_yards || 0) / summary.workout_count) : 0;
  const averageMinutesPerWorkout = summary?.workout_count ? Math.round(((summary.total_hours || 0) * 60) / summary.workout_count) : 0;
  const dailyAxisInterval = Math.max(0, Math.floor(dailyData.length / 8));

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
          <DashboardSection
            title="Performance Overview"
            subtitle={`${timeframeLabel} summary across workouts, time, and distance.`}
          >
            <KpiGrid columns={4}>
              <Card className="kpi-focus-card swim-kpi p-0">
                <div className="min-h-[220px] flex flex-col text-center">
                  <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Total Workouts</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <p className="text-5xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                      {formatInteger(summary.workout_count)}
                    </p>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>sessions</p>
                    <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>Avg duration: {averageMinutesPerWorkout} min</p>
                  </div>
                </div>
              </Card>
              <Card className="kpi-focus-card swim-kpi p-0">
                <div className="min-h-[220px] flex flex-col text-center">
                  <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Total Distance</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <p className="text-5xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                      {formatDecimal(summary.total_miles, 2)}
                    </p>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>miles</p>
                    <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Avg per workout: {formatInteger(averageYardsPerWorkout)} yds
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="kpi-focus-card swim-kpi p-0">
                <div className="min-h-[220px] flex flex-col text-center">
                  <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Total Time</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <p className="text-5xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                      {formatDurationHours(summary.total_hours)}
                    </p>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>in pool</p>
                    <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Avg per workout: {averageMinutesPerWorkout} min
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="kpi-focus-card swim-kpi p-0">
                <div className="min-h-[220px] flex flex-col text-center">
                  <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Total Yards</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <p className="text-5xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                      {formatInteger(summary.total_yards)}
                    </p>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>yards</p>
                    <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>Last 365 days</p>
                  </div>
                </div>
              </Card>
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Daily Distance Chart */}
        {dailyData.length > 0 && (
          <DashboardSection
            title="Distance Trend"
            subtitle={`${timeframeLabel} daily distance (yards).`}
          >
            <ColumnChartPanel
              data={dailyData}
              xKey="date"
              bars={[{ dataKey: 'total_yards', name: 'Distance (yards)', color: 'var(--chart-4)' }]}
              height={400}
              xAxisInterval={dailyAxisInterval}
              yDomain={[0, 'auto']}
              valueFormatter={(value) => `${formatInteger(value)} yards`}
              labelFormatter={(date) => `Date: ${date}`}
            />
          </DashboardSection>
        )}

        {/* Stroke Breakdown KPIs */}
        {strokeDistribution.length > 0 && (
          <DashboardSection
            title="Stroke Composition Snapshot"
            subtitle={`${timeframeLabel} total distance by stroke type.`}
          >
            <KpiGrid columns={4}>
              <Card className="kpi-focus-card swim-kpi p-6 text-center">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Freestyle</p>
                <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatInteger(strokes.freestyle)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
              <Card className="kpi-focus-card swim-kpi p-6 text-center">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Backstroke</p>
                <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatInteger(strokes.backstroke)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
              <Card className="kpi-focus-card swim-kpi p-6 text-center">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Breaststroke</p>
                <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatInteger(strokes.breaststroke)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
              <Card className="kpi-focus-card swim-kpi p-6 text-center">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Butterfly</p>
                <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatInteger(strokes.butterfly)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>yards</p>
              </Card>
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Bar / Pie / Donut Charts */}
        {strokeDistribution.length > 0 && (
          <DashboardSection
            title="Stroke Composition Visuals"
            subtitle="Ranked and proportional views of total distance by stroke."
          >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
              <BarChartPanel
                data={strokeDistribution}
                yKey="stroke"
                barKey="yards"
                barName="Distance (yards)"
                yAxisWidth={120}
                height={420}
                valueFormatter={(value) => `${formatInteger(value)} yards`}
                labelFormatter={(stroke) => `Stroke: ${stroke}`}
              />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
                <PieChartPanel
                  data={strokeDistribution}
                  dataKey="yards"
                  nameKey="stroke"
                  height={200}
                  valueFormatter={(value) => `${formatInteger(value)} yards`}
                />
                <DonutChartPanel
                  data={strokeDistribution}
                  dataKey="yards"
                  nameKey="stroke"
                  height={200}
                  valueFormatter={(value) => `${formatInteger(value)} yards`}
                />
              </div>
            </div>
          </DashboardSection>
        )}

        {/* Records Table */}
        {records.length > 0 && (
          <DashboardSection
            title="Recent Workouts"
            subtitle="Most recent swim sessions with duration, distance, and notes."
          >
            <DataTablePanel>
              <DataTable
                columns={recentWorkoutColumns}
                rows={records}
                rowKey="id"
                emptyMessage="No workouts found."
              />
            </DataTablePanel>
          </DashboardSection>
        )}
    </DashboardLayout>
  );
}
