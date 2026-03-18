function getExportColumns(columns = []) {
  return columns
    .filter((column) => column?.exportable !== false)
    .map((column) => ({
      key: column.key,
      header: String(column.exportHeader || column.header || column.key || ''),
      getValue: (row) => {
        if (typeof column.exportValue === 'function') {
          return column.exportValue(row);
        }

        const value = row?.[column.exportKey || column.key];
        return value ?? '';
      },
    }));
}

export function getExportMatrix(columns = [], rows = []) {
  const exportColumns = getExportColumns(columns);
  const headerRow = exportColumns.map((column) => column.header);
  const dataRows = rows.map((row) => exportColumns.map((column) => normalizeExportValue(column.getValue(row))));

  return [headerRow, ...dataRows];
}

export function normalizeExportValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function buildCsvContent(columns = [], rows = []) {
  const matrix = getExportMatrix(columns, rows);

  return matrix
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');
}

export function buildExcelHtmlDocument(columns = [], rows = [], sheetName = 'Sheet1') {
  const matrix = getExportMatrix(columns, rows);
  const escapedSheetName = escapeHtml(sheetName);
  const tableRows = matrix
    .map((row, rowIndex) => {
      const cellTag = rowIndex === 0 ? 'th' : 'td';
      const cells = row.map((cell) => `<${cellTag}>${escapeHtml(cell)}</${cellTag}>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="UTF-8" />
    <meta name="ProgId" content="Excel.Sheet" />
    <meta name="Generator" content="Analytics Hub" />
    <title>${escapedSheetName}</title>
  </head>
  <body>
    <table>${tableRows}</table>
  </body>
</html>`;
}

export function downloadTableAsCsv({ columns = [], rows = [], fileName = 'table-export' }) {
  const content = buildCsvContent(columns, rows);
  downloadTextFile(`${fileName}.csv`, content, 'text/csv;charset=utf-8;');
}

export function downloadTableAsExcel({ columns = [], rows = [], fileName = 'table-export', sheetName = 'Sheet1' }) {
  const content = buildExcelHtmlDocument(columns, rows, sheetName);
  downloadTextFile(`${fileName}.xls`, content, 'application/vnd.ms-excel;charset=utf-8;');
}

function downloadTextFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const normalized = normalizeExportValue(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
