/**
 * Mortgage Rates Dashboard
 * Displays current mortgage rates, historical trends, and comparisons
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
} from '../components/shared';
import { LineChartPanel } from '../components/charts';
import { formatPercent, formatSignedPercent } from '../utils/formatters';

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last 12 months' },
  { value: 730, label: 'Last 24 months' },
];

export function formatLastUpdatedDate(timestamp) {
  if (!timestamp) return '';

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) return '';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MortgageRates() {
  const [selectedDays, setSelectedDays] = useState('365');
  const [currentRate, setCurrentRate] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [currentLoading, setCurrentLoading] = useState(true);
  const [historicalLoading, setHistoricalLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentRate();
  }, []);

  useEffect(() => {
    fetchHistoricalData();
  }, [selectedDays]);

  const fetchCurrentRate = async () => {
    try {
      setCurrentLoading(true);
      setError(null);

      const current = await apiClient.getDashboardEndpoint('mortgage_rates', 'current_rate');
      setCurrentRate(current);
    } catch (err) {
      setError(err);
    } finally {
      setCurrentLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      setHistoricalLoading(true);
      setError(null);

      const isAllTime = selectedDays === 'all';
      const rangeParams = isAllTime ? { all_time: true } : { days: Number(selectedDays) };

      const [historical, weekly] = await Promise.all([
        apiClient.getDashboardEndpoint('mortgage_rates', 'historical_rates', rangeParams),
        apiClient.getDashboardEndpoint('mortgage_rates', 'weekly_rates', rangeParams),
      ]);

      setHistoricalData(Array.isArray(historical) ? historical : []);
      setWeeklyData(Array.isArray(weekly) ? weekly : []);
    } catch (err) {
      setError(err);
    } finally {
      setHistoricalLoading(false);
    }
  };

  const isInitialLoading = currentLoading || historicalLoading;

  if (isInitialLoading && !currentRate && historicalData.length === 0 && weeklyData.length === 0) {
    return <LoadingSpinner />;
  }

  const getTrendDirection = (change) => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return null;
  };

  const getPreviousAndDelta = (currentValue, key) => {
    if (!Array.isArray(historicalData) || historicalData.length < 2 || !Number.isFinite(currentValue)) {
      return { previous: null, delta: null };
    }

    const numericHistory = historicalData
      .map((item) => Number(item?.[key]))
      .filter((value) => Number.isFinite(value));

    if (numericHistory.length < 2) return { previous: null, delta: null };

    const previous = numericHistory[numericHistory.length - 2];
    return { previous, delta: currentValue - previous };
  };

  const getRateDeltaFromDaysAgo = (key, daysAgo) => {
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      return { previous: null, delta: null };
    }

    const latestPoint = historicalData[historicalData.length - 1];
    const latestDate = latestPoint?.date ? new Date(latestPoint.date) : new Date();
    const targetDate = new Date(latestDate);
    targetDate.setDate(targetDate.getDate() - daysAgo);

    let closestPoint = null;
    let closestDiff = Number.POSITIVE_INFINITY;

    historicalData.forEach((point) => {
      if (!point?.date) return;
      const pointDate = new Date(point.date);
      const diff = Math.abs(pointDate.getTime() - targetDate.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPoint = point;
      }
    });

    const current = Number(latestPoint?.[key]);
    const previous = Number(closestPoint?.[key]);
    if (!Number.isFinite(current) || !Number.isFinite(previous)) {
      return { previous: null, delta: null };
    }

    return { previous, delta: current - previous };
  };

  const current30 = Number(currentRate?.effective_rate_30yr);
  const current7Arm = Number(currentRate?.effective_rate_7arm);
  const trend30 = getPreviousAndDelta(current30, 'effective_rate_30yr');
  const trend7Arm = getPreviousAndDelta(current7Arm, 'effective_rate_7arm');
  const thirtyDayComparison = getRateDeltaFromDaysAgo('effective_rate_30yr', 30);
  const timeframeLabel = DATE_RANGE_OPTIONS.find((option) => String(option.value) === String(selectedDays))?.label || `Last ${selectedDays} days`;
  const lastUpdatedDate = formatLastUpdatedDate(currentRate?.timestamp);
  const currentRatesSubtitle = lastUpdatedDate ? `Last updated: ${lastUpdatedDate}` : '';
  const historicalTrendControls = (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="mortgage-date-range" className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        Date Range
      </label>
      <select
        id="mortgage-date-range"
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
    </div>
  );

  return (
    <DashboardLayout
      title="Mortgage Rates"
      subtitle={`Current rates and historical trends (${timeframeLabel})`}
      themeClass="theme-mortgage"
    >
        {error && (
          <ErrorAlert
            error={error}
            onRetry={() => {
              fetchCurrentRate();
              fetchHistoricalData();
            }}
          />
        )}

        {/* Current Rates Section */}
        {currentRate && (
          <DashboardSection title="Current Rates" subtitle={currentRatesSubtitle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="kpi-focus-card p-0">
                <div className="min-h-[240px] flex flex-col text-center">
                  <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>30-Year Fixed</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <p className="text-7xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                      {formatPercent(current30, 3)}
                    </p>
                    <div className="mt-6 w-full max-w-xs rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border-soft)', backgroundColor: '#f8fbff' }}>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Previous: {trend30.previous === null ? '—' : formatPercent(trend30.previous, 3)}
                      </p>
                      <p className={`text-sm font-semibold mt-1 ${trend30.delta < 0 ? 'status-positive' : trend30.delta > 0 ? 'status-negative' : 'status-neutral'}`}>
                        Delta: {trend30.delta === null ? '—' : formatSignedPercent(trend30.delta, 3)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="kpi-focus-card p-0">
                <div className="min-h-[240px] flex flex-col text-center">
                  <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>7/1 ARM</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <p className="text-7xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                      {formatPercent(current7Arm, 3)}
                    </p>
                    <div className="mt-6 w-full max-w-xs rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border-soft)', backgroundColor: '#f8fbff' }}>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Previous: {trend7Arm.previous === null ? '—' : formatPercent(trend7Arm.previous, 3)}
                      </p>
                      <p className={`text-sm font-semibold mt-1 ${trend7Arm.delta < 0 ? 'status-positive' : trend7Arm.delta > 0 ? 'status-negative' : 'status-neutral'}`}>
                        Delta: {trend7Arm.delta === null ? '—' : formatSignedPercent(trend7Arm.delta, 3)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </DashboardSection>
        )}

        {/* Comparison Section */}
        {currentRate && (
          <DashboardSection title="Rate Comparison">
            <KpiGrid columns={3}>
              <MetricCard
                label="Current Rate"
                value={formatPercent(current30, 3)}
                variant="emphasis"
              />
              <MetricCard
                label="30 Days Ago"
                value={thirtyDayComparison.previous === null ? '—' : formatPercent(thirtyDayComparison.previous, 3)}
              />
              <MetricCard
                label="30-Day Change"
                value={thirtyDayComparison.delta === null ? '—' : formatSignedPercent(thirtyDayComparison.delta, 3)}
                change={thirtyDayComparison.delta}
                trend={getTrendDirection(thirtyDayComparison.delta)}
                changeSuffix="from 30d ago"
                state={thirtyDayComparison.delta > 0 ? 'negative' : thirtyDayComparison.delta < 0 ? 'positive' : 'neutral'}
                secondary={`30d ago: ${thirtyDayComparison.previous === null ? '—' : formatPercent(thirtyDayComparison.previous, 3)}`}
              />
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Historical Chart Section */}
        {(weeklyData.length > 0 || historicalData.length > 0) && (
          <DashboardSection title="Historical Trend" subtitle={timeframeLabel} right={historicalTrendControls}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h3 className="mb-3 text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Daily</h3>
                <LineChartPanel
                  data={historicalData}
                  xKey="date"
                  yDomain={[5.0, 'auto']}
                  lines={[
                    { dataKey: 'effective_rate_30yr', name: '30-Year Fixed', color: 'var(--chart-1)' },
                    { dataKey: 'effective_rate_7arm', name: '7/1 ARM', color: 'var(--chart-2)' },
                  ]}
                  height={400}
                  emptyMessage="No daily trend data available."
                  valueFormatter={(value) => (value ? `${value.toFixed(3)}%` : 'N/A')}
                  labelFormatter={(date) => `Date: ${date}`}
                />
              </div>
              <div>
                <h3 className="mb-3 text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Weekly Average</h3>
                <LineChartPanel
                  data={weeklyData}
                  xKey="week_start"
                  yDomain={[5.0, 'auto']}
                  lines={[
                    { dataKey: 'effective_rate_30yr', name: '30-Year Fixed', color: 'var(--chart-1)' },
                    { dataKey: 'effective_rate_7arm', name: '7/1 ARM', color: 'var(--chart-2)' },
                  ]}
                  height={400}
                  emptyMessage="No weekly trend data available."
                  valueFormatter={(value) => (value ? `${value.toFixed(3)}%` : 'N/A')}
                  labelFormatter={(date) => `Week Start: ${date}`}
                />
              </div>
            </div>
          </DashboardSection>
        )}

    </DashboardLayout>
  );
}
