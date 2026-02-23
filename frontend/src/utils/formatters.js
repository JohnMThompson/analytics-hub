/**
 * Shared dashboard number formatting helpers.
 */

const DEFAULT_LOCALE = 'en-US';

export function formatInteger(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits: 0 }).format(Number(value));
}

export function formatDecimal(value, maximumFractionDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits }).format(Number(value));
}

export function formatPercent(value, maximumFractionDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${formatDecimal(value, maximumFractionDigits)}%`;
}

export function formatSignedPercent(value, maximumFractionDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const numeric = Number(value);
  const sign = numeric > 0 ? '+' : '';
  return `${sign}${formatDecimal(numeric, maximumFractionDigits)}%`;
}

export function formatDurationHours(totalHours) {
  if (totalHours === null || totalHours === undefined || Number.isNaN(Number(totalHours))) return '—';
  const hours = Number(totalHours);
  if (hours < 1) return `${formatDecimal(hours * 60, 0)} min`;
  return `${formatDecimal(hours, 1)} hrs`;
}
