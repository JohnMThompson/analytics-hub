/**
 * Reusable dashboard data table.
 */

export function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  emptyMessage = 'No rows available.',
  striped = true,
  hover = true,
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-slate-50" style={{ borderColor: 'var(--border-soft)' }}>
          {columns.map((column) => (
            <th
              key={column.key}
              className={`py-3 px-4 font-semibold tracking-tight ${column.align === 'right' ? 'text-right' : 'text-left'} ${column.headerClassName || ''}`}
              style={{ color: 'var(--text-primary)' }}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
            className={`${striped && idx % 2 === 0 ? 'bg-slate-50/60' : ''} ${hover ? 'hover:bg-slate-100/70 transition-colors' : ''} border-b`}
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {columns.map((column) => (
              <td
                key={`${typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}-${column.key}`}
                className={`py-3 px-4 ${column.align === 'right' ? 'text-right' : 'text-left'} ${column.className || ''}`}
                style={{
                  color: column.tone === 'primary'
                    ? 'var(--text-primary)'
                    : column.tone === 'muted'
                      ? 'var(--text-muted)'
                      : 'var(--text-secondary)',
                }}
              >
                {column.render ? column.render(row) : row[column.key] ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
