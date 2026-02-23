/**
 * Dashboard Layout Component
 * Wrapper for all dashboard pages
 */

import { Link } from 'react-router-dom';

export function DashboardLayout({
  children,
  title,
  subtitle = '',
  backTo = '/',
  backLabel = 'Back to Dashboards',
  themeClass = 'theme-default',
  controls = null,
}) {
  return (
    <div className={`dashboard-shell ${themeClass}`}>
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <h1 className="dashboard-title">{title}</h1>
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
          <Link to={backTo} className="dashboard-link focus-ring">
            {backLabel}
          </Link>
        </div>
      </header>
      <main className="dashboard-content">
        {controls}
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
