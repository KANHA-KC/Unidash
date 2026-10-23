import { useEffect, useState, type FormEvent } from 'react';
import { Copy, Lock, ShieldAlert, Zap } from 'lucide-react';
import type { Dashboard, DashFilter, DateRange } from '../types';
import { api, type ApiError } from '../api';
import { getSnapshot, useConnection, useLiveStream } from '../live';
import { resolveData } from '../resolve';
import { addDashboard, uid } from '../store';
import { navigate } from '../router';
import { WidgetCard } from '../components/WidgetCard';
import { toast } from '../components/Toast';
import { FilterBar } from '../components/FilterBar';
import { PageTabs } from '../components/PageTabs';
import { pagesOf, toggleFilter, widgetsOn } from '../pages';

/** Read-only, live view of a shared dashboard. `embed` drops all chrome for iframes. */
export function Published({ token, embed }: { token: string; embed: boolean }) {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // Viewers filter for themselves: starts from the owner's saved filters, never written back.
  const [filters, setFilters] = useState<DashFilter[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const connection = useConnection();
  useLiveStream([], dash ? token : undefined);

  const fetchDashboard = (pw?: string) => {
    return api
      .published(token, pw)
      .then((r) => {
        setDash(r.dashboard);
        setFilters(r.dashboard.filters ?? []);
        setDateRange(r.dashboard.dateRange ?? 'all');
        setRequiresPassword(false);
        setError('');
      })
      .catch((e: ApiError | Error) => {
        const isPw = (e as ApiError).requiresPassword || e.message === 'Password required';
        if (isPw) {
          setRequiresPassword(true);
        } else {
          setError(e.message);
        }
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  useEffect(() => {
    if (dash) document.title = `${dash.name} · Unidash`;
    return () => {
      document.title = 'Unidash';
    };
  }, [dash]);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    try {
      await fetchDashboard(password);
    } catch {
      toast('Incorrect password');
    } finally {
      setUnlocking(false);
    }
  };

  // "Clone structure" (addendum §9): copy the layout with today's values as editable sample data.
  const clone = () => {
    if (!dash) return;
    const now = Date.now();
    addDashboard({
      ...dash,
      id: uid(),
      name: `${dash.name} (copy)`,
      publication: undefined,
      createdAt: now,
      updatedAt: now,
      widgets: dash.widgets.map((w) => {
        const values = w.binding ? resolveData(w, getSnapshot(w.binding.sourceId)) : null;
        return {
          ...w,
          id: uid(),
          binding: undefined,
          sample: w.sample || !!w.binding,
          data: { ...w.data, ...(values ?? {}) },
        };
      }),
    });
    toast('Copied to your dashboards');
    navigate('/');
  };

  if (requiresPassword) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ maxWidth: 380, width: '100%', padding: 32, textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
            Password Protected
          </h2>
          <p className="muted small" style={{ margin: '0 0 20px 0' }}>
            Enter the passphrase to view this live dashboard.
          </p>
          <form onSubmit={handleUnlock} className="stack gap">
            <input
              className="input"
              type="password"
              autoFocus
              required
              placeholder="Enter passphrase..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn primary" type="submit" disabled={unlocking}>
              {unlocking ? 'Verifying...' : 'Unlock Dashboard'}
            </button>
          </form>
          {!embed && (
            <div style={{ marginTop: 20 }}>
              <a href="#/" className="muted small">Go to Unidash</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    const isAuth = error.toLowerCase().includes('sign in') || error.toLowerCase().includes('private');
    return (
      <div className="page">
        <main className="container empty-state">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldAlert size={40} color="var(--accent)" />
          </div>
          <h1 className="title">{isAuth ? 'Private Dashboard' : 'This link isn’t available'}</h1>
          <p className="muted">{error}</p>
          <div className="row gap" style={{ justifyContent: 'center', marginTop: 16 }}>
            {isAuth && (
              <a className="btn primary" href="#/signin">
                Sign In to View
              </a>
            )}
            {!embed && <a className="btn ghost" href="#/">Go to Unidash</a>}
          </div>
        </main>
      </div>
    );
  }

  if (!dash) return <div className="page loading" aria-busy="true" />;

  const hasLive = dash.widgets.some((w) => w.binding);
  const pages = pagesOf(dash);
  const page = pages.find((p) => p.id === pageId)?.id ?? pages[0].id;
  const filterCtx = { filters, dateRange };
  const onFilter = (next: { filters?: DashFilter[]; dateRange?: DateRange }) => {
    if (next.filters) setFilters(next.filters);
    if (next.dateRange) setDateRange(next.dateRange);
  };

  return (
    <div className={`page board readonly accent-${dash.accent} ${embed ? 'embed' : ''}`}>
      {!embed && (
        <header className="topbar">
          <h1 className="board-title">
            <span aria-hidden>{dash.emoji}</span> {dash.name}
          </h1>
          <div className="row gap-sm">
            {hasLive && (
              <span className={`live-badge ${connection === 'open' ? 'live' : 'waiting'}`}>
                <span className="live-dot" aria-hidden />
                {connection === 'open' ? 'Live' : 'Connecting'}
              </span>
            )}
            <button className="btn" onClick={clone}>
              <Copy size={15} /> <span className="hide-xs">Use as template</span><span className="show-xs">Copy</span>
            </button>
          </div>
        </header>
      )}
      <PageTabs pages={pages} current={page} onPick={setPageId} />
      <main className="container">
        <FilterBar widgets={dash.widgets} filters={filters} dateRange={dateRange} onChange={onFilter} />
        <div className="grid">
          {widgetsOn(dash, page).map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              filters={filterCtx}
              onSelect={(sourceId, field, label) => setFilters((fs) => toggleFilter(fs, sourceId, field, label))}
            />
          ))}
        </div>
      </main>
      <a className="made-with" href={`${location.pathname}#/`} target={embed ? '_blank' : undefined} rel="noopener">
        <Zap size={13} /> Live on Unidash{embed ? '' : ' · Make your own'}
      </a>
    </div>
  );
}
