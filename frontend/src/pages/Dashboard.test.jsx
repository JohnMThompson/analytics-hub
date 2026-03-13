import { describe, expect, test } from 'vitest';
import { DASHBOARD_NOT_FOUND_TITLE, dashboardComponents, dashboardTitles, getDashboardTitle } from './Dashboard';
import { setDocumentTitle } from '../utils/pageTitle';

describe('dashboardComponents', () => {
  test('includes dakota concert calendar route mapping', () => {
    expect(dashboardComponents.dakota_concert_calendar).toBeTruthy();
  });
});

describe('getDashboardTitle', () => {
  test('returns the page title for a known dashboard route without the app suffix', () => {
    expect(getDashboardTitle('mortgage_rates')).toBe('Mortgage Rates');
    expect(dashboardTitles.mortgage_rates).toBe('Mortgage Rates');
  });

  test('returns the not-found title for an unknown dashboard route without the app suffix', () => {
    expect(getDashboardTitle('not_real')).toBe(DASHBOARD_NOT_FOUND_TITLE);
  });

  test('can be applied through the shared title helper', () => {
    global.document = { title: '' };

    setDocumentTitle(getDashboardTitle('mortgage_rates'));
    expect(global.document.title).toBe('Mortgage Rates');

    setDocumentTitle(getDashboardTitle('not_real'));
    expect(global.document.title).toBe('Dashboard Not Found');

    delete global.document;
  });
});
