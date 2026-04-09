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
  ColumnChartPanel,
  DonutChartPanel,
} from '../components/charts';
import DataTable, { TableExportButton } from '../components/table';
import { formatDecimal, formatDurationHours, formatInteger } from '../utils/formatters';

export const WORKOUTS_PAGE_SIZE = 50;
export const SWIM_STROKE_COLORS = {
  Freestyle: 'var(--chart-1)',
  Backstroke: 'var(--chart-2)',
  Breaststroke: 'var(--chart-3)',
  Butterfly: 'var(--chart-4)',
};
export const SWIM_UNIT_SYSTEMS = {
  IMPERIAL: 'imperial',
  METRIC: 'metric',
};

const YARDS_TO_METERS = 0.9144;
const MILES_TO_KILOMETERS = 1.609344;

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last 12 months' },
  { value: 730, label: 'Last 24 months' },
];

export function formatSwimTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatSwimDateTime(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSwimChartDateTick(dateStr, abbreviated = false) {
  if (!dateStr) return '—';

  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString('en-US', abbreviated
    ? { month: 'numeric', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: '2-digit' });
}

export function convertYardsToMeters(yards) {
  if (yards === null || yards === undefined || Number.isNaN(Number(yards))) return 0;
  return Number(yards) * YARDS_TO_METERS;
}

export function convertMilesToKilometers(miles) {
  if (miles === null || miles === undefined || Number.isNaN(Number(miles))) return 0;
  return Number(miles) * MILES_TO_KILOMETERS;
}

export function getSwimDistanceUnitLabels(unitSystem = SWIM_UNIT_SYSTEMS.IMPERIAL) {
  return unitSystem === SWIM_UNIT_SYSTEMS.METRIC
    ? {
      shortDistance: 'm',
      longDistance: 'kilometers',
      mediumDistance: 'meters',
      chartDistance: 'Distance (meters)',
      summaryDistance: 'meters',
    }
    : {
      shortDistance: 'yds',
      longDistance: 'miles',
      mediumDistance: 'yards',
      chartDistance: 'Distance (yards)',
      summaryDistance: 'yards',
    };
}

export function formatSwimDistance(value, unitSystem = SWIM_UNIT_SYSTEMS.IMPERIAL, maximumFractionDigits = 0) {
  const converted = unitSystem === SWIM_UNIT_SYSTEMS.METRIC ? convertYardsToMeters(value) : Number(value ?? 0);
  return maximumFractionDigits > 0
    ? formatDecimal(converted, maximumFractionDigits)
    : formatInteger(converted);
}

export function formatSwimLongDistance(value, unitSystem = SWIM_UNIT_SYSTEMS.IMPERIAL, maximumFractionDigits = 2) {
  const converted = unitSystem === SWIM_UNIT_SYSTEMS.METRIC ? convertMilesToKilometers(value) : Number(value ?? 0);
  return formatDecimal(converted, maximumFractionDigits);
}

export function renderStrokeDonutLabel({ cx, cy, midAngle, outerRadius, percent, name, payload }) {
  if (!percent || percent < 0.05) {
    return null;
  }

  const radius = outerRadius + 26;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);
  const roundedPercent = `${Math.round(percent * 100)}%`;
  const labelText = `${name} ${roundedPercent}`;
  const badgeWidth = Math.max(92, labelText.length * 7.2 + 30);
  const badgeHeight = 28;
  const badgeX = x > cx ? x + 8 : x - badgeWidth - 8;
  const badgeY = y - badgeHeight / 2;
  const textX = badgeX + 24;
  const dotX = badgeX + 12;
  const lineStartRadius = outerRadius + 2;
  const lineStartX = cx + lineStartRadius * Math.cos((-midAngle * Math.PI) / 180);
  const lineStartY = cy + lineStartRadius * Math.sin((-midAngle * Math.PI) / 180);
  const lineEndX = x > cx ? badgeX : badgeX + badgeWidth;
  const lineEndY = y;

  return (
    <g>
      <path
        d={`M ${lineStartX} ${lineStartY} L ${x} ${y} L ${lineEndX} ${lineEndY}`}
        fill="none"
        stroke={payload?.color || 'var(--chart-1)'}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height={badgeHeight}
        rx={10}
        fill="#f8fbff"
        stroke="#dbe5f0"
      />
      <circle cx={dotX} cy={y} r={4} fill={payload?.color || 'var(--chart-1)'} />
      <text
        x={textX}
        y={y}
        fill="#0f172a"
        textAnchor="start"
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {labelText}
      </text>
    </g>
  );
}

export function SwimMobileWorkoutCard({ row, unitSystem = SWIM_UNIT_SYSTEMS.IMPERIAL }) {
  const distanceLabels = getSwimDistanceUnitLabels(unitSystem);

  return (
    <article
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        borderColor: 'var(--border-soft)',
        backgroundColor: 'var(--bg-panel)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent-600)' }}>
            Workout
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatSwimDateTime(row?.start_date_time)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
            Duration
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatSwimTime(row?.duration || 0)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--accent-50)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
            Distance
          </p>
          <p className="mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatSwimDistance(row?.total_distance_yards || 0, unitSystem)} {distanceLabels.shortDistance}
          </p>
        </div>
        <div className="rounded-xl border px-3 py-2" style={{ backgroundColor: '#f8fbff', borderColor: 'var(--border-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
            Location
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {row?.location || '—'}
          </p>
        </div>
      </div>
      <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
          Comments
        </p>
        <p className="mt-2 text-sm leading-6 break-words" style={{ color: 'var(--text-secondary)' }}>
          {row?.comments || '—'}
        </p>
      </div>
    </article>
  );
}

export function buildRecentWorkoutColumns(unitSystem = SWIM_UNIT_SYSTEMS.IMPERIAL) {
  const distanceLabels = getSwimDistanceUnitLabels(unitSystem);

  return [
    {
      key: 'start_date_time',
      header: 'Date & Time',
      render: (row) => formatSwimDateTime(row.start_date_time),
      exportValue: (row) => formatSwimDateTime(row.start_date_time),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'right',
      render: (row) => formatSwimTime(row.duration),
      exportValue: (row) => formatSwimTime(row.duration),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => row.location || '—',
      exportValue: (row) => row.location || '—',
    },
    {
      key: 'total_distance_yards',
      header: distanceLabels.chartDistance,
      tone: 'primary',
      align: 'right',
      render: (row) => formatSwimDistance(row.total_distance_yards, unitSystem),
      exportValue: (row) => formatSwimDistance(row.total_distance_yards, unitSystem),
    },
    {
      key: 'comments',
      header: 'Comments',
      tone: 'muted',
      className: 'text-xs max-w-[260px] truncate',
      render: (row) => row.comments || '—',
    },
  ];
}

export function paginateRecords(records = [], page = 1, pageSize = WORKOUTS_PAGE_SIZE) {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : WORKOUTS_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(records.length / safePageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * safePageSize;

  return {
    currentPage: safePage,
    totalPages,
    pageRows: records.slice(startIndex, startIndex + safePageSize),
  };
}

export default function SwimTracking() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDays, setSelectedDays] = useState('365');
  const [unitSystem, setUnitSystem] = useState(SWIM_UNIT_SYSTEMS.IMPERIAL);
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [records, setRecords] = useState([]);
  const [strokes, setStrokes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [recordsPage, setRecordsPage] = useState(1);

  useEffect(() => {
    fetchSwimData();
  }, [selectedDays]);

  useEffect(() => {
    setRecordsPage(1);
  }, [selectedDays]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateIsMobile = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  const fetchSwimData = async () => {
    try {
      setLoading(true);
      setError(null);

      const isAllTime = selectedDays === 'all';
      const rangeParams = isAllTime ? { all_time: true } : { days: Number(selectedDays) };

      // Fetch all data in parallel
      const [sum, daily, recs, strokeData] = await Promise.all([
        apiClient.getDashboardEndpoint('swim_tracking', 'summary', rangeParams),
        apiClient.getDashboardEndpoint('swim_tracking', 'distance_by_date', rangeParams),
        apiClient.getDashboardEndpoint('swim_tracking', 'records', rangeParams),
        apiClient.getDashboardEndpoint('swim_tracking', 'stroke_breakdown', rangeParams),
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

  const strokeDistribution = strokes
    ? [
      { stroke: 'Freestyle', yards: strokes.freestyle || 0, color: SWIM_STROKE_COLORS.Freestyle },
      { stroke: 'Backstroke', yards: strokes.backstroke || 0, color: SWIM_STROKE_COLORS.Backstroke },
      { stroke: 'Breaststroke', yards: strokes.breaststroke || 0, color: SWIM_STROKE_COLORS.Breaststroke },
      { stroke: 'Butterfly', yards: strokes.butterfly || 0, color: SWIM_STROKE_COLORS.Butterfly },
    ].sort((a, b) => b.yards - a.yards)
    : [];
  const strokeChartData = strokeDistribution.filter((stroke) => stroke.yards > 0);
  const totalStrokeYards = strokeDistribution.reduce((sum, stroke) => sum + stroke.yards, 0);
  const getStrokePercent = (yards) => {
    if (!totalStrokeYards) return '0%';
    return `${Math.round((yards / totalStrokeYards) * 100)}%`;
  };
  const filledDailyData = (() => {
    if (!Array.isArray(dailyData) || dailyData.length === 0) return [];

    const sorted = [...dailyData]
      .filter((entry) => entry?.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return [];

    const byDate = new Map(sorted.map((entry) => [entry.date, entry]));
    const start = new Date(`${sorted[0].date}T00:00:00`);
    const end = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);

    const expanded = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const existing = byDate.get(key);
      expanded.push({
        date: key,
        total_yards: existing?.total_yards ?? 0,
        workout_count: existing?.workout_count ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return expanded;
  })();
  const timeframeLabel = DATE_RANGE_OPTIONS.find((option) => String(option.value) === String(selectedDays))?.label || `Last ${selectedDays} days`;

  const distanceLabels = getSwimDistanceUnitLabels(unitSystem);
  const recentWorkoutColumns = buildRecentWorkoutColumns(unitSystem);
  const { currentPage, totalPages, pageRows } = paginateRecords(records, recordsPage, WORKOUTS_PAGE_SIZE);
  const averageYardsPerWorkout = summary?.workout_count ? Math.round((summary.total_yards || 0) / summary.workout_count) : 0;
  const averageMinutesPerWorkout = summary?.workout_count ? Math.round(((summary.total_hours || 0) * 60) / summary.workout_count) : 0;
  const dailyAxisInterval = isMobile
    ? Math.max(0, Math.floor(filledDailyData.length / 4))
    : Math.max(0, Math.floor(filledDailyData.length / 8));

  return (
    <DashboardLayout
      title="Swim Tracking"
      subtitle={`Personal swimming statistics and workout history (${timeframeLabel})`}
      themeClass="theme-swim"
      controls={(
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="swim-date-range" className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Date Range
            </label>
            <select
              id="swim-date-range"
              className="focus-ring rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)', backgroundColor: '#fff' }}
              value={selectedDays}
              onChange={(event) => setSelectedDays(event.target.value)}
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex rounded-full border p-1" style={{ borderColor: 'var(--border-soft)', backgroundColor: '#fff' }}>
                <button
                  type="button"
                  className="focus-ring rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: unitSystem === SWIM_UNIT_SYSTEMS.IMPERIAL ? 'var(--accent-100)' : 'transparent',
                    color: unitSystem === SWIM_UNIT_SYSTEMS.IMPERIAL ? 'var(--accent-700)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setUnitSystem(SWIM_UNIT_SYSTEMS.IMPERIAL)}
                >
                  Imperial
                </button>
                <button
                  type="button"
                  className="focus-ring rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: unitSystem === SWIM_UNIT_SYSTEMS.METRIC ? 'var(--accent-100)' : 'transparent',
                    color: unitSystem === SWIM_UNIT_SYSTEMS.METRIC ? 'var(--accent-700)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setUnitSystem(SWIM_UNIT_SYSTEMS.METRIC)}
                >
                  Metric
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    >
        {error && (
          <ErrorAlert error={error} onRetry={fetchSwimData} />
        )}

        <Card className="mb-6 p-2">
          <div role="tablist" aria-label="Swim Tracking Sections" className="flex flex-wrap gap-2">
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className="focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === 'overview' ? 'var(--accent-100)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--accent-700)' : 'var(--text-secondary)',
              }}
            >
              Overview
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={activeTab === 'stroke'}
              onClick={() => setActiveTab('stroke')}
              className="focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === 'stroke' ? 'var(--accent-100)' : 'transparent',
                color: activeTab === 'stroke' ? 'var(--accent-700)' : 'var(--text-secondary)',
              }}
            >
              Stroke Composition
            </button>
          </div>
        </Card>

        {activeTab === 'overview' && (
          <>
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
                          {formatSwimLongDistance(summary.total_miles, unitSystem, 2)}
                        </p>
                        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{distanceLabels.longDistance}</p>
                        <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          Avg per workout: {formatSwimDistance(averageYardsPerWorkout, unitSystem)} {distanceLabels.shortDistance}
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
                        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {unitSystem === SWIM_UNIT_SYSTEMS.METRIC ? 'Total Meters' : 'Total Yards'}
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                        <p className="text-5xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                          {formatSwimDistance(summary.total_yards, unitSystem)}
                        </p>
                        <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{distanceLabels.summaryDistance}</p>
                        <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>{timeframeLabel}</p>
                      </div>
                    </div>
                  </Card>
                </KpiGrid>
              </DashboardSection>
            )}

            {/* Daily Distance Chart */}
            {filledDailyData.length > 0 && (
              <DashboardSection
                title="Distance Trend"
                subtitle={`${timeframeLabel} daily distance (${distanceLabels.mediumDistance}).`}
              >
                <ColumnChartPanel
                  data={filledDailyData}
                  xKey="date"
                  bars={[{ dataKey: 'total_yards', name: distanceLabels.chartDistance, color: 'var(--chart-4)' }]}
                  height={400}
                  showLegend={false}
                  xAxisInterval={dailyAxisInterval}
                  xTickFormatter={(value) => formatSwimChartDateTick(value, isMobile)}
                  yDomain={[0, 'auto']}
                  yTickFormatter={(value) => formatSwimDistance(value, unitSystem)}
                  valueFormatter={(value) => `${formatSwimDistance(value, unitSystem)} ${distanceLabels.mediumDistance}`}
                  labelFormatter={(date) => `Date: ${formatSwimChartDateTick(date, false)}`}
                />
              </DashboardSection>
            )}

            {/* Records Table */}
            {records.length > 0 && (
              <DashboardSection
                title="Workouts"
                subtitle={`${timeframeLabel} swim sessions with duration, distance, and notes.`}
                right={(
                  <TableExportButton
                    columns={recentWorkoutColumns}
                    rows={records}
                    exportConfig={{
                      fileName: `swim-tracking-workouts-${selectedDays === 'all' ? 'all-time' : `${selectedDays}-days`}`,
                      sheetName: 'Workouts',
                      rows: records,
                    }}
                  />
                )}
              >
                <div className="grid gap-3 sm:hidden">
                  {pageRows.map((row) => (
                    <SwimMobileWorkoutCard key={row.id} row={row} unitSystem={unitSystem} />
                  ))}
                </div>
                <div className="hidden sm:block">
                  <DataTablePanel>
                    <DataTable
                      columns={recentWorkoutColumns}
                      rows={pageRows}
                      rowKey="id"
                      emptyMessage="No workouts found."
                      exportConfig={{
                        enabled: false,
                        fileName: `swim-tracking-workouts-${selectedDays === 'all' ? 'all-time' : `${selectedDays}-days`}`,
                        sheetName: 'Workouts',
                        rows: records,
                      }}
                      footerContent={records.length > WORKOUTS_PAGE_SIZE ? (
                        <>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Page {currentPage} of {totalPages}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="focus-ring rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                              onClick={() => setRecordsPage((page) => Math.max(1, page - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              className="focus-ring rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                              onClick={() => setRecordsPage((page) => Math.min(totalPages, page + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </div>
                        </>
                      ) : null}
                    />
                  </DataTablePanel>
                </div>
              </DashboardSection>
            )}
          </>
        )}

        {activeTab === 'stroke' && (
          <>
            {/* Stroke Breakdown KPIs */}
            {strokeDistribution.length > 0 && (
              <DashboardSection
                title="Stroke Composition Summary"
                subtitle={`${timeframeLabel} total distance by stroke type.`}
              >
                <KpiGrid columns={4}>
                  <Card className="kpi-focus-card swim-kpi p-6 text-center" style={{ borderTop: `4px solid ${SWIM_STROKE_COLORS.Freestyle}` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Freestyle</p>
                    <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatSwimDistance(strokes.freestyle, unitSystem)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{distanceLabels.summaryDistance}</p>
                    <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>{getStrokePercent(strokes.freestyle || 0)} of total</p>
                  </Card>
                  <Card className="kpi-focus-card swim-kpi p-6 text-center" style={{ borderTop: `4px solid ${SWIM_STROKE_COLORS.Backstroke}` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Backstroke</p>
                    <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatSwimDistance(strokes.backstroke, unitSystem)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{distanceLabels.summaryDistance}</p>
                    <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>{getStrokePercent(strokes.backstroke || 0)} of total</p>
                  </Card>
                  <Card className="kpi-focus-card swim-kpi p-6 text-center" style={{ borderTop: `4px solid ${SWIM_STROKE_COLORS.Breaststroke}` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Breaststroke</p>
                    <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatSwimDistance(strokes.breaststroke, unitSystem)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{distanceLabels.summaryDistance}</p>
                    <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>{getStrokePercent(strokes.breaststroke || 0)} of total</p>
                  </Card>
                  <Card className="kpi-focus-card swim-kpi p-6 text-center" style={{ borderTop: `4px solid ${SWIM_STROKE_COLORS.Butterfly}` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Butterfly</p>
                    <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatSwimDistance(strokes.butterfly, unitSystem)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{distanceLabels.summaryDistance}</p>
                    <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>{getStrokePercent(strokes.butterfly || 0)} of total</p>
                  </Card>
                </KpiGrid>
                <div className="mt-6">
                  {isMobile ? (
                    <Card className="p-6">
                      <div className="mb-5 grid grid-cols-1 gap-3">
                        {strokeChartData.map((stroke) => (
                          <div
                            key={stroke.stroke}
                            className="flex items-center justify-between rounded-xl border px-4 py-3"
                            style={{ borderColor: 'var(--border-soft)', backgroundColor: '#f8fbff' }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: stroke.color }}
                                aria-hidden="true"
                              />
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {stroke.stroke}
                              </p>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {getStrokePercent(stroke.yards)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <DonutChartPanel
                        data={strokeChartData}
                        nameKey="stroke"
                        dataKey="yards"
                        height={320}
                        showLegend={false}
                        wrapInPanel={false}
                        valueFormatter={(value) => `${formatSwimDistance(value, unitSystem)} ${distanceLabels.summaryDistance}`}
                        tooltipFormatter={(value, name, item) => {
                          const percent = getStrokePercent(item?.payload?.yards || 0);
                          return [`${formatSwimDistance(value, unitSystem)} ${distanceLabels.summaryDistance} (${percent})`, name];
                        }}
                        label={false}
                        labelLine={false}
                      />
                    </Card>
                  ) : (
                    <DonutChartPanel
                      data={strokeChartData}
                      nameKey="stroke"
                      dataKey="yards"
                      height={420}
                      showLegend={false}
                      valueFormatter={(value) => `${formatSwimDistance(value, unitSystem)} ${distanceLabels.summaryDistance}`}
                      tooltipFormatter={(value, name, item) => {
                        const percent = getStrokePercent(item?.payload?.yards || 0);
                        return [`${formatSwimDistance(value, unitSystem)} ${distanceLabels.summaryDistance} (${percent})`, name];
                      }}
                      label={renderStrokeDonutLabel}
                      labelLine={false}
                    />
                  )}
                </div>
              </DashboardSection>
            )}
          </>
        )}
    </DashboardLayout>
  );
}
