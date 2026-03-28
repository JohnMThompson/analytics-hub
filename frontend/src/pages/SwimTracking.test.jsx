import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SwimMobileWorkoutCard,
  buildRecentWorkoutColumns,
  formatSwimChartDateTick,
  formatSwimDateTime,
  formatSwimTime,
} from './SwimTracking';

describe('formatSwimTime', () => {
  test('formats minutes into hours and minutes', () => {
    expect(formatSwimTime(95)).toBe('1h 35m');
  });
});

describe('formatSwimDateTime', () => {
  test('returns a localized date-time string', () => {
    expect(formatSwimDateTime('2026-03-28T10:30:00')).toContain('2026');
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
      'total_distance_yards',
      'comments',
    ]);
  });
});

describe('SwimMobileWorkoutCard', () => {
  test('renders workout metadata and comments', () => {
    const row = {
      id: 4,
      start_date_time: '2026-03-28T10:30:00',
      duration: 75,
      total_distance_yards: 2400,
      comments: 'Main set felt strong.',
    };

    const html = renderToStaticMarkup(<SwimMobileWorkoutCard row={row} />);

    expect(html).toContain('Workout');
    expect(html).toContain('Duration');
    expect(html).toContain('2,400 yds');
    expect(html).toContain('Main set felt strong.');
    expect(html).toContain('Included');
  });

  test('renders a placeholder when comments are absent', () => {
    const row = {
      id: 5,
      start_date_time: '2026-03-28T10:30:00',
      duration: 45,
      total_distance_yards: 1200,
      comments: '',
    };

    const html = renderToStaticMarkup(<SwimMobileWorkoutCard row={row} />);

    expect(html).toContain('None');
    expect(html).toContain('—');
  });
});
