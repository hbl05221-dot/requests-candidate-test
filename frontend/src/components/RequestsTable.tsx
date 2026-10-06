import type { RequestDto, SortField, SearchParams } from '../api/types';

interface Props {
  items:    RequestDto[];
  params:   SearchParams;
  onSort:   (field: SortField) => void;
}

const STATUS_COLORS: Record<string, string> = {
  New:        '#0d6efd',
  InProgress: '#fd7e14',
  Completed:  '#198754',
  Cancelled:  '#6c757d',
};

function SortHeader({ field, label, current, desc, onSort }: {
  field:   SortField;
  label:   string;
  current: SortField;
  desc:    boolean;
  onSort:  (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <th
      style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(field)}
      aria-sort={active ? (desc ? 'descending' : 'ascending') : 'none'}
    >
      {label}
      {active && <span aria-hidden> {desc ? '▼' : '▲'}</span>}
    </th>
  );
}

export function RequestsTable({ items, params, onSort }: Props) {
  if (items.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <table style={styles.table} aria-label="Requests">
        <thead>
          <tr>
            <SortHeader field="RequestNumber" label="Request #"    current={params.sortBy} desc={params.sortDescending} onSort={onSort} />
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Owner</th>
            <th style={styles.th}>Assigned To</th>
            <SortHeader field="Status"        label="Status"       current={params.sortBy} desc={params.sortDescending} onSort={onSort} />
            <SortHeader field="RequestType"   label="Type"         current={params.sortBy} desc={params.sortDescending} onSort={onSort} />
            <SortHeader field="CreatedAt"     label="Created"      current={params.sortBy} desc={params.sortDescending} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} style={styles.tr}>
              <td style={styles.td}><code>{r.requestNumber}</code></td>
              <td style={styles.td}>{r.customerId}</td>
              <td style={styles.td}>{r.ownerId}</td>
              <td style={styles.td}>{r.assignedToUserId ?? '—'}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: STATUS_COLORS[r.status] ?? '#6c757d' }}>
                  {r.status}
                </span>
              </td>
              <td style={styles.td}>{r.requestType}</td>
              <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { overflowX: 'auto', borderRadius: 8, border: '1px solid #dee2e6' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:      { padding: '10px 14px', background: '#f1f3f5', borderBottom: '2px solid #dee2e6', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 },
  tr:      { borderBottom: '1px solid #dee2e6' },
  td:      { padding: '9px 14px', verticalAlign: 'middle' },
  badge:   { display: 'inline-block', padding: '2px 8px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
};
