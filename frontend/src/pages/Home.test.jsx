import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardCardContent, getDashboardAccentColor, HOME_PAGE_TITLE, sortDashboardsByPreferredOrder } from './Home';
import { setDocumentTitle } from '../utils/pageTitle';

describe('sortDashboardsByPreferredOrder', () => {
  test('orders known dashboards and appends unknown dashboards at the end', () => {
    const input = [
      { id: 'home_office_temperature', title: 'Home Office Temperature' },
      { id: 'new_dashboard', title: 'New Dashboard' },
      { id: 'dakota_concert_calendar', title: 'Dakota Concert Calendar' },
      { id: 'halloween_tracking', title: 'Halloween Tracking' },
      { id: 'swim_tracking', title: 'Swim Tracking' },
      { id: 'mortgage_rates', title: 'Mortgage Rates' },
    ];

    const sorted = sortDashboardsByPreferredOrder(input);
    expect(sorted.map((item) => item.id)).toEqual([
      'mortgage_rates',
      'swim_tracking',
      'dakota_concert_calendar',
      'halloween_tracking',
      'home_office_temperature',
      'new_dashboard',
    ]);
  });
});

describe('getDashboardAccentColor', () => {
  test('prefers known landing accent map and falls back to API accent for unknown dashboards', () => {
    expect(getDashboardAccentColor({ id: 'halloween_tracking', colors: {} })).toBe('#ea580c');
    expect(getDashboardAccentColor({ id: 'swim_tracking', colors: { accent: '#123456' } })).toBe('#2563eb');
    expect(getDashboardAccentColor({ id: 'dakota_concert_calendar', colors: { accent: '#123456' } })).toBe('#00AEEF');
    expect(getDashboardAccentColor({ id: 'custom', colors: { accent: '#123456' } })).toBe('#123456');
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

describe('HOME_PAGE_TITLE', () => {
  test('matches the browser tab title without the app suffix', () => {
    expect(HOME_PAGE_TITLE).toBe('Analytics and Reporting Hub');
  });

  test('can be applied through the shared title helper', () => {
    global.document = { title: '' };

    setDocumentTitle(HOME_PAGE_TITLE);

    expect(global.document.title).toBe('Analytics and Reporting Hub');
    delete global.document;
  });
});
