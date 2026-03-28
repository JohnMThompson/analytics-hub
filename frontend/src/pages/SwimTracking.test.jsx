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
