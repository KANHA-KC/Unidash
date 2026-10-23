import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Lock, LogOut, Mail, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../auth';
import { navigate } from '../router';
import { toast } from '../components/Toast';
import { importLocalDashboards } from '../cloud';
import { getState } from '../store';

export function SignIn() {
  const { user, workspaceId, loading, error, signInWithEmail, signUpWithEmail, signInWithOtp, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [localImportCount, setLocalImportCount] = useState<number | null>(null);

  const localDrafts = getState().dashboards.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        toast('Signed in successfully');
        navigate('/');
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
        toast('Account created! Welcome to Unidash Cloud');
        navigate('/');
      } else if (mode === 'magic') {
        await signInWithOtp(email);
        setMagicSent(true);
        toast('Check your inbox for the sign-in link');
      }
    } catch {
      // Error handled by useAuth
    }
  };

  const handleImport = async () => {
    try {
      const count = await importLocalDashboards();
      setLocalImportCount(count);
      toast(`Imported ${count} dashboards to your workspace`);
    } catch (err: any) {
      toast(err.message || 'Import failed');
    }
  };

  // If already signed in, show profile and workspace card
  if (user) {
    return (
      <div className="page auth-page">
        <header className="topbar">
          <button className="btn ghost" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Dashboards
          </button>
        </header>
        <main className="container" style={{ maxWidth: 460, margin: '48px auto' }}>
          <div className="card" style={{ padding: 32 }}>
            <div className="row gap" style={{ alignItems: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent, #3b82f6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {user.user_metadata?.full_name || 'My Account'}
                </h2>
                <p className="muted small" style={{ margin: 0 }}>{user.email}</p>
              </div>
            </div>

            <div className="stack gap" style={{ marginBottom: 24 }}>
              <div className="field">
                <span className="field-label">Active Workspace</span>
                <input className="input" readOnly value={workspaceId || 'Default Workspace'} />
              </div>

              {localDrafts > 0 && localImportCount === null && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--card-bg-subtle, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="row gap-sm" style={{ alignItems: 'center', marginBottom: 6 }}>
                    <Sparkles size={16} color="var(--accent)" />
                    <strong style={{ fontSize: 14 }}>Local Dashboards Found</strong>
                  </div>
                  <p className="muted small" style={{ margin: '0 0 12px 0' }}>
                    You have {localDrafts} local dashboard{localDrafts > 1 ? 's' : ''} in this browser. Upload them to your cloud workspace to sync across devices.
                  </p>
                  <button className="btn primary small" onClick={handleImport}>
                    Import all to Cloud
                  </button>
                </div>
              )}

              {localImportCount !== null && (
                <div className="row gap-sm" style={{ color: 'var(--color-success, #10b981)', fontSize: 13 }}>
                  <CheckCircle2 size={16} /> All {localImportCount} dashboards synced to cloud
                </div>
              )}
            </div>

            <div className="row gap">
              <button className="btn primary" onClick={() => navigate('/')}>
                Go to Dashboards
              </button>
              <button className="btn ghost danger" onClick={signOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page auth-page">
      <header className="topbar">
        <button className="btn ghost" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Continue as Guest
        </button>
      </header>

      <main className="container" style={{ maxWidth: 440, margin: '48px auto' }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Unidash Cloud
            </h1>
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              Access your live dashboards securely from any browser
            </p>
          </div>

          <div
            className="row gap-xs"
            style={{
              padding: 4,
              borderRadius: 10,
              background: 'var(--card-bg-subtle, rgba(0,0,0,0.04))',
              marginBottom: 24,
            }}
          >
            <button
              className={`btn ${mode === 'signin' ? 'primary' : 'ghost'}`}
              style={{ flex: 1, padding: '6px 12px', fontSize: 13 }}
              onClick={() => {
                setMode('signin');
                setMagicSent(false);
              }}
            >
              Sign In
            </button>
            <button
              className={`btn ${mode === 'signup' ? 'primary' : 'ghost'}`}
              style={{ flex: 1, padding: '6px 12px', fontSize: 13 }}
              onClick={() => {
                setMode('signup');
                setMagicSent(false);
              }}
            >
              Create Account
            </button>
            <button
              className={`btn ${mode === 'magic' ? 'primary' : 'ghost'}`}
              style={{ flex: 1, padding: '6px 12px', fontSize: 13 }}
              onClick={() => setMode('magic')}
            >
              Magic Link
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {magicSent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Mail size={40} color="var(--accent)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ fontSize: 16, margin: '0 0 8px 0' }}>Check your email</h3>
              <p className="muted small" style={{ margin: '0 0 20px 0' }}>
                We sent a magic sign-in link to <strong>{email}</strong>. Click it to log in immediately.
              </p>
              <button className="btn ghost" onClick={() => setMagicSent(false)}>
                Use another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stack gap">
              {mode === 'signup' && (
                <div className="field">
                  <span className="field-label">Full Name</span>
                  <div className="row gap-xs" style={{ alignItems: 'center' }}>
                    <input
                      className="input"
                      type="text"
                      placeholder="Alex Taylor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <span className="field-label">Email Address</span>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {mode !== 'magic' && (
                <div className="field">
                  <span className="field-label">Password</span>
                  <input
                    className="input"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              <button
                className="btn primary"
                type="submit"
                disabled={loading}
                style={{ marginTop: 8, padding: '10px 16px' }}
              >
                {loading
                  ? 'Connecting...'
                  : mode === 'signin'
                  ? 'Sign In'
                  : mode === 'signup'
                  ? 'Create Free Account'
                  : 'Send Magic Link'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <a
              href="#/"
              className="muted small"
              style={{ textDecoration: 'none', borderBottom: '1px dotted var(--muted)' }}
            >
              Continue in local offline mode
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
