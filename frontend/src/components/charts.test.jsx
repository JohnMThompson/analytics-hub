import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BarChartPanel,
  ColumnChartPanel,
  DonutChartPanel,
  LineChartPanel,
  PieChartPanel,
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
});
