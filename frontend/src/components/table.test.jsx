import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DataTable, { resolveExportFormat } from './table';

describe('DataTable', () => {
  test('renders headers and row values', () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'yards', header: 'Yards', tone: 'primary', align: 'right' },
    ];
    const rows = [{ id: 1, name: 'Freestyle', yards: 1200 }];

    const html = renderToStaticMarkup(<DataTable columns={columns} rows={rows} rowKey="id" />);

    expect(html).toContain('Name');
    expect(html).toContain('Yards');
    expect(html).toContain('Freestyle');
    expect(html).toContain('1200');
  });

  test('renders empty state when no rows exist', () => {
    const html = renderToStaticMarkup(<DataTable columns={[]} rows={[]} emptyMessage="No workouts yet." />);

    expect(html).toContain('No workouts yet.');
  });

  test('applies header className when provided', () => {
    const columns = [
      { key: 'description', header: 'Description', headerClassName: 'print-hide-column' },
    ];
    const rows = [{ id: 1, description: 'Details' }];

    const html = renderToStaticMarkup(<DataTable columns={columns} rows={rows} rowKey="id" />);

    expect(html).toContain('print-hide-column');
  });

  test('renders a single export action when export config is enabled', () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const rows = [{ id: 1, name: 'Dakota Jazz' }];

    const html = renderToStaticMarkup(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        exportConfig={{ fileName: 'concerts', sheetName: 'Concerts' }}
      />,
    );

    expect(html).toContain('Export');
  });

  test('does not render the export dialog before the user opens it', () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const rows = [{ id: 1, name: 'Dakota Jazz' }];

    const html = renderToStaticMarkup(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        exportConfig={{ fileName: 'concerts', sheetName: 'Concerts' }}
      />,
    );

    expect(html).not.toContain('Export Table');
    expect(html).not.toContain('CSV (.csv)');
  });

  test('normalizes supported export prompt values', () => {
    expect(resolveExportFormat('csv')).toBe('csv');
    expect(resolveExportFormat('CSV')).toBe('csv');
    expect(resolveExportFormat('xls')).toBe('xls');
    expect(resolveExportFormat('excel')).toBe('xls');
    expect(resolveExportFormat('')).toBeNull();
  });
});
