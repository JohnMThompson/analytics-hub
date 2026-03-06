/**
 * Dashboard Page Wrapper
 * Routes to specific dashboard implementations based on dashboardId
 */

import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import MortgageRates from './MortgageRates';
import SwimTracking from './SwimTracking';
import HomeOfficeTemperature from './HomeOfficeTemperature';
import HalloweenTracking from './HalloweenTracking';
import DakotaConcertCalendar from './DakotaConcertCalendar';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card } from '../components/shared';

// Map dashboard IDs to their components
export const dashboardComponents = {
  mortgage_rates: MortgageRates,
  swim_tracking: SwimTracking,
  home_office_temperature: HomeOfficeTemperature,
  halloween_tracking: HalloweenTracking,
  dakota_concert_calendar: DakotaConcertCalendar,
};

export default function Dashboard() {
  const { dashboardId } = useParams();
  
  const DashboardComponent = dashboardComponents[dashboardId];

  useEffect(() => {
    if (!DashboardComponent) {
      document.title = 'Dashboard Not Found | AI Analytics';
    }
  }, [DashboardComponent]);

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
