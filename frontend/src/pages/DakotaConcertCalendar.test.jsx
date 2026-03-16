import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  DakotaMobileEventCard,
  buildDakotaTableColumns,
  DESCRIPTION_PREVIEW_CHARS,
  formatDateLong,
  getDakotaDescriptionPreview,
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

describe('getDakotaDescriptionPreview', () => {
  test('uses the full description when already expanded', () => {
    const text = Array.from({ length: MOBILE_DESCRIPTION_PREVIEW_WORDS + 2 }, (_, i) => `word${i + 1}`).join(' ');
    const result = getDakotaDescriptionPreview(text, true, true);

    expect(result.text).toBe(text);
    expect(result.isTruncated).toBe(true);
  });

  test('uses word truncation for the mobile preview', () => {
    const text = Array.from({ length: MOBILE_DESCRIPTION_PREVIEW_WORDS + 3 }, (_, i) => `word${i + 1}`).join(' ');
    const result = getDakotaDescriptionPreview(text, false, true);

    expect(result.isTruncated).toBe(true);
    expect(result.text.endsWith('...')).toBe(true);
    expect(result.text.split(/\s+/).length).toBe(MOBILE_DESCRIPTION_PREVIEW_WORDS);
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

describe('DakotaMobileEventCard', () => {
  test('renders performer metadata and the mobile show more control', () => {
    const row = {
      id: 7,
      performer_name: 'Makaya McCraven',
      genre: 'Jazz',
      event_time: '7:00 PM',
      event_date: 'March 18, 2026',
      description_short: Array.from(
        { length: MOBILE_DESCRIPTION_PREVIEW_WORDS + 4 },
        (_, i) => `word${i + 1}`,
      ).join(' '),
    };

    const html = renderToStaticMarkup(
      <DakotaMobileEventCard row={row} expandedDescriptions={new Set()} toggleDescription={vi.fn()} />,
    );

    expect(html).toContain('Makaya McCraven');
    expect(html).toContain('Jazz');
    expect(html).toContain('7:00 PM');
    expect(html).toContain('March 18, 2026');
    expect(html).toContain('Show more');
  });

  test('renders the full description when the card is expanded', () => {
    const longDescription = Array.from(
      { length: MOBILE_DESCRIPTION_PREVIEW_WORDS + 5 },
      (_, i) => `word${i + 1}`,
    ).join(' ');

    const row = {
      id: 8,
      performer_name: 'Arooj Aftab',
      genre: 'Global',
      event_time: '9:30 PM',
      event_date: 'March 19, 2026',
      description_short: longDescription,
    };

    const html = renderToStaticMarkup(
      <DakotaMobileEventCard row={row} expandedDescriptions={new Set([8])} toggleDescription={vi.fn()} />,
    );

    expect(html).toContain(row.description_short);
    expect(html).toContain('Show less');
  });
});
