import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricCard } from './shared';

describe('MetricCard', () => {
  test('renders label and value', () => {
    const html = renderToStaticMarkup(<MetricCard label="Total Workouts" value="48" unit="sessions" />);

    expect(html).toContain('Total Workouts');
    expect(html).toContain('48');
    expect(html).toContain('sessions');
  });

  test('renders change indicator and secondary message', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        label="Rate Change"
        value="-0.12%"
        change={-0.12}
        trend="down"
        secondary="Compared to last week"
      />,
    );

    expect(html).toContain('from previous');
    expect(html).toContain('Compared to last week');
  });

  test('renders stacked detail rows when multiple values share a card', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        label="Current Rate"
        details={[
          { label: '30-Year Fixed', value: '6.125%' },
          { label: '7/6 ARM', value: '5.125%' },
        ]}
      />,
    );

    expect(html).toContain('Current Rate');
    expect(html).toContain('30-Year Fixed');
    expect(html).toContain('6.125%');
    expect(html).toContain('7/6 ARM');
    expect(html).toContain('5.125%');
  });
});
