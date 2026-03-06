import { describe, expect, test } from 'vitest';
import { DESCRIPTION_PREVIEW_CHARS, formatDateLong, truncateDescription } from './DakotaConcertCalendar';

describe('truncateDescription', () => {
  test('returns original text when under preview limit', () => {
    const result = truncateDescription('Short text');
    expect(result.text).toBe('Short text');
    expect(result.isTruncated).toBe(false);
  });

  test('truncates long text with ellipsis', () => {
    const input = 'x'.repeat(DESCRIPTION_PREVIEW_CHARS + 12);
    const result = truncateDescription(input);
    expect(result.isTruncated).toBe(true);
    expect(result.text.endsWith('...')).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(DESCRIPTION_PREVIEW_CHARS + 3);
  });
});

describe('formatDateLong', () => {
  test('formats yyyy-mm-dd to long us date', () => {
    expect(formatDateLong('2026-03-09')).toBe('March 9, 2026');
  });

  test('returns placeholder for empty values', () => {
    expect(formatDateLong('')).toBe('—');
  });
});
