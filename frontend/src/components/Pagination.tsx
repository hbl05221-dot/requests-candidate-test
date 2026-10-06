interface Props {
  page:       number;
  totalPages: number;
  totalCount: number;
  pageSize:   number;
  onPage:     (p: number) => void;
}

export function Pagination({ page, totalPages, totalCount, pageSize, onPage }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);

  return (
    <nav aria-label="Pagination" style={styles.nav}>
      <span style={styles.info}>
        Showing {from}–{to} of {totalCount} results
      </span>
      <div style={styles.buttons}>
        <button
          style={styles.btn}
          onClick={() => onPage(1)}
          disabled={page === 1}
          aria-label="First page"
        >«</button>
        <button
          style={styles.btn}
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >‹</button>

        {/* Show up to 5 page numbers centred around current page */}
        {getPageWindow(page, totalPages).map(p => (
          <button
            key={p}
            style={p === page ? { ...styles.btn, ...styles.active } : styles.btn}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          style={styles.btn}
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >›</button>
        <button
          style={styles.btn}
          onClick={() => onPage(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >»</button>
      </div>
    </nav>
  );
}

function getPageWindow(current: number, total: number): number[] {
  const delta = 2;
  const start = Math.max(1, current - delta);
  const end   = Math.min(total, current + delta);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const styles: Record<string, React.CSSProperties> = {
  nav:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 0' },
  info:    { fontSize: 13, color: '#6c757d' },
  buttons: { display: 'flex', gap: 4 },
  btn:     { minWidth: 34, padding: '5px 8px', borderRadius: 4, border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: 13 },
  active:  { background: '#0d6efd', color: '#fff', borderColor: '#0d6efd', fontWeight: 700 },
};
