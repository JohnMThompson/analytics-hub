import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DataTable from './table';

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
});
