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
  Card,
  DashboardSection,
  KpiGrid,
  DataTablePanel,
} from '../components/shared';
import { ColumnChartPanel } from '../components/charts';
import DataTable from '../components/table';
import { formatDecimal, formatInteger, formatSignedNumber } from '../utils/formatters';

export default function HalloweenTracking() {
  const [summary, setSummary] = useState(null);
  const [yearlyCounts, setYearlyCounts] = useState([]);
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

      const [summaryData, yearlyData] = await Promise.all([
        apiClient.getDashboardEndpoint('halloween_tracking', 'summary'),
        apiClient.getDashboardEndpoint('halloween_tracking', 'yearly_counts'),
      ]);

      setSummary(summaryData);
      setYearlyCounts(Array.isArray(yearlyData) ? yearlyData : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const chartData = yearlyCounts.map((entry) => ({
    ...entry,
    year_label: String(entry.year),
  }));

  const tableColumns = [
    { key: 'year', header: 'Year' },
    { key: 'count', header: 'Trick-or-Treaters', align: 'right', tone: 'primary', render: (row) => formatInteger(row.count) },
  ];

  return (
    <DashboardLayout
      title="Halloween Tracking"
      subtitle="Year-over-year trick-or-treater counts"
      themeClass="theme-halloween"
      controls={(
        <Card className="mb-6 p-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Source table: <span style={{ color: 'var(--text-primary)' }}>halloween.halloween_tracking</span>
          </p>
        </Card>
      )}
    >
      {error && <ErrorAlert error={error} onRetry={fetchData} />}

      {summary && (
        <DashboardSection title="Overview">
          <KpiGrid columns={4}>
            <MetricCard label="Years Tracked" value={formatInteger(summary.years_tracked)} />
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

      <DashboardSection title="Trend">
        <ColumnChartPanel
          data={chartData}
          xKey="year_label"
          bars={[{ dataKey: 'count', name: 'Trick-or-Treaters', color: 'var(--chart-1)' }]}
          yDomain={[0, 'auto']}
          height={420}
          valueFormatter={(value) => formatInteger(value)}
          labelFormatter={(label) => `Year: ${label}`}
          emptyMessage="No yearly halloween data available."
        />
      </DashboardSection>

      <DashboardSection title="Yearly Counts">
        <DataTablePanel>
          <DataTable
            columns={tableColumns}
            rows={[...yearlyCounts].sort((a, b) => (b.year || 0) - (a.year || 0))}
            rowKey={(row) => String(row.year)}
            emptyMessage="No halloween yearly count records available."
          />
        </DataTablePanel>
      </DashboardSection>
    </DashboardLayout>
  );
}

