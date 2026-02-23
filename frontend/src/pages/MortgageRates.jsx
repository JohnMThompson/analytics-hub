/**
 * Mortgage Rates Dashboard
 * Displays current mortgage rates, historical trends, and comparisons
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
} from '../components/shared';

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
              <Card className="p-6 border-t-4 border-blue-600">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>30-Year Fixed</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {currentRate.effective_rate_30yr?.toFixed(3)}%
                  </p>
                  <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {currentRate.points_30yr ? `${currentRate.points_30yr} pts` : 'No points'}
                  </span>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Listed rate: {currentRate.rate_30yr?.toFixed(3)}%
                </p>
                {currentRate.source && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Source: {currentRate.source}</p>
                )}
                {currentRate.timestamp && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Updated: {new Date(currentRate.timestamp).toLocaleString()}
                  </p>
                )}
              </Card>

              <Card className="p-6 border-t-4 border-green-600">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>7/1 ARM</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {currentRate.effective_rate_7arm?.toFixed(3)}%
                  </p>
                  <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {currentRate.points_7arm ? `${currentRate.points_7arm} pts` : 'No points'}
                  </span>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Listed rate: {currentRate.rate_7arm?.toFixed(3)}%
                </p>
                {currentRate.source && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Source: {currentRate.source}</p>
                )}
                {currentRate.timestamp && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Updated: {new Date(currentRate.timestamp).toLocaleString()}
                  </p>
                )}
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
                value={comparison.current_rate?.toFixed(3)}
                unit="%"
              />
              <MetricCard
                label="7 Days Ago"
                value={comparison.previous_rate?.toFixed(3)}
                unit="%"
              />
              <MetricCard
                label="Change"
                value={Math.abs(comparison.change || 0).toFixed(3)}
                unit="%"
                change={comparison.change}
                trend={getTrendDirection(comparison.change)}
              />
            </KpiGrid>
          </DashboardSection>
        )}

        {/* Historical Chart Section */}
        {historicalData.length > 0 && (
          <DashboardSection title="1-Year Historical Trend">
            <ChartPanel>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval={Math.floor(historicalData.length / 6)}
                  />
                  <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    formatter={(value) => value ? `${value.toFixed(3)}%` : 'N/A'}
                    labelFormatter={(date) => `Date: ${date}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="effective_rate_30yr"
                    stroke="#1e40af"
                    name="30-Year Fixed"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="effective_rate_7arm"
                    stroke="#16a34a"
                    name="7/1 ARM"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          </DashboardSection>
        )}

        {/* Statistics Section */}
        {statistics && (
          <DashboardSection title="1-Year Statistics">
            <KpiGrid columns={4}>
              <MetricCard
                label="Minimum"
                value={statistics.min?.toFixed(3)}
                unit="%"
              />
              <MetricCard
                label="Maximum"
                value={statistics.max?.toFixed(3)}
                unit="%"
              />
              <MetricCard
                label="Average"
                value={statistics.average?.toFixed(3)}
                unit="%"
              />
              <MetricCard
                label="Std Deviation"
                value={statistics.std_dev?.toFixed(4)}
                unit="%"
              />
            </KpiGrid>
          </DashboardSection>
        )}
    </DashboardLayout>
  );
}
