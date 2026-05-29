import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000';

interface LoginPageProps {
  onLogin: (session: { userId: string; tenantId: string; role: string; name: string; companyName: string }) => void;
}

type Screen = 'checking' | 'setup' | 'login' | 'error';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [screen, setScreen] = useState<Screen>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Setup form
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName]     = useState('');
  const [setupEmail, setSetupEmail]   = useState('');
  const [setupPass, setSetupPass]     = useState('');
  const [setupPass2, setSetupPass2]   = useState('');

  // Login form
  const [loginEmail, setLoginEmail]   = useState('');
  const [loginPass, setLoginPass]     = useState('');

  // Check if first-time setup needed
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/status`);
        if (!res.ok) throw new Error('Backend unreachable');
        const data = await res.json();
        setScreen(data.isSetupComplete ? 'login' : 'setup');
      } catch {
        setScreen('error');
      }
    };
    check();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (setupPass !== setupPass2) { setError('Passwords do not match.'); return; }
    if (setupPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, ownerName, email: setupEmail, password: setupPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Setup failed');
      onLogin({ userId: data.user.id, tenantId: data.user.tenantId, role: data.user.role, name: data.user.name, companyName: data.tenant.name });
    } catch (err: any) {
      setError(err.message || 'Setup failed. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      onLogin({ userId: data.user.id, tenantId: data.user.tenantId, role: data.user.role, name: data.user.name, companyName: data.user.companyName });
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Checking screen ───
  if (screen === 'checking') {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '3rem' }}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>🔥</div>
            <span style={styles.logoText}>LPG Pakistan ERP</span>
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Connecting to server…
          </div>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  // ─── Backend offline ───
  if (screen === 'error') {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '3rem' }}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>🔥</div>
            <span style={styles.logoText}>LPG Pakistan ERP</span>
          </div>
          <div style={{ color: 'var(--color-danger)', marginTop: '1.5rem', fontWeight: 600 }}>
            Cannot connect to backend server
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Make sure the backend is running on <code style={styles.code}>http://localhost:3000</code>
            <br />Run: <code style={styles.code}>npm run dev</code> inside the <code style={styles.code}>backend/</code> folder
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => { setScreen('checking'); window.location.reload(); }}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ─── First-time Setup ───
  if (screen === 'setup') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>🔥</div>
            <span style={styles.logoText}>LPG Pakistan ERP</span>
          </div>
          <h1 style={styles.heading}>Setup Your Company</h1>
          <p style={styles.subheading}>Create your owner account to get started. This is a one-time setup.</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Company / Business Name *</label>
              <input className="form-input" type="text" required placeholder="e.g. LPG Distributors Pvt Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Your Full Name *</label>
              <input className="form-input" type="text" required placeholder="e.g. Ahmed Ali" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" required placeholder="owner@yourcompany.com" value={setupEmail} onChange={e => setSetupEmail(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" required placeholder="Min 6 characters" value={setupPass} onChange={e => setSetupPass(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm Password *</label>
                <input className="form-input" type="password" required placeholder="Repeat password" value={setupPass2} onChange={e => setSetupPass2(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Creating your account…' : 'Create Company & Owner Account →'}
            </button>
          </form>

          <div style={styles.infoBox}>
            <strong>What this does:</strong> Creates your company workspace, your owner account, and the default chart of accounts. You can create all other staff accounts after logging in.
          </div>
        </div>
      </div>
    );
  }

  // ─── Login ───
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>🔥</div>
          <span style={styles.logoText}>LPG Pakistan ERP</span>
        </div>
        <h1 style={styles.heading}>Sign In</h1>
        <p style={styles.subheading}>Enter your email and password to access the system.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" required autoFocus placeholder="your@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" required placeholder="Your password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Drivers use the <strong style={{ color: 'var(--text-main)' }}>Mobile App</strong> with their PIN code
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#12141a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  card: {
    background: '#1e2028',
    border: '1px solid #2a2d38',
    borderRadius: '14px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '1.75rem',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: '#007aff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#e8eaf0',
    letterSpacing: '-0.01em',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#e8eaf0',
    letterSpacing: '-0.02em',
    marginBottom: '0.35rem',
  },
  subheading: {
    fontSize: '0.85rem',
    color: '#666b7a',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  errorBox: {
    background: 'rgba(255,69,58,0.1)',
    border: '1px solid rgba(255,69,58,0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    color: '#ff453a',
    marginBottom: '1rem',
    lineHeight: 1.4,
  },
  infoBox: {
    background: 'rgba(0,122,255,0.07)',
    border: '1px solid rgba(0,122,255,0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.78rem',
    color: '#8e8e93',
    marginTop: '1.25rem',
    lineHeight: 1.5,
  },
  code: {
    background: 'rgba(255,255,255,0.08)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '#007aff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '1.5rem auto 0',
  },
};
