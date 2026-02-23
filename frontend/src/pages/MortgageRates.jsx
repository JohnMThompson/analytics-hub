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

export default function MortgageRates() {
  const [currentRate, setCurrentRate] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMortgageData();
  }, []);

  const fetchMortgageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [current, historical, comp, stats] = await Promise.all([
        apiClient.getDashboardEndpoint('mortgage_rates', 'current_rate'),
        apiClient.getDashboardEndpoint('mortgage_rates', 'historical_rates', { days: 365 }),
        apiClient.getDashboardEndpoint('mortgage_rates', 'rate_comparison', { days: 365 }),
        apiClient.getDashboardEndpoint('mortgage_rates', 'rate_statistics', { days: 365 }),
      ]);

      setCurrentRate(current);
      setHistoricalData(Array.isArray(historical) ? historical : []);
      setComparison(comp);
      setStatistics(stats);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

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

  const current30 = Number(currentRate?.effective_rate_30yr);
  const current7Arm = Number(currentRate?.effective_rate_7arm);
  const trend30 = getPreviousAndDelta(current30, 'effective_rate_30yr');
  const trend7Arm = getPreviousAndDelta(current7Arm, 'effective_rate_7arm');

  return (
    <DashboardLayout
      title="Mortgage Rates"
      subtitle="Current rates and 1-year historical trends"
      themeClass="theme-mortgage"
    >
        {error && (
          <ErrorAlert error={error} onRetry={fetchMortgageData} />
        )}

        {/* Current Rates Section */}
        {currentRate && (
          <DashboardSection title="Current Rates">
            <KpiGrid columns={2}>
              <Card className="border-t-4 border-cyan-600">
                <div className="min-h-[220px] flex flex-col items-center justify-between text-center">
                  <p className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-secondary)' }}>30-Year Fixed</p>
                  <p className="text-6xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                    {formatPercent(current30, 3)}
                  </p>
                  <div className="w-full rounded-xl border p-3" style={{ borderColor: 'var(--border-soft)', backgroundColor: 'var(--bg-muted)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Previous: {trend30.previous === null ? '—' : formatPercent(trend30.previous, 3)}
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${trend30.delta < 0 ? 'status-positive' : trend30.delta > 0 ? 'status-negative' : 'status-neutral'}`}>
                      Delta: {trend30.delta === null ? '—' : formatSignedPercent(trend30.delta, 3)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-t-4 border-teal-600">
                <div className="min-h-[220px] flex flex-col items-center justify-between text-center">
                  <p className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-secondary)' }}>7/1 ARM</p>
                  <p className="text-6xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                    {formatPercent(current7Arm, 3)}
                  </p>
                  <div className="w-full rounded-xl border p-3" style={{ borderColor: 'var(--border-soft)', backgroundColor: 'var(--bg-muted)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Previous: {trend7Arm.previous === null ? '—' : formatPercent(trend7Arm.previous, 3)}
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${trend7Arm.delta < 0 ? 'status-positive' : trend7Arm.delta > 0 ? 'status-negative' : 'status-neutral'}`}>
                      Delta: {trend7Arm.delta === null ? '—' : formatSignedPercent(trend7Arm.delta, 3)}
                    </p>
                  </div>
                </div>
              </Card>
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Comparison Section */}
        {comparison && (
          <DashboardSection title="Rate Comparison">
            <KpiGrid columns={3}>
              <MetricCard
                label="Current Rate"
                value={formatPercent(comparison.current_rate, 3)}
                variant="emphasis"
              />
              <MetricCard
                label="7 Days Ago"
                value={formatPercent(comparison.previous_rate, 3)}
              />
              <MetricCard
                label="Change"
                value={formatSignedPercent(comparison.change || 0, 3)}
                change={comparison.change}
                trend={getTrendDirection(comparison.change)}
                state={comparison.change > 0 ? 'negative' : comparison.change < 0 ? 'positive' : 'neutral'}
                secondary="Compared with prior 7-day snapshot"
              />
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Historical Chart Section */}
        {historicalData.length > 0 && (
          <DashboardSection title="1-Year Historical Trend">
            <LineChartPanel
              data={historicalData}
              xKey="date"
              lines={[
                { dataKey: 'effective_rate_30yr', name: '30-Year Fixed', color: 'var(--chart-1)' },
                { dataKey: 'effective_rate_7arm', name: '7/1 ARM', color: 'var(--chart-2)' },
              ]}
              height={400}
              valueFormatter={(value) => (value ? `${value.toFixed(3)}%` : 'N/A')}
              labelFormatter={(date) => `Date: ${date}`}
            />
          </DashboardSection>
        )}

        {/* Statistics Section */}
        {statistics && (
          <DashboardSection title="1-Year Statistics">
            <KpiGrid columns={4}>
              <MetricCard
                label="Minimum"
                value={formatPercent(statistics.min, 3)}
                variant="compact"
              />
              <MetricCard
                label="Maximum"
                value={formatPercent(statistics.max, 3)}
                variant="compact"
              />
              <MetricCard
                label="Average"
                value={formatPercent(statistics.average, 3)}
                variant="compact"
              />
              <MetricCard
                label="Std Deviation"
                value={formatPercent(statistics.std_dev, 4)}
                variant="compact"
              />
            </KpiGrid>
          </DashboardSection>
        )}
    </DashboardLayout>
  );
}
