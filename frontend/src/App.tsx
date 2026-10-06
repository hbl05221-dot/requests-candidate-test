import { useCallback, useState } from 'react';
import type { SearchParams, SortField } from './api/types';
import { setUserContext }   from './api/requestsApi';
import { SearchForm }       from './components/SearchForm';
import { RequestsTable }    from './components/RequestsTable';
import { Pagination }       from './components/Pagination';
import { LoginScreen }      from './components/LoginScreen';
import { useSearch }        from './hooks/useSearch';

interface LoggedInUser {
  userId:  number;
  isAdmin: boolean;
  label:   string;
}

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
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const { data, loading, error } = useSearch(user ? params : null);

  const handleLogin = useCallback((userId: number, isAdmin: boolean) => {
    const label = isAdmin ? 'Administrator' : `User ${userId}`;
    setUserContext(userId, isAdmin);
    setUser({ userId, isAdmin, label });
    setParams(DEFAULT_PARAMS);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setParams(DEFAULT_PARAMS);
  }, []);

  // Show login screen if not logged in
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const update = (updater: SearchParams | ((p: SearchParams) => SearchParams)) => {
    setParams(prev => typeof updater === 'function' ? updater(prev) : updater);
  };

  const handleSearch = (p: SearchParams) => update({ ...p, page: 1 });

  const handleSort = (field: SortField) => {
    update(prev => ({
      ...prev,
      sortBy:         field,
      sortDescending: prev.sortBy === field ? !prev.sortDescending : true,
      page:           1,
    }));
  };

  const handlePage = (page: number) => update(prev => ({ ...prev, page }));

  return (
    <main style={styles.main}>

      {/* Header with user info */}
      <div style={styles.header}>
        <h1 style={styles.heading}>Requests</h1>
        <div style={styles.userInfo}>
          <span style={styles.userLabel}>
            {user.isAdmin ? '👑' : '👤'} {user.label}
            <span style={{ ...styles.badge, background: user.isAdmin ? '#dc3545' : '#0d6efd' }}>
              {user.isAdmin ? 'Admin' : 'User'}
            </span>
          </span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Switch user
          </button>
        </div>
      </div>

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
  main:       { maxWidth: 1100, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  heading:    { fontSize: 24, fontWeight: 700, margin: 0 },
  userInfo:   { display: 'flex', alignItems: 'center', gap: 10 },
  userLabel:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#343a40' },
  badge:      { padding: '2px 8px', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 700 },
  logoutBtn:  { padding: '5px 12px', borderRadius: 6, border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6c757d' },
  results:    { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  status:     { display: 'flex', alignItems: 'center', gap: 10, padding: 20, color: '#6c757d', justifyContent: 'center' },
  error:      { padding: 16, borderRadius: 6, background: '#fff3cd', border: '1px solid #ffc107', color: '#664d03' },
  spinner: {
    display:        'inline-block',
    width:          18,
    height:         18,
    border:         '3px solid #dee2e6',
    borderTopColor: '#0d6efd',
    borderRadius:   '50%',
    animation:      'spin 0.7s linear infinite',
  },
};
