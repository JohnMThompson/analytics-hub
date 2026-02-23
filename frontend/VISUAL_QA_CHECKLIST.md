# Dashboard Visual QA Checklist

Use this checklist before shipping dashboard visual updates.

## Consistency
- Dashboard uses shared shell (`DashboardLayout`) and section primitives.
- Typography matches tokenized title/section/body scales.
- Panel styling (radius, border, elevation, spacing) is consistent across dashboards.
- KPI/BAN cards use shared variants and semantic state classes.

## Chart Quality
- Supported chart types are available and readable: line, bar, column, pie, donut.
- Axes, legends, and tooltips use shared defaults.
- Charts show meaningful empty states when no data is present.
- Color mapping is consistent with dashboard theme tokens.

## Table Quality
- Table headers, row density, and zebra striping follow shared component styles.
- Numeric columns are right-aligned where appropriate.
- Empty table states are visible and informative.

## Accessibility
- Color contrast remains readable for text, links, and badges.
- Page includes one clear H1 and hierarchical section headings.
- Interactive elements have visible focus styles.
- Layout remains usable at mobile and desktop widths.
