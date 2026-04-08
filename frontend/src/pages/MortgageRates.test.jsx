import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardSection, MetricCard } from '../components/shared';
import { CURRENT_ARM_LABEL, formatLastUpdatedDate, MORTGAGE_SERIES, RATE_COMPARISON_LABELS } from './MortgageRates';

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

describe('MORTGAGE_SERIES', () => {
  test('uses the new ARM label for the current-rate card', () => {
    expect(CURRENT_ARM_LABEL).toBe('7/6 ARM');
  });

  test('uses the new ARM label in rate comparison cards', () => {
    expect(RATE_COMPARISON_LABELS).toEqual({
      fixed30: '30-Year Fixed',
      arm76: '7/6 ARM',
    });
  });

  test('includes both ARM products on trend charts', () => {
    expect(MORTGAGE_SERIES).toEqual([
      { dataKey: 'effective_rate_30yr', name: '30-Year Fixed', color: 'var(--chart-1)' },
      { dataKey: 'effective_rate_71arm', name: '7/1 ARM', color: 'var(--chart-2)' },
      { dataKey: 'effective_rate_76arm', name: '7/6 ARM', color: 'var(--chart-3)' },
    ]);
  });
});

describe('Rate comparison card composition', () => {
  test('can render both mortgage products within a shared card', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        label="30-Day Change"
        details={[
          { label: RATE_COMPARISON_LABELS.fixed30, value: '+0.125%', state: 'negative' },
          { label: RATE_COMPARISON_LABELS.arm76, value: '—', state: 'neutral' },
        ]}
      />,
    );

    expect(html).toContain('30-Day Change');
    expect(html).toContain('30-Year Fixed');
    expect(html).toContain('+0.125%');
    expect(html).toContain('7/6 ARM');
  });
});
