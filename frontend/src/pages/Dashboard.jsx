/**
 * Dashboard Page Wrapper
 * Routes to specific dashboard implementations based on dashboardId
 */

import { useParams, Link } from 'react-router-dom';
import MortgageRates from './MortgageRates';
import SwimTracking from './SwimTracking';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card } from '../components/shared';

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
      <DashboardLayout title="Dashboard Not Found" subtitle="The requested dashboard route does not exist.">
        <Card className="p-6 text-center">
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              The dashboard "{dashboardId}" is not available.
          </p>
          <Link to="/" className="dashboard-link focus-ring">
            View available dashboards
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return <DashboardComponent />;
}
