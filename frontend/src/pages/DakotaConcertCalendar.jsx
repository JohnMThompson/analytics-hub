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

export function buildDakotaTableColumns(expandedDescriptions, toggleDescription, isMobile = false) {
  const compactHeaderClass = 'px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm';
  const compactCellClass = 'px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm';

  return [
    {
      key: 'event_date',
      header: 'Date',
      tone: 'primary',
      headerClassName: compactHeaderClass,
      className: `whitespace-nowrap ${compactCellClass}`,
    },
    {
      key: 'event_time',
      header: 'Time',
      tone: 'secondary',
      headerClassName: compactHeaderClass,
      className: `whitespace-nowrap ${compactCellClass}`,
    },
    {
      key: 'performer_name',
      header: 'Performer',
      tone: 'primary',
      headerClassName: compactHeaderClass,
      className: `whitespace-normal break-words ${compactCellClass}`,
    },
    {
      key: 'genre',
      header: 'Genre',
      tone: 'secondary',
      headerClassName: compactHeaderClass,
      className: `whitespace-normal break-words ${compactCellClass}`,
    },
    {
      key: 'description_short',
      header: 'Description',
      tone: 'secondary',
      headerClassName: `${compactHeaderClass} hidden sm:table-cell print-hide-column`,
      className: `hidden sm:table-cell whitespace-normal break-words print-hide-column ${compactCellClass}`,
      render: (row) => {
        const description = row?.description_short || '—';
        const { text: preview, isTruncated } = isMobile
          ? truncateDescriptionByWords(description)
          : truncateDescription(description);
        const isExpanded = expandedDescriptions.has(row.id);

        return (
          <div className="whitespace-normal break-words">
            <span>{isExpanded ? description : preview}</span>
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

export default function DakotaConcertCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState(() => new Set());
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isMobileViewport, setIsMobileViewport] = useState(false);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateViewport);

    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
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
    () => buildDakotaTableColumns(expandedDescriptions, toggleDescription, isMobileViewport),
    [expandedDescriptions, toggleDescription, isMobileViewport],
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
        <Card className="p-0 [&_table]:table-fixed">
          <DataTable
            columns={tableColumns}
            rows={filteredRows}
            rowKey="id"
            emptyMessage="No upcoming concerts found."
            striped={false}
            hover={true}
          />
        </Card>
      </DashboardSection>
    </DashboardLayout>
  );
}
