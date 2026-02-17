/**
 * Dashboard Page Wrapper
 * Routes to specific dashboard implementations based on dashboardId
 */

import { useParams, Link } from 'react-router-dom';
import MortgageRates from './MortgageRates';
import SwimTracking from './SwimTracking';
import { LoadingSpinner } from '../components/shared';

// Map dashboard IDs to their components
const dashboardComponents = {
  mortgage_rates: MortgageRates,
  swim_tracking: SwimTracking,
};

export default function Dashboard() {
  const { dashboardId } = useParams();
  
  const DashboardComponent = dashboardComponents[dashboardId];

  if (!DashboardComponent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Not Found</h1>
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              Back to Home
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">
              The dashboard "{dashboardId}" is not available.
            </p>
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              View available dashboards
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <DashboardComponent />;
}
