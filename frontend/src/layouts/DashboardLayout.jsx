/**
 * Dashboard Layout Component
 * Wrapper for all dashboard pages
 */

import { Link, useLocation } from 'react-router-dom';

export function DashboardLayout({
  children,
  title,
  subtitle = '',
  backTo = '/',
  backLabel = 'Back To Analytics and Reporting Hub',
  themeClass = 'theme-default',
  controls = null,
}) {
  const location = useLocation();
  const year = new Date().getFullYear();
  const compactMode = new URLSearchParams(location.search).get('thumbnail') === '1';

  return (
    <div className={`dashboard-shell ${themeClass}`}>
      {!compactMode && (
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <div>
              <h1 className="dashboard-title">{title}</h1>
              {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
            </div>
            <Link to={backTo} className="dashboard-link focus-ring inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>{backLabel}</span>
            </Link>
          </div>
        </header>
      )}
      <main className={compactMode ? 'dashboard-content dashboard-content-compact' : 'dashboard-content'}>
        {controls}
        {children}
      </main>
      {!compactMode && (
        <footer className="dashboard-footer">
          <p>© {year} John Thompson</p>
        </footer>
      )}
    </div>
  );
}

export default DashboardLayout;
