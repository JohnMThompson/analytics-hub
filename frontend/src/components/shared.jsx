/**
 * Loading Spinner Component
 * Shows while data is loading
 */

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div
        className="animate-spin rounded-full h-12 w-12 border-b-2"
        style={{ borderColor: 'var(--accent-600)' }}
      ></div>
    </div>
  );
}

/**
 * Error Alert Component
 * Shows error messages
 */
export function ErrorAlert({ error, onRetry }) {
  return (
    <div className="dashboard-panel mb-4 bg-rose-50 border-rose-200">
      <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
      <p className="text-sm text-red-700 mt-1">{error?.message || 'An unknown error occurred'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 text-white rounded text-sm focus-ring"
          style={{ backgroundColor: 'var(--accent-600)' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Card Component
 * Reusable card container
 */
export function Card({ children, className = '' }) {
  return <div className={`dashboard-panel ${className}`}>{children}</div>;
}

export function DashboardSection({ title, subtitle = '', right = null, children, className = '' }) {
  return (
    <section className={`dashboard-section ${className}`}>
      {(title || right || subtitle) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="dashboard-section-title mb-1">{title}</h2>}
            {subtitle && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function KpiGrid({ children, columns = 4, className = '' }) {
  const columnClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }[columns] || 'md:grid-cols-4';

  return <div className={`grid grid-cols-1 ${columnClass} gap-6 ${className}`}>{children}</div>;
}

export function ChartPanel({ children, className = '' }) {
  return <Card className={`p-6 ${className}`}>{children}</Card>;
}

export function DataTablePanel({ children, className = '' }) {
  return <Card className={`p-6 overflow-x-auto ${className}`}>{children}</Card>;
}

/**
 * Metric Card Component
 * Displays a single metric with label
 */
export function MetricCard({ label, value, unit = '', change = null, trend = null }) {
  const changeClass = change > 0 ? 'status-positive' : change < 0 ? 'status-negative' : 'status-neutral';
  
  return (
    <Card className="p-6">
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {unit && <span className="text-lg ml-2" style={{ color: 'var(--text-secondary)' }}>{unit}</span>}
      </div>
      {change !== null && (
        <p className={`text-sm mt-2 ${changeClass}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {Math.abs(change).toFixed(2)}% from previous
        </p>
      )}
    </Card>
  );
}

export default {
  LoadingSpinner,
  ErrorAlert,
  Card,
  DashboardSection,
  KpiGrid,
  ChartPanel,
  DataTablePanel,
  MetricCard,
};
