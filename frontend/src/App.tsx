import { useCallback, useState } from 'react';
import type { SearchParams, SortField } from './api/types';
import { SearchForm }    from './components/SearchForm';
import { RequestsTable } from './components/RequestsTable';
import { Pagination }    from './components/Pagination';
import { useSearch }     from './hooks/useSearch';

const DEFAULT_PARAMS: SearchParams = {
  requestNumber:  '',
  statuses:       [],
  dateFrom:       '',
  dateTo:         '',
  requestType:    '',
  sortBy:         'CreatedAt',
  sortDescending: true,
  page:           1,
  pageSize:       20,
};

export default function App() {
  // Single source of truth for current search params
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const { data, loading, error } = useSearch(params);

  const update = useCallback((updater: SearchParams | ((p: SearchParams) => SearchParams)) => {
    setParams(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  const handleSearch = useCallback((p: SearchParams) => {
    update({ ...p, page: 1 });
  }, [update]);

  const handleSort = useCallback((field: SortField) => {
    update(prev => ({
      ...prev,
      sortBy:         field,
      sortDescending: prev.sortBy === field ? !prev.sortDescending : true,
      page:           1,
    }));
  }, [update]);

  const handlePage = useCallback((page: number) => {
    update(prev => ({ ...prev, page }));
  }, [update]);

  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Requests</h1>

      <SearchForm
        initial={DEFAULT_PARAMS}
        onSearch={handleSearch}
        disabled={loading}
      />

      <section aria-live="polite" aria-busy={loading} style={styles.results}>

        {loading && (
          <div style={styles.status} role="status">
            <LoadingSpinner /> Loading…
          </div>
        )}

        {!loading && error && (
          <div style={styles.error} role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && data && data.items.length === 0 && (
          <div style={styles.status}>
            No requests match your search criteria.
          </div>
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <RequestsTable
              items={data.items}
              params={params}
              onSort={handleSort}
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              pageSize={data.pageSize}
              onPage={handlePage}
            />
          </>
        )}
      </section>
    </main>
  );
}

function LoadingSpinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={styles.spinner} aria-hidden="true" />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main:    { maxWidth: 1100, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 16 },
  results: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  status:  { display: 'flex', alignItems: 'center', gap: 10, padding: 20, color: '#6c757d', justifyContent: 'center' },
  error:   { padding: 16, borderRadius: 6, background: '#fff3cd', border: '1px solid #ffc107', color: '#664d03' },
  spinner: {
    display:      'inline-block',
    width:        18,
    height:       18,
    border:       '3px solid #dee2e6',
    borderTopColor: '#0d6efd',
    borderRadius: '50%',
    animation:    'spin 0.7s linear infinite',
  },
};
