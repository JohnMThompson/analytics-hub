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

function formatTooltipValue(item, formatter) {
  if (typeof formatter !== 'function') {
    return { value: item?.value, name: item?.name };
  }

  const formatted = formatter(item?.value, item?.name, item, item?.payload);
  if (Array.isArray(formatted)) {
    return {
      value: formatted[0],
      name: formatted[1] ?? item?.name,
    };
  }

  return { value: formatted, name: item?.name };
}

export function shouldRenderColumnTooltip(payload, tooltipVisibilityPredicate = null) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return false;
  }

  if (typeof tooltipVisibilityPredicate !== 'function') {
    return true;
  }

  return Boolean(tooltipVisibilityPredicate(payload[0]?.payload, payload));
}

function DefaultColumnChartTooltipContent({ items, label, labelFormatter, valueFormatter }) {
  return (
    <div style={tooltipStyle}>
      <p className="m-0 px-3 pt-2 text-sm font-semibold" style={{ color: '#0f172a' }}>
        {typeof labelFormatter === 'function' ? labelFormatter(label) : label}
      </p>
      <div className="px-3 pb-2 pt-1">
        {items.map((item) => {
          const formatted = formatTooltipValue(item, valueFormatter);

          return (
            <p key={`${item.dataKey}-${item.name}`} className="m-0 text-sm" style={{ color: item.color || '#0f172a' }}>
              {formatted.name}: {formatted.value}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function renderColumnTooltipContent({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  tooltipVisibilityPredicate,
  customTooltipContent,
}) {
  if (!active || !shouldRenderColumnTooltip(payload, tooltipVisibilityPredicate)) {
    return null;
  }

  const items = payload.filter((item) => item && item.value !== null && item.value !== undefined);
  if (items.length === 0) {
    return null;
  }

  if (typeof customTooltipContent === 'function') {
    return customTooltipContent({
      items,
      label,
      valueFormatter,
      labelFormatter,
      payload,
    });
  }

  return (
    <DefaultColumnChartTooltipContent
      items={items}
      label={label}
      labelFormatter={labelFormatter}
      valueFormatter={valueFormatter}
    />
  );
}

function ColumnChartTooltipContent(props) {
  return renderColumnTooltipContent(props);
}

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
  tooltipVisibilityPredicate = null,
  customTooltipContent = null,
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
          <Tooltip
            content={(
              <ColumnChartTooltipContent
                valueFormatter={valueFormatter}
                labelFormatter={labelFormatter}
                tooltipVisibilityPredicate={tooltipVisibilityPredicate}
                customTooltipContent={customTooltipContent}
              />
            )}
          />
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
