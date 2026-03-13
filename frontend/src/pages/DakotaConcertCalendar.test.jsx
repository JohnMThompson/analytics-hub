import { describe, expect, test } from 'vitest';
import {
  buildDakotaTableColumns,
  DESCRIPTION_PREVIEW_CHARS,
  formatDateLong,
  truncateDescription,
  truncateDescriptionByWords,
  MOBILE_DESCRIPTION_PREVIEW_WORDS,
} from './DakotaConcertCalendar';

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

describe('truncateDescriptionByWords', () => {
  test('returns original text when under word limit', () => {
    const text = 'one two three';
    const result = truncateDescriptionByWords(text, MOBILE_DESCRIPTION_PREVIEW_WORDS);
    expect(result.text).toBe(text);
    expect(result.isTruncated).toBe(false);
  });

  test('truncates long text to requested word count with ellipsis', () => {
    const text = Array.from({ length: MOBILE_DESCRIPTION_PREVIEW_WORDS + 7 }, (_, i) => `word${i + 1}`).join(' ');
    const result = truncateDescriptionByWords(text, MOBILE_DESCRIPTION_PREVIEW_WORDS);
    expect(result.isTruncated).toBe(true);
    expect(result.text.endsWith('...')).toBe(true);
    expect(result.text.split(/\s+/).length).toBe(MOBILE_DESCRIPTION_PREVIEW_WORDS);
  });

  test('handles empty text values', () => {
    const result = truncateDescriptionByWords('');
    expect(result.text).toBe('');
    expect(result.isTruncated).toBe(false);
  });
});

describe('buildDakotaTableColumns', () => {
  test('uses mobile-friendly classes without fixed minimum widths', () => {
    const columns = buildDakotaTableColumns(new Set(), () => {});
    const dateColumn = columns.find((column) => column.key === 'event_date');
    const timeColumn = columns.find((column) => column.key === 'event_time');
    const performerColumn = columns.find((column) => column.key === 'performer_name');
    const descriptionColumn = columns.find((column) => column.key === 'description_short');

    expect(dateColumn.className).toContain('whitespace-nowrap');
    expect(dateColumn.className).toContain('text-xs');
    expect(dateColumn.className).not.toContain('min-w-');

    expect(timeColumn.className).toContain('whitespace-nowrap');
    expect(timeColumn.className).not.toContain('min-w-');

    expect(performerColumn.className).toContain('whitespace-normal');
    expect(performerColumn.className).toContain('break-words');

    expect(descriptionColumn.className).toContain('print-hide-column');
    expect(descriptionColumn.className).toContain('hidden');
    expect(descriptionColumn.className).toContain('sm:table-cell');
  });
});
