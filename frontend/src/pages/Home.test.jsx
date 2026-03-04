import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardCardContent, sortDashboardsByPreferredOrder } from './Home';

describe('sortDashboardsByPreferredOrder', () => {
  test('orders known dashboards and appends unknown dashboards at the end', () => {
    const input = [
      { id: 'home_office_temperature', title: 'Home Office Temperature' },
      { id: 'new_dashboard', title: 'New Dashboard' },
      { id: 'halloween_tracking', title: 'Halloween Tracking' },
      { id: 'swim_tracking', title: 'Swim Tracking' },
      { id: 'mortgage_rates', title: 'Mortgage Rates' },
    ];

    const sorted = sortDashboardsByPreferredOrder(input);
    expect(sorted.map((item) => item.id)).toEqual([
      'mortgage_rates',
      'swim_tracking',
      'halloween_tracking',
      'home_office_temperature',
      'new_dashboard',
    ]);
  });
});

describe('DashboardCardContent', () => {
  test('does not render the View Dashboard badge text', () => {
    const html = renderToStaticMarkup(
      <DashboardCardContent
        dashboard={{ id: 'mortgage_rates', title: 'Mortgage Rates', description: 'Rates dashboard' }}
      />,
    );

    expect(html).not.toContain('View Dashboard');
  });

  test('renders a thumbnail container for each dashboard id', () => {
    const html = renderToStaticMarkup(
      <DashboardCardContent
        dashboard={{ id: 'swim_tracking', title: 'Swim Tracking', description: 'Swim dashboard' }}
      />,
    );

    expect(html).toContain('data-testid="dashboard-thumbnail-swim_tracking"');
  });

  test('includes thumbnail iframe src with thumbnail mode query param', () => {
    const html = renderToStaticMarkup(
      <DashboardCardContent
        dashboard={{ id: 'home_office_temperature', title: 'Home Office Temperature', description: 'Temp dashboard' }}
      />,
    );

    expect(html).toContain('src="/dashboard/home_office_temperature?thumbnail=1"');
  });

  test('renders decorative non-interactive iframe attributes', () => {
    const html = renderToStaticMarkup(
      <DashboardCardContent
        dashboard={{ id: 'halloween_tracking', title: 'Halloween Tracking', description: 'Candy dashboard' }}
      />,
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('pointer-events:none');
  });
});
