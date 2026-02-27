import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  LoadingSpinner,
  ErrorAlert,
  DashboardSection,
  KpiGrid,
  MetricCard,
  Card,
} from '../components/shared';
import { LineChartPanel } from '../components/charts';
import { formatDecimal, formatInteger } from '../utils/formatters';

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last 12 months' },
  { value: 730, label: 'Last 24 months' },
];

export default function HomeOfficeTemperature() {
  const [selectedDays, setSelectedDays] = useState('all');
  const [currentConditions, setCurrentConditions] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemperatureData();
  }, [selectedDays]);

  useEffect(() => {
    document.title = 'Home Office Temperature | AI Analytics';
  }, []);

  const fetchTemperatureData = async () => {
    try {
      setLoading(true);
      setError(null);

      const isAllTime = selectedDays === 'all';
      const rangeParams = isAllTime ? { all_time: true } : { days: Number(selectedDays) };

      const [current, trend, stats] = await Promise.all([
        apiClient.getDashboardEndpoint('home_office_temperature', 'current_conditions'),
        apiClient.getDashboardEndpoint('home_office_temperature', 'temperature_trend', rangeParams),
        apiClient.getDashboardEndpoint('home_office_temperature', 'statistics', rangeParams),
      ]);

      setCurrentConditions(current || {});
      setTrendData(Array.isArray(trend) ? trend : []);
      setStatistics(stats || {});
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const timeframeLabel = DATE_RANGE_OPTIONS.find((option) => String(option.value) === String(selectedDays))?.label || `Last ${selectedDays} days`;
  const lastReading = currentConditions?.timestamp ? new Date(currentConditions.timestamp).toLocaleString() : '—';
  const roomName = currentConditions?.room || 'Home Office';

  return (
    <DashboardLayout
      title="Home Office Temperature"
      subtitle={`Temperature and humidity readings captured by Raspberry Pi sensor (${timeframeLabel})`}
      controls={(
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="temperature-date-range" className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Date Range
            </label>
            <select
              id="temperature-date-range"
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
        </Card>
      )}
    >
      {error && <ErrorAlert error={error} onRetry={fetchTemperatureData} />}

      <DashboardSection title="Current Conditions" subtitle={`${roomName} latest reading`}>
        <KpiGrid columns={4}>
          <MetricCard
            label="Temperature"
            value={currentConditions?.temperature_f === undefined ? '—' : `${formatDecimal(currentConditions.temperature_f, 2)}°F`}
            variant="emphasis"
          />
          <MetricCard
            label="Humidity"
            value={currentConditions?.humidity === undefined ? '—' : `${formatDecimal(currentConditions.humidity, 2)}%`}
          />
          <MetricCard
            label="Samples"
            value={formatInteger(statistics?.sample_count)}
          />
          <MetricCard
            label="Last Reading"
            value={lastReading}
            variant="compact"
          />
        </KpiGrid>
      </DashboardSection>

      <DashboardSection
        title="Temperature and Humidity Trend"
        subtitle={`${timeframeLabel} hourly average readings`}
      >
        <LineChartPanel
          data={trendData}
          xKey="period_start"
          lines={[
            { dataKey: 'avg_temperature_f', name: 'Temperature (°F)', color: 'var(--chart-1)' },
            { dataKey: 'avg_humidity', name: 'Humidity (%)', color: 'var(--chart-2)' },
          ]}
          height={420}
          emptyMessage="No temperature sensor data available for this period."
          valueFormatter={(value, name) => {
            if (value === null || value === undefined) return 'N/A';
            if (name?.includes('Humidity')) return `${value.toFixed(2)}%`;
            return `${value.toFixed(2)}°F`;
          }}
          labelFormatter={(label) => `Period: ${label}`}
        />
      </DashboardSection>
    </DashboardLayout>
  );
}
