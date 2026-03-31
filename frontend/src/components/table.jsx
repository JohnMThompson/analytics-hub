/**
 * Reusable dashboard data table.
 */

import { useId, useState } from 'react';
import { downloadTableAsCsv, downloadTableAsExcel } from '../utils/tableExport';

export function resolveExportFormat(choice) {
  const normalized = String(choice || '').trim().toLowerCase();
  if (normalized === 'csv') return 'csv';
  if (normalized === 'xls' || normalized === 'excel') return 'xls';
  return null;
}

export function resolveExportRows(rows = [], exportConfig = null) {
  return Array.isArray(exportConfig?.rows) ? exportConfig.rows : rows;
}

export function TableExportButton({ columns = [], rows = [], exportConfig = null, className = '' }) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('csv');
  const exportSelectId = useId();
  const exportFileName = exportConfig?.fileName || 'table-export';
  const exportSheetName = exportConfig?.sheetName || 'Sheet1';
  const exportRows = resolveExportRows(rows, exportConfig);

  if (exportConfig?.enabled === false) {
    return null;
  }

  const handleExportConfirm = () => {
    const format = resolveExportFormat(selectedExportFormat);
    if (!format) return;

    if (format === 'csv') {
      downloadTableAsCsv({ columns, rows: exportRows, fileName: exportFileName });
    } else {
      downloadTableAsExcel({ columns, rows: exportRows, fileName: exportFileName, sheetName: exportSheetName });
    }

    setIsExportDialogOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`focus-ring inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${className}`}
        style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
        onClick={() => setIsExportDialogOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="mr-2 h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.29a1 1 0 1 1 1.4 1.41l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.41L11 12.59V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
        </svg>
        Export
      </button>
      {isExportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-5 shadow-xl"
            style={{
              borderColor: 'var(--border-soft)',
              backgroundColor: 'var(--bg-panel)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${exportSelectId}-title`}
          >
            <h3 id={`${exportSelectId}-title`} className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Export Table
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose a file format for this table export.
            </p>
            <div className="mt-4">
              <label
                htmlFor={exportSelectId}
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--text-muted)' }}
              >
                File format
              </label>
              <select
                id={exportSelectId}
                className="focus-ring w-full rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)', backgroundColor: '#fff' }}
                value={selectedExportFormat}
                onChange={(event) => setSelectedExportFormat(event.target.value)}
              >
                <option value="csv">CSV (.csv)</option>
                <option value="xls">Excel-compatible (.xls)</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="focus-ring rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                onClick={() => setIsExportDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="focus-ring rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}
                onClick={handleExportConfirm}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  emptyMessage = 'No rows available.',
  striped = true,
  hover = true,
  exportConfig = null,
  footerContent = null,
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  const showExportActions = exportConfig?.enabled !== false;

  return (
    <div className="space-y-4">
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
              className={`${striped && idx % 2 === 0 ? 'bg-slate-50/60' : ''} ${hover ? 'hover:bg-slate-100/70 transition-colors' : ''} ${idx === rows.length - 1 ? '' : 'border-b'}`}
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
      {footerContent && (
        <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {footerContent}
          </div>
        </div>
      )}
      {showExportActions && (
        <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex flex-wrap items-center justify-end">
            <TableExportButton columns={columns} rows={rows} exportConfig={exportConfig} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
