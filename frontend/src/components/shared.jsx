/**
 * Loading Spinner Component
 * Shows while data is loading
 */

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * Error Alert Component
 * Shows error messages
 */
export function ErrorAlert({ error, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
      <p className="text-sm text-red-700 mt-1">{error?.message || 'An unknown error occurred'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {children}
    </div>
  );
}

/**
 * Metric Card Component
 * Displays a single metric with label
 */
export function MetricCard({ label, value, unit = '', change = null, trend = null }) {
  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      <div className="flex items-baseline">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {unit && <span className="text-lg text-gray-600 ml-2">{unit}</span>}
      </div>
      {change !== null && (
        <p className={`text-sm mt-2 ${changeColor}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {Math.abs(change).toFixed(2)}% from previous
        </p>
      )}
    </Card>
  );
}

export default { LoadingSpinner, ErrorAlert, Card, MetricCard };
