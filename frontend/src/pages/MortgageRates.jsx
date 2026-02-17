/**
 * Mortgage Rates Dashboard
 * Displays current mortgage rates, historical trends, and comparisons
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api';
import { LoadingSpinner, ErrorAlert, MetricCard, Card } from '../components/shared';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mortgage Rates</h1>
            <p className="text-gray-600 mt-1">Current rates and 1-year historical trends</p>
          </div>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Dashboards
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <ErrorAlert error={error} onRetry={fetchMortgageData} />
        )}

        {/* Current Rates Section */}
        {currentRate && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-t-4 border-blue-600">
                <p className="text-sm font-medium text-gray-600 mb-2">30-Year Fixed</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">
                    {currentRate.effective_rate_30yr?.toFixed(3)}%
                  </p>
                  <span className="text-sm text-gray-600 ml-2">
                    {currentRate.points_30yr ? `${currentRate.points_30yr} pts` : 'No points'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Listed rate: {currentRate.rate_30yr?.toFixed(3)}%
                </p>
                {currentRate.source && (
                  <p className="text-xs text-gray-500 mt-1">Source: {currentRate.source}</p>
                )}
                {currentRate.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(currentRate.timestamp).toLocaleString()}
                  </p>
                )}
              </Card>

              <Card className="p-6 border-t-4 border-green-600">
                <p className="text-sm font-medium text-gray-600 mb-2">7/1 ARM</p>
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-gray-900">
                    {currentRate.effective_rate_7arm?.toFixed(3)}%
                  </p>
                  <span className="text-sm text-gray-600 ml-2">
                    {currentRate.points_7arm ? `${currentRate.points_7arm} pts` : 'No points'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Listed rate: {currentRate.rate_7arm?.toFixed(3)}%
                </p>
                {currentRate.source && (
                  <p className="text-xs text-gray-500 mt-1">Source: {currentRate.source}</p>
                )}
                {currentRate.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(currentRate.timestamp).toLocaleString()}
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Comparison Section */}
        {comparison && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
          </div>
        )}

        {/* Historical Chart Section */}
        {historicalData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1-Year Historical Trend</h2>
            <Card className="p-6">
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
            </Card>
          </div>
        )}

        {/* Statistics Section */}
        {statistics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1-Year Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
