import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  LoadingSpinner,
  ErrorAlert,
  DashboardSection,
  MetricCard,
  Card,
} from '../components/shared';
import { LineChartPanel } from '../components/charts';
import { formatDecimal } from '../utils/formatters';

export default function HomeOfficeTemperature() {
  const [temperatureUnit, setTemperatureUnit] = useState('F');
  const [currentConditions, setCurrentConditions] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemperatureData();
  }, []);

  useEffect(() => {
    document.title = 'Home Office Temperature | AI Analytics';
  }, []);

  const fetchTemperatureData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [current, trend] = await Promise.all([
        apiClient.getDashboardEndpoint('home_office_temperature', 'current_conditions'),
        apiClient.getDashboardEndpoint('home_office_temperature', 'temperature_trend', { all_time: true }),
      ]);

      setCurrentConditions(current || {});
      setTrendData(Array.isArray(trend) ? trend : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const isCelsius = temperatureUnit === 'C';
  const displayedTemperature = currentConditions?.temperature_f === undefined
    ? '—'
    : isCelsius
      ? `${formatDecimal(((currentConditions.temperature_f - 32) * 5) / 9, 2)}°C`
      : `${formatDecimal(currentConditions.temperature_f, 2)}°F`;
  const trendDataWithUnit = trendData.map((row) => ({
    ...row,
    avg_temperature_display: row?.avg_temperature_f === null || row?.avg_temperature_f === undefined
      ? null
      : isCelsius
        ? ((row.avg_temperature_f - 32) * 5) / 9
        : row.avg_temperature_f,
  }));

  return (
    <DashboardLayout
      title="Home Office Temperature"
      subtitle="Data gathered by a DHT22 sensor on a Raspberry Pi 4B. The temperature is sensed once per minute, however the sensor burned out on April 21st and the project was concluded."
      controls={(
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Temperature Unit</span>
              <div className="inline-flex overflow-hidden rounded-md border" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  type="button"
                  className="focus-ring px-3 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: isCelsius ? '#fff' : 'var(--accent-50)',
                    color: isCelsius ? 'var(--text-secondary)' : 'var(--accent-700)',
                  }}
                  onClick={() => setTemperatureUnit('F')}
                >
                  °F
                </button>
                <button
                  type="button"
                  className="focus-ring px-3 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: isCelsius ? 'var(--accent-50)' : '#fff',
                    color: isCelsius ? 'var(--accent-700)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setTemperatureUnit('C')}
                >
                  °C
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    >
      {error && <ErrorAlert error={error} onRetry={fetchTemperatureData} />}

      <DashboardSection title="Current Conditions">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MetricCard
            label="Temperature"
            value={displayedTemperature}
            variant="emphasis"
          />
          <MetricCard
            label="Humidity"
            value={currentConditions?.humidity === undefined ? '—' : `${formatDecimal(currentConditions.humidity, 2)}%`}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Temperature and Humidity Trends"
        subtitle="Hourly average readings"
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {isCelsius ? 'Temperature (°C)' : 'Temperature (°F)'}
            </h3>
            <LineChartPanel
              data={trendDataWithUnit}
              xKey="period_start"
              lines={[
                { dataKey: 'avg_temperature_display', name: isCelsius ? 'Temperature (°C)' : 'Temperature (°F)', color: 'var(--chart-1)' },
              ]}
              height={360}
              emptyMessage="No temperature data available for this period."
              valueFormatter={(value) => {
                if (value === null || value === undefined) return 'N/A';
                return isCelsius ? `${value.toFixed(2)}°C` : `${value.toFixed(2)}°F`;
              }}
              labelFormatter={(label) => `Period: ${label}`}
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Humidity (%)</h3>
            <LineChartPanel
              data={trendData}
              xKey="period_start"
              lines={[
                { dataKey: 'avg_humidity', name: 'Humidity (%)', color: 'var(--chart-2)' },
              ]}
              height={360}
              emptyMessage="No humidity data available for this period."
              valueFormatter={(value) => {
                if (value === null || value === undefined) return 'N/A';
                return `${value.toFixed(2)}%`;
              }}
              labelFormatter={(label) => `Period: ${label}`}
            />
          </div>
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
