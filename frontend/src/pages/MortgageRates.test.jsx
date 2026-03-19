import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardSection } from '../components/shared';
import { formatLastUpdatedDate } from './MortgageRates';

describe('formatLastUpdatedDate', () => {
  test('formats valid timestamps for the current rates subtitle', () => {
    expect(formatLastUpdatedDate('2026-03-18T15:30:00')).toBe('March 18, 2026');
  });

  test('returns an empty string for missing or invalid timestamps', () => {
    expect(formatLastUpdatedDate(null)).toBe('');
    expect(formatLastUpdatedDate('not-a-date')).toBe('');
  });
});

describe('DashboardSection header composition for mortgage controls', () => {
  test('renders subtitle text before the right-side date range control', () => {
    const html = renderToStaticMarkup(
      <DashboardSection
        title="Historical Trend"
        subtitle="Last 12 months"
        right={(
          <div>
            <label htmlFor="mortgage-date-range">Date Range</label>
            <select id="mortgage-date-range">
              <option>Last 12 months</option>
            </select>
          </div>
        )}
      >
        <div>Chart content</div>
      </DashboardSection>,
    );

    expect(html).toContain('Historical Trend');
    expect(html).toContain('Last 12 months');
    expect(html).toContain('Date Range');
    expect(html.indexOf('Last 12 months')).toBeLessThan(html.indexOf('Date Range'));
  });
});
