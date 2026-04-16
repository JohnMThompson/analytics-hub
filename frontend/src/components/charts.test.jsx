import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

vi.mock('recharts', () => {
  const createWrapper = (tag) => {
    const Wrapper = ({ children }) => React.createElement(tag, null, children);
    Wrapper.displayName = tag;
    return Wrapper;
  };

  return {
    ResponsiveContainer: createWrapper('responsive-container'),
    BarChart: createWrapper('bar-chart'),
    Bar: createWrapper('bar'),
    CartesianGrid: createWrapper('cartesian-grid'),
    Cell: createWrapper('cell'),
    Legend: createWrapper('legend'),
    Line: createWrapper('line'),
    LineChart: createWrapper('line-chart'),
    LabelList: createWrapper('label-list'),
    Pie: createWrapper('pie'),
    PieChart: createWrapper('pie-chart'),
    XAxis: createWrapper('x-axis'),
    YAxis: createWrapper('y-axis'),
    Tooltip: ({ children, content, isAnimationActive = true, ...props }) => React.createElement(
      'tooltip',
      { 'data-animation-active': String(isAnimationActive), ...props },
      children || content,
    ),
  };
});

import {
  BarChartPanel,
  ColumnChartPanel,
  DonutChartPanel,
  LineChartPanel,
  PieChartPanel,
  renderColumnTooltipContent,
  shouldRenderColumnTooltip,
} from './charts';

describe('chart wrappers', () => {
  test('render consistent empty state for line and column charts', () => {
    const lineHtml = renderToStaticMarkup(
      <LineChartPanel data={[]} xKey="date" lines={[]} emptyMessage="No line data" />,
    );
    expect(lineHtml).toContain('No line data');

    const columnHtml = renderToStaticMarkup(
      <ColumnChartPanel data={[]} xKey="date" bars={[]} emptyMessage="No column data" />,
    );
    expect(columnHtml).toContain('No column data');
  });

  test('render consistent empty state for bar, pie, and donut charts', () => {
    const barHtml = renderToStaticMarkup(
      <BarChartPanel data={[]} yKey="stroke" barKey="yards" emptyMessage="No bar data" />,
    );
    expect(barHtml).toContain('No bar data');

    const pieHtml = renderToStaticMarkup(
      <PieChartPanel data={[]} dataKey="yards" nameKey="stroke" emptyMessage="No pie data" />,
    );
    expect(pieHtml).toContain('No pie data');

    const donutHtml = renderToStaticMarkup(
      <DonutChartPanel data={[]} dataKey="yards" nameKey="stroke" emptyMessage="No donut data" />,
    );
    expect(donutHtml).toContain('No donut data');
  });

  test('render column tooltips by default when payload is present', () => {
    const payload = [{ payload: { date: '2026-04-01', workout_count: 0, total_yards: 0 } }];

    expect(shouldRenderColumnTooltip(payload)).toBe(true);
  });

  test('respect the optional column tooltip visibility predicate', () => {
    const workoutPayload = [{ payload: { date: '2026-04-01', workout_count: 1, total_yards: 0 } }];
    const emptyPayload = [{ payload: { date: '2026-04-02', workout_count: 0, total_yards: 0 } }];
    const predicate = (entry) => entry.workout_count > 0;

    expect(shouldRenderColumnTooltip(workoutPayload, predicate)).toBe(true);
    expect(shouldRenderColumnTooltip(emptyPayload, predicate)).toBe(false);
  });

  test('render the default column tooltip content when no custom renderer is supplied', () => {
    const html = renderToStaticMarkup(renderColumnTooltipContent({
      active: true,
      label: '2026-04-01',
      valueFormatter: (value) => `${value} yards`,
      labelFormatter: (label) => `Date: ${label}`,
      payload: [{
        dataKey: 'total_yards',
        name: 'Distance',
        value: 1200,
        color: '#123456',
        payload: { date: '2026-04-01', workout_count: 1, total_yards: 1200 },
      }],
    }));

    expect(html).toContain('Date: 2026-04-01');
    expect(html).toContain('Distance: 1200 yards');
  });

  test('keep tooltip animation enabled by default for column charts', () => {
    const html = renderToStaticMarkup(
      <ColumnChartPanel
        data={[{ date: '2026-04-01', total_yards: 1200 }]}
        xKey="date"
        bars={[{ dataKey: 'total_yards', name: 'Distance' }]}
      />,
    );

    expect(html).toContain('data-animation-active="true"');
  });

  test('allow column charts to disable tooltip animation explicitly', () => {
    const html = renderToStaticMarkup(
      <ColumnChartPanel
        data={[{ date: '2026-04-01', total_yards: 1200 }]}
        xKey="date"
        bars={[{ dataKey: 'total_yards', name: 'Distance' }]}
        tooltipAnimationActive={false}
      />,
    );

    expect(html).toContain('data-animation-active="false"');
  });

  test('allow a custom column tooltip renderer', () => {
    const html = renderToStaticMarkup(renderColumnTooltipContent({
      active: true,
      label: '2026-04-01',
      payload: [{
        dataKey: 'total_yards',
        name: 'Distance',
        value: 1200,
        color: '#123456',
        payload: { date: '2026-04-01', workout_count: 1, total_yards: 1200 },
      }],
      customTooltipContent: ({ label, items }) => <section>{label}:{items[0].value}</section>,
    }));

    expect(html).toContain('2026-04-01:1200');
  });
});
