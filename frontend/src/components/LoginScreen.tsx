interface Props {
  onLogin: (userId: number, isAdmin: boolean) => void;
}

export function LoginScreen({ onLogin }: Props) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.title}>Requests System</h1>
        <p style={styles.subtitle}>Select your user to continue</p>

        <div style={styles.users}>

          {/* Admin */}
          <button style={styles.userBtn} onClick={() => onLogin(1, true)}>
            <span style={styles.avatar}>👑</span>
            <div>
              <div style={styles.userName}>Administrator</div>
              <div style={styles.userDesc}>Full access – sees all requests</div>
            </div>
            <span style={{ ...styles.badge, background: '#dc3545' }}>Admin</span>
          </button>

          {/* User */}
          <button style={styles.userBtn} onClick={() => onLogin(1, false)}>
            <span style={styles.avatar}>👤</span>
            <div>
              <div style={styles.userName}>Regular User</div>
              <div style={styles.userDesc}>Sees only owned or assigned requests</div>
            </div>
            <span style={{ ...styles.badge, background: '#0d6efd' }}>User</span>
          </button>

        </div>

        <p style={styles.note}>
          ⚠️ This is a simulated login for demo purposes.<br />
          In production, authentication would use JWT tokens.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', fontFamily: 'system-ui, sans-serif' },
  card:     { background: '#fff', borderRadius: 16, padding: '40px 48px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: 480 },
  title:    { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' },
  subtitle: { color: '#6c757d', fontSize: 15, margin: '0 0 28px' },
  users:    { display: 'flex', flexDirection: 'column', gap: 12 },
  userBtn:  { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: '1.5px solid #dee2e6', background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' },
  avatar:   { fontSize: 28, lineHeight: 1 },
  userName: { fontWeight: 700, fontSize: 15, color: '#212529' },
  userDesc: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  badge:    { marginLeft: 'auto', padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  note:     { marginTop: 24, fontSize: 12, color: '#adb5bd', lineHeight: 1.6, textAlign: 'center' },
};
