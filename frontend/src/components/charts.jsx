import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartPanel } from './shared';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #dbe5f0',
  borderRadius: '10px',
  color: '#0f172a',
};

function EmptyChartState({ emptyMessage }) {
  return (
    <ChartPanel className="flex h-[360px] items-center justify-center">
      <p style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
    </ChartPanel>
  );
}

function getSeriesColor(seriesColor, idx) {
  return seriesColor || CHART_COLORS[idx % CHART_COLORS.length];
}

export function LineChartPanel({
  data = [],
  xKey,
  lines = [],
  height = 360,
  yDomain = ['auto', 'auto'],
  emptyMessage = 'No chart data available.',
  valueFormatter = (value) => value,
  labelFormatter = (label) => label,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChartState emptyMessage={emptyMessage} />;
  }

  return (
    <ChartPanel>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe5f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#475569' }} />
          <YAxis domain={yDomain} tick={{ fontSize: 12, fill: '#475569' }} />
          <Tooltip contentStyle={tooltipStyle} formatter={valueFormatter} labelFormatter={labelFormatter} />
          <Legend />
          {lines.map((line, idx) => (
            <Line
              key={line.dataKey}
              type={line.type || 'monotone'}
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={getSeriesColor(line.color, idx)}
              dot={line.dot || false}
              strokeWidth={line.strokeWidth || 2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function ColumnChartPanel({
  data = [],
  xKey,
  bars = [],
  height = 360,
  xAxisInterval = 'preserveStartEnd',
  yDomain = ['auto', 'auto'],
  xTickFormatter = undefined,
  yTickFormatter = undefined,
  emptyMessage = 'No chart data available.',
  valueFormatter = (value) => value,
  labelFormatter = (label) => label,
  showLegend = true,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChartState emptyMessage={emptyMessage} />;
  }

  return (
    <ChartPanel>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe5f0" />
          <XAxis
            dataKey={xKey}
            interval={xAxisInterval}
            tick={{ fontSize: 12, fill: '#475569' }}
            tickFormatter={xTickFormatter}
          />
          <YAxis domain={yDomain} tick={{ fontSize: 12, fill: '#475569' }} tickFormatter={yTickFormatter} />
          <Tooltip contentStyle={tooltipStyle} formatter={valueFormatter} labelFormatter={labelFormatter} />
          {showLegend && <Legend />}
          {bars.map((bar, idx) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={getSeriesColor(bar.color, idx)}
              stackId={bar.stackId}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function BarChartPanel({
  data = [],
  xKey,
  yKey,
  barKey,
  barName,
  height = 360,
  yAxisWidth = 100,
  hideXAxis = false,
  showBarValueLabels = false,
  showLegend = true,
  chartRightMargin = 56,
  emptyMessage = 'No chart data available.',
  valueFormatter = (value) => value,
  labelFormatter = (label) => label,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChartState emptyMessage={emptyMessage} />;
  }

  return (
    <ChartPanel>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: showBarValueLabels ? chartRightMargin : 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe5f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#475569' }}
            hide={hideXAxis}
            axisLine={!hideXAxis}
            tickLine={!hideXAxis}
          />
          <YAxis
            dataKey={yKey || xKey}
            type="category"
            tick={{ fontSize: 12, fill: '#475569' }}
            width={yAxisWidth}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={valueFormatter} labelFormatter={labelFormatter} />
          {showLegend && <Legend />}
          <Bar dataKey={barKey} name={barName || barKey} fill="var(--chart-2)" radius={[0, 6, 6, 0]}>
            {showBarValueLabels && (
              <LabelList
                dataKey={barKey}
                position="right"
                formatter={(value) => valueFormatter(value)}
                style={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function PieChartPanel({
  data = [],
  dataKey,
  nameKey,
  height = 360,
  emptyMessage = 'No chart data available.',
  valueFormatter = (value) => value,
  tooltipFormatter = null,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChartState emptyMessage={emptyMessage} />;
  }

  return (
    <ChartPanel>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter || valueFormatter} />
          <Legend />
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} outerRadius={110}>
            {data.map((entry, idx) => (
              <Cell key={`${entry[nameKey]}-${idx}`} fill={getSeriesColor(entry.color, idx)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function DonutChartPanel({
  data = [],
  dataKey,
  nameKey,
  height = 360,
  emptyMessage = 'No chart data available.',
  valueFormatter = (value) => value,
  tooltipFormatter = null,
  label = false,
  labelLine = true,
  showLegend = true,
  wrapInPanel = true,
  panelClassName = '',
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChartState emptyMessage={emptyMessage} />;
  }

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter || valueFormatter} />
        {showLegend && <Legend />}
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={60}
          outerRadius={110}
          label={label}
          labelLine={labelLine}
        >
          {data.map((entry, idx) => (
            <Cell key={`${entry[nameKey]}-${idx}`} fill={getSeriesColor(entry.color, idx)} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );

  if (!wrapInPanel) {
    return chartContent;
  }

  return (
    <ChartPanel className={panelClassName}>
      {chartContent}
    </ChartPanel>
  );
}

export default {
  LineChartPanel,
  ColumnChartPanel,
  BarChartPanel,
  PieChartPanel,
  DonutChartPanel,
};
