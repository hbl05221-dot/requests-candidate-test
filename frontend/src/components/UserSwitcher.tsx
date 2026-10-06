interface UserContext {
  userId:  number;
  isAdmin: boolean;
  label:   string;
}

const USERS: UserContext[] = [
  { userId: 1, isAdmin: true,  label: 'Admin'  },
  { userId: 1, isAdmin: false, label: 'User 1' },
  { userId: 2, isAdmin: false, label: 'User 2' },
  { userId: 3, isAdmin: false, label: 'User 3' },
];

interface Props {
  current: UserContext;
  onChange: (user: UserContext) => void;
}

export type { UserContext };

export function UserSwitcher({ current, onChange }: Props) {
  return (
    <div style={styles.bar}>
      <span style={styles.label}>👤 Logged in as:</span>
      {USERS.map(u => (
        <button
          key={u.label}
          style={current.label === u.label ? { ...styles.btn, ...styles.active } : styles.btn}
          onClick={() => onChange(u)}
        >
          {u.label}
          {u.isAdmin && <span style={styles.badge}>admin</span>}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar:    { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#f1f3f5', borderRadius: 8, marginBottom: 16, flexWrap: 'wrap' },
  label:  { fontSize: 13, color: '#495057', fontWeight: 600, marginRight: 4 },
  btn:    { padding: '5px 12px', borderRadius: 20, border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 },
  active: { background: '#0d6efd', color: '#fff', borderColor: '#0d6efd', fontWeight: 700 },
  badge:  { fontSize: 10, background: '#dc3545', color: '#fff', borderRadius: 8, padding: '1px 5px' },
};
