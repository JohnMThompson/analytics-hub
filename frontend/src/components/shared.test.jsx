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
});
