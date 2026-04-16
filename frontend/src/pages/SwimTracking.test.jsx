import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildSwimDurationByDate,
  WORKOUTS_PAGE_SIZE,
  SwimDistanceTrendTooltipCard,
  SwimMobileWorkoutCard,
  buildRecentWorkoutColumns,
  convertMilesToKilometers,
  convertYardsToMeters,
  formatSwimChartDateTick,
  formatSwimDateTime,
  formatSwimDistance,
  formatSwimLongDistance,
  formatSwimTime,
  getSwimDistanceUnitLabels,
  paginateRecords,
  shouldAnimateSwimDistanceTrendTooltip,
  shouldShowSwimDistanceTrendTooltip,
  shouldUseSwimDistanceTrendCardTooltip,
  SWIM_UNIT_SYSTEMS,
} from './SwimTracking';

describe('formatSwimTime', () => {
  test('formats minutes into hours and minutes', () => {
    expect(formatSwimTime(95)).toBe('1h 35m');
  });
});

describe('formatSwimDateTime', () => {
  test('returns a localized date-time string without seconds', () => {
    const formatted = formatSwimDateTime('2026-03-28T10:30:45');

    expect(formatted).toContain('2026');
    expect(formatted).not.toContain(':45');
  });
});

describe('formatSwimChartDateTick', () => {
  test('abbreviates chart ticks for mobile', () => {
    expect(formatSwimChartDateTick('2026-03-28', true)).toBe('3/28');
  });

  test('returns expanded chart ticks for non-mobile display', () => {
    expect(formatSwimChartDateTick('2026-03-28', false)).toContain('Mar');
  });
});

describe('buildRecentWorkoutColumns', () => {
  test('keeps the expected recent workout table columns', () => {
    const columns = buildRecentWorkoutColumns();

    expect(columns.map((column) => column.key)).toEqual([
      'start_date_time',
      'duration',
      'location',
      'total_distance_yards',
      'comments',
    ]);
  });

  test('switches the distance column header for metric units', () => {
    const columns = buildRecentWorkoutColumns(SWIM_UNIT_SYSTEMS.METRIC);

    expect(columns[3].header).toBe('Distance (meters)');
  });
});

describe('unit conversion helpers', () => {
  test('converts yards to meters', () => {
    expect(convertYardsToMeters(100)).toBe(91.44);
  });

  test('converts miles to kilometers', () => {
    expect(convertMilesToKilometers(1)).toBe(1.609344);
  });

  test('returns the expected labels for imperial and metric units', () => {
    expect(getSwimDistanceUnitLabels(SWIM_UNIT_SYSTEMS.IMPERIAL).summaryDistance).toBe('yards');
    expect(getSwimDistanceUnitLabels(SWIM_UNIT_SYSTEMS.METRIC).summaryDistance).toBe('meters');
  });

  test('formats swim distances in imperial and metric units', () => {
    expect(formatSwimDistance(1000, SWIM_UNIT_SYSTEMS.IMPERIAL)).toBe('1,000');
    expect(formatSwimDistance(1000, SWIM_UNIT_SYSTEMS.METRIC)).toBe('914');
    expect(formatSwimLongDistance(1, SWIM_UNIT_SYSTEMS.IMPERIAL)).toBe('1');
    expect(formatSwimLongDistance(1, SWIM_UNIT_SYSTEMS.METRIC)).toBe('1.61');
  });
});

describe('paginateRecords', () => {
  test('returns the first 50 workouts on the first page', () => {
    const records = Array.from({ length: 75 }, (_, index) => ({ id: index + 1 }));

    const result = paginateRecords(records, 1, WORKOUTS_PAGE_SIZE);

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(2);
    expect(result.pageRows).toHaveLength(50);
    expect(result.pageRows[0].id).toBe(1);
    expect(result.pageRows.at(-1).id).toBe(50);
  });

  test('returns the remaining workouts on the second page', () => {
    const records = Array.from({ length: 75 }, (_, index) => ({ id: index + 1 }));

    const result = paginateRecords(records, 2, WORKOUTS_PAGE_SIZE);

    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.pageRows).toHaveLength(25);
    expect(result.pageRows[0].id).toBe(51);
    expect(result.pageRows.at(-1).id).toBe(75);
  });

  test('clamps an out-of-range page back to the first page after filter changes', () => {
    const records = Array.from({ length: 10 }, (_, index) => ({ id: index + 1 }));

    const result = paginateRecords(records, 4, WORKOUTS_PAGE_SIZE);

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.pageRows).toHaveLength(10);
  });
});

describe('buildSwimDurationByDate', () => {
  test('aggregates workout durations by workout date', () => {
    const totals = buildSwimDurationByDate([
      { start_date_time: '2026-03-28T06:00:00', duration: 45 },
      { start_date_time: '2026-03-28T18:00:00', duration: 30 },
      { start_date_time: '2026-03-29T09:15:00', duration: 60 },
    ]);

    expect(totals.get('2026-03-28')).toBe(75);
    expect(totals.get('2026-03-29')).toBe(60);
  });
});

describe('shouldShowSwimDistanceTrendTooltip', () => {
  test('shows the tooltip for days with workouts even when distance is zero', () => {
    expect(shouldShowSwimDistanceTrendTooltip({ workout_count: 1, total_yards: 0 })).toBe(true);
  });

  test('hides the tooltip for placeholder days without workouts', () => {
    expect(shouldShowSwimDistanceTrendTooltip({ workout_count: 0, total_yards: 0 })).toBe(false);
  });
});

describe('shouldUseSwimDistanceTrendCardTooltip', () => {
  test('enables the card tooltip on desktop', () => {
    expect(shouldUseSwimDistanceTrendCardTooltip(false)).toBe(true);
  });

  test('keeps the simple tooltip on mobile', () => {
    expect(shouldUseSwimDistanceTrendCardTooltip(true)).toBe(false);
  });
});

describe('shouldAnimateSwimDistanceTrendTooltip', () => {
  test('disables tooltip animation on desktop', () => {
    expect(shouldAnimateSwimDistanceTrendTooltip(false)).toBe(false);
  });

  test('keeps tooltip animation enabled on mobile', () => {
    expect(shouldAnimateSwimDistanceTrendTooltip(true)).toBe(true);
  });
});

describe('SwimDistanceTrendTooltipCard', () => {
  test('renders a desktop daily summary tooltip card in imperial units', () => {
    const html = renderToStaticMarkup(
      <SwimDistanceTrendTooltipCard
        label="2026-03-28"
        entry={{ workout_count: 2, total_yards: 2400, total_duration_minutes: 75 }}
      />,
    );

    expect(html).toContain('Workout Day');
    expect(html).toContain('2,400 yds');
    expect(html).toContain('1h 15m');
    expect(html).toContain('Mar');
  });

  test('renders a desktop daily summary tooltip card in metric units', () => {
    const html = renderToStaticMarkup(
      <SwimDistanceTrendTooltipCard
        label="2026-03-28"
        entry={{ workout_count: 1, total_yards: 1000, total_duration_minutes: 60 }}
        unitSystem={SWIM_UNIT_SYSTEMS.METRIC}
      />,
    );

    expect(html).toContain('914 m');
    expect(html).toContain('1h 0m');
  });
});

describe('SwimMobileWorkoutCard', () => {
  test('renders workout metadata and comments', () => {
    const row = {
      id: 4,
      start_date_time: '2026-03-28T10:30:00',
      duration: 75,
      total_distance_yards: 2400,
      location: 'Downtown YMCA',
      comments: 'Main set felt strong.',
    };

    const html = renderToStaticMarkup(<SwimMobileWorkoutCard row={row} />);

    expect(html).toContain('Workout');
    expect(html).toContain('Duration');
    expect(html).toContain('2,400 yds');
    expect(html).toContain('Main set felt strong.');
    expect(html).toContain('Location');
    expect(html).toContain('Downtown YMCA');
  });

  test('renders metric distance when requested', () => {
    const row = {
      id: 6,
      start_date_time: '2026-03-28T10:30:00',
      duration: 60,
      total_distance_yards: 1000,
      location: 'Downtown YMCA',
      comments: 'Technique day.',
    };

    const html = renderToStaticMarkup(<SwimMobileWorkoutCard row={row} unitSystem={SWIM_UNIT_SYSTEMS.METRIC} />);

    expect(html).toContain('914 m');
  });

  test('renders a placeholder when location and comments are absent', () => {
    const row = {
      id: 5,
      start_date_time: '2026-03-28T10:30:00',
      duration: 45,
      total_distance_yards: 1200,
      location: '',
      comments: '',
    };

    const html = renderToStaticMarkup(<SwimMobileWorkoutCard row={row} />);

    expect(html).toContain('Location');
    expect(html).toContain('—');
  });
});
