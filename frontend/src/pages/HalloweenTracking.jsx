/**
 * Halloween Tracking Dashboard
 * Displays yearly trick-or-treater counts.
 */

import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  LoadingSpinner,
  ErrorAlert,
  MetricCard,
  DashboardSection,
  KpiGrid,
} from '../components/shared';
import { BarChartPanel, ColumnChartPanel, LineChartPanel } from '../components/charts';
import { formatDecimal, formatInteger, formatSignedNumber } from '../utils/formatters';

export default function HalloweenTracking() {
  const [summary, setSummary] = useState(null);
  const [yearlyCounts, setYearlyCounts] = useState([]);
  const [cumulativeByMinute, setCumulativeByMinute] = useState({ years: [], points: [] });
  const [quarterHourBreakdown, setQuarterHourBreakdown] = useState({ years: [], points: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.title = 'Halloween Tracking | AI Analytics';
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, yearlyData, cumulativeData, quarterHourData] = await Promise.all([
        apiClient.getDashboardEndpoint('halloween_tracking', 'summary'),
        apiClient.getDashboardEndpoint('halloween_tracking', 'yearly_counts'),
        apiClient.getDashboardEndpoint('halloween_tracking', 'cumulative_by_minute'),
        apiClient.getDashboardEndpoint('halloween_tracking', 'quarter_hour_breakdown'),
      ]);

      setSummary(summaryData);
      setYearlyCounts(Array.isArray(yearlyData) ? yearlyData : []);
      setCumulativeByMinute({
        years: Array.isArray(cumulativeData?.years) ? cumulativeData.years : [],
        points: Array.isArray(cumulativeData?.points) ? cumulativeData.points : [],
      });
      setQuarterHourBreakdown({
        years: Array.isArray(quarterHourData?.years) ? quarterHourData.years : [],
        points: Array.isArray(quarterHourData?.points) ? quarterHourData.points : [],
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const chartData = yearlyCounts.map((entry) => ({
    ...entry,
    year_label: String(entry.year || ''),
  }));
  const yearlyCountBars = [...chartData].sort((a, b) => (b.count || 0) - (a.count || 0));

  const cumulativeLines = cumulativeByMinute.years.map((year, idx) => ({
    dataKey: String(year),
    name: String(year),
    color: `var(--chart-${(idx % 5) + 1})`,
    dot: false,
    strokeWidth: 2.5,
    type: 'monotone',
  }));

  const quarterHourBars = quarterHourBreakdown.years.map((year, idx) => ({
    dataKey: String(year),
    name: String(year),
    color: `var(--chart-${(idx % 5) + 1})`,
    stackId: 'years',
  }));

  return (
    <DashboardLayout
      title="Halloween Tracking"
      subtitle="Year-over-year trick-or-treater counts"
      themeClass="theme-halloween"
    >
      {error && <ErrorAlert error={error} onRetry={fetchData} />}

      {summary && (
        <DashboardSection title="Overview">
          <KpiGrid columns={3}>
            <MetricCard label="Latest Year Count" value={summary.latest_count == null ? '—' : formatInteger(summary.latest_count)} secondary={summary.latest_year ? `Year ${summary.latest_year}` : ''} variant="emphasis" />
            <MetricCard label="Average per Year" value={formatDecimal(summary.average_per_year, 1)} />
            <MetricCard
              label="Year-over-Year Change"
              value={summary.yoy_change == null ? '—' : formatSignedNumber(summary.yoy_change)}
              secondary={summary.yoy_change_percent == null ? 'No prior year for comparison' : `${formatSignedNumber(summary.yoy_change_percent)}% vs prior year`}
              state={summary.yoy_change > 0 ? 'positive' : summary.yoy_change < 0 ? 'negative' : 'neutral'}
            />
          </KpiGrid>
        </DashboardSection>
      )}

      <DashboardSection title="Trick-or-treater by year">
        <BarChartPanel
          data={yearlyCountBars}
          xKey="year_label"
          yKey="year_label"
          barKey="count"
          barName="Trick-or-Treaters"
          height={420}
          yAxisWidth={80}
          hideXAxis={true}
          showBarValueLabels={true}
          showLegend={false}
          valueFormatter={(value) => formatInteger(value)}
          labelFormatter={(label) => `Year: ${label}`}
          emptyMessage="No yearly halloween data available."
        />
      </DashboardSection>

      <DashboardSection title="Cumulative Trick-or-Treaters by Minute">
        <LineChartPanel
          data={cumulativeByMinute.points}
          xKey="minute_label"
          lines={cumulativeLines}
          yDomain={[0, 'auto']}
          height={420}
          valueFormatter={(value) => formatInteger(value)}
          labelFormatter={(label) => `Time: ${label}`}
          emptyMessage="No minute-level cumulative data available."
        />
      </DashboardSection>

      <DashboardSection title="15-Minute Trick-or-Treater Increments">
        <ColumnChartPanel
          data={quarterHourBreakdown.points}
          xKey="bucket_label"
          bars={quarterHourBars}
          yDomain={[0, 'auto']}
          height={420}
          valueFormatter={(value) => formatInteger(value)}
          labelFormatter={(label) => `Time bucket: ${label}`}
          emptyMessage="No 15-minute bucket data available."
        />
      </DashboardSection>

    </DashboardLayout>
  );
}
