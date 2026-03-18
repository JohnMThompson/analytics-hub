import { describe, expect, test } from 'vitest';
import { buildCsvContent, buildExcelHtmlDocument, getExportMatrix } from './tableExport';

describe('getExportMatrix', () => {
  test('uses explicit export values when provided', () => {
    const columns = [
      { key: 'start_date_time', header: 'Date & Time', exportValue: (row) => `formatted:${row.start_date_time}` },
      { key: 'yards', header: 'Yards' },
    ];
    const rows = [{ start_date_time: '2026-03-18T07:00:00', yards: 1200 }];

    expect(getExportMatrix(columns, rows)).toEqual([
      ['Date & Time', 'Yards'],
      ['formatted:2026-03-18T07:00:00', '1200'],
    ]);
  });

  test('omits non-exportable columns', () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'actions', header: 'Actions', exportable: false },
    ];
    const rows = [{ name: 'Makaya McCraven', actions: 'hidden' }];

    expect(getExportMatrix(columns, rows)).toEqual([
      ['Name'],
      ['Makaya McCraven'],
    ]);
  });
});

describe('buildCsvContent', () => {
  test('quotes cells and escapes embedded quotes', () => {
    const columns = [{ key: 'description', header: 'Description' }];
    const rows = [{ description: 'He said "hello"' }];

    expect(buildCsvContent(columns, rows)).toBe('"Description"\r\n"He said ""hello"""');
  });
});

describe('buildExcelHtmlDocument', () => {
  test('creates an excel-compatible html table document', () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const rows = [{ name: 'Export row' }];
    const document = buildExcelHtmlDocument(columns, rows, 'Sheet A');

    expect(document).toContain('<table>');
    expect(document).toContain('<th>Name</th>');
    expect(document).toContain('<td>Export row</td>');
    expect(document).toContain('<title>Sheet A</title>');
  });
});
