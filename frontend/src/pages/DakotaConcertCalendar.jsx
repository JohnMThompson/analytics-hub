/**
 * Dakota Concert Calendar dashboard.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import { Card, DashboardSection, ErrorAlert, LoadingSpinner } from '../components/shared';
import DataTable from '../components/table';

export const DESCRIPTION_PREVIEW_CHARS = 280;
export const MOBILE_DESCRIPTION_PREVIEW_WORDS = 20;

export function truncateDescription(value, maxChars = DESCRIPTION_PREVIEW_CHARS) {
  const normalized = String(value || '').trim();
  if (normalized.length <= maxChars) {
    return { text: normalized, isTruncated: false };
  }

  return {
    text: `${normalized.slice(0, maxChars).trimEnd()}...`,
    isTruncated: true,
  };
}

export function truncateDescriptionByWords(value, maxWords = MOBILE_DESCRIPTION_PREVIEW_WORDS) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return { text: normalized, isTruncated: false };
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { text: normalized, isTruncated: false };
  }

  return {
    text: `${words.slice(0, maxWords).join(' ')}...`,
    isTruncated: true,
  };
}

export function formatDateLong(value) {
  if (!value || typeof value !== 'string') return '—';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDakotaDescriptionPreview(description, isExpanded, isMobile = false) {
  const truncated = isMobile
    ? truncateDescriptionByWords(description)
    : truncateDescription(description);

  if (isExpanded) {
    return {
      text: description,
      isTruncated: truncated.isTruncated,
    };
  }

  return truncated;
}

export function buildDakotaTableColumns(expandedDescriptions, toggleDescription) {
  const compactHeaderClass = 'px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm';
  const compactCellClass = 'px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm';

  return [
    {
      key: 'event_date',
      header: 'Date',
      tone: 'primary',
      headerClassName: compactHeaderClass,
      className: `whitespace-nowrap ${compactCellClass}`,
      exportValue: (row) => row?.event_date || '—',
    },
    {
      key: 'event_time',
      header: 'Time',
      tone: 'secondary',
      headerClassName: compactHeaderClass,
      className: `whitespace-nowrap ${compactCellClass}`,
      exportValue: (row) => row?.event_time || '—',
    },
    {
      key: 'performer_name',
      header: 'Performer',
      tone: 'primary',
      headerClassName: compactHeaderClass,
      className: `whitespace-normal break-words ${compactCellClass}`,
      exportValue: (row) => row?.performer_name || '—',
    },
    {
      key: 'genre',
      header: 'Genre',
      tone: 'secondary',
      headerClassName: compactHeaderClass,
      className: `whitespace-normal break-words ${compactCellClass}`,
      exportValue: (row) => row?.genre || '—',
    },
    {
      key: 'description_short',
      header: 'Description',
      tone: 'secondary',
      headerClassName: `${compactHeaderClass} hidden sm:table-cell print-hide-column`,
      className: `hidden sm:table-cell whitespace-normal break-words print-hide-column ${compactCellClass}`,
      exportValue: (row) => row?.description_short || '—',
      render: (row) => {
        const description = row?.description_short || '—';
        const isExpanded = expandedDescriptions.has(row.id);
        const { text: preview, isTruncated } = getDakotaDescriptionPreview(description, isExpanded);

        return (
          <div className="whitespace-normal break-words">
            <span>{preview}</span>
            {isTruncated && (
              <button
                type="button"
                className="no-print ml-2 text-xs font-semibold underline"
                style={{ color: 'var(--accent-600)' }}
                onClick={() => toggleDescription(row.id)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        );
      },
    },
  ];
}

export function DakotaMobileEventCard({ row, expandedDescriptions, toggleDescription }) {
  const description = row?.description_short || '—';
  const isExpanded = expandedDescriptions.has(row.id);
  const { text: preview, isTruncated } = getDakotaDescriptionPreview(description, isExpanded, true);

  return (
    <article
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        borderColor: 'var(--border-soft)',
        backgroundColor: 'var(--bg-panel)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {row?.performer_name || '—'}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--accent-600)' }}>
            {row?.genre || '—'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
            {row?.event_time || '—'}
          </p>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {row?.event_date || '—'}
      </p>
      <div className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
        <span>{preview}</span>
        {isTruncated && (
          <button
            type="button"
            className="ml-2 text-xs font-semibold underline"
            style={{ color: 'var(--accent-600)' }}
            onClick={() => toggleDescription(row.id)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </article>
  );
}

export default function DakotaConcertCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState(() => new Set());
  const [selectedGenre, setSelectedGenre] = useState('all');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getDashboardData('dakota_concert_calendar');
      setEvents(Array.isArray(response?.events) ? response.events : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const toggleDescription = useCallback((rowId) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const tableColumns = useMemo(
    () => buildDakotaTableColumns(expandedDescriptions, toggleDescription),
    [expandedDescriptions, toggleDescription],
  );

  const tableRows = useMemo(
    () =>
      events.map((row) => ({
        ...row,
        event_date: formatDateLong(row?.event_date),
        event_time: row?.event_time || '—',
        performer_name: row?.performer_name || '—',
        genre: row?.genre || '—',
        description_short: row?.description_short || '—',
      })),
    [events],
  );

  const genreOptions = useMemo(() => {
    const values = new Set();
    events.forEach((event) => {
      const genre = String(event?.genre || '').trim();
      if (genre) values.add(genre);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredRows = useMemo(() => {
    if (selectedGenre === 'all') return tableRows;
    return tableRows.filter((row) => row.genre === selectedGenre);
  }, [selectedGenre, tableRows]);

  if (loading) return <LoadingSpinner />;

  return (
    <DashboardLayout
      title="Dakota Concert Calendar"
      subtitle="Upcoming events at Dakota Jazz Club"
      themeClass="theme-dakota"
    >
      {error && <ErrorAlert error={error} onRetry={fetchEvents} />}
      <DashboardSection title="Upcoming Concerts">
        <div className="no-print mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="dakota-genre-filter" className="sr-only">Genre filter</label>
            <select
              id="dakota-genre-filter"
              aria-label="Filter by genre"
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--text-primary)',
                backgroundColor: '#fff',
              }}
            >
              <option value="all">All Genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="dashboard-link focus-ring inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm sm:w-auto"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            >
              <path d="M7 3h10v4H7V3Zm10 16H7v2h10v-2Zm2-10H5a3 3 0 0 0-3 3v4h4v-3h12v3h4v-4a3 3 0 0 0-3-3Zm-3 7H8v-5h8v5Z" />
            </svg>
            Print
          </button>
        </div>
        <div className="grid gap-3 sm:hidden">
          {filteredRows.length === 0 ? (
            <Card className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No upcoming concerts found.
            </Card>
          ) : (
            filteredRows.map((row) => (
              <DakotaMobileEventCard
                key={row.id}
                row={row}
                expandedDescriptions={expandedDescriptions}
                toggleDescription={toggleDescription}
              />
            ))
          )}
        </div>
        <Card className="hidden p-0 sm:block [&_table]:table-fixed">
          <DataTable
            columns={tableColumns}
            rows={filteredRows}
            rowKey="id"
            emptyMessage="No upcoming concerts found."
            striped={false}
            hover={true}
            exportConfig={{
              fileName: `dakota-concert-calendar-${selectedGenre === 'all' ? 'all-genres' : selectedGenre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              sheetName: 'Upcoming Concerts',
            }}
          />
        </Card>
      </DashboardSection>
    </DashboardLayout>
  );
}
