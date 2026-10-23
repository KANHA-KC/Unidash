import { useEffect, useState } from 'react';
import { Cloud, X } from 'lucide-react';
import { useRoute } from './router';
import { useStore } from './store';
import { Home } from './views/Home';
import { Board } from './views/Board';
import { DataPage } from './views/Data';
import { Published } from './views/Published';
import { SignIn } from './views/SignIn';
import { Toaster, toast } from './components/Toast';
import { useAuth } from './auth';
import { importLocalDashboards, initCloudSync } from './cloud';

// Start background cloud autosave & listeners once
initCloudSync();

export function App() {
  const route = useRoute();
  const theme = useStore((s) => s.theme);
  const dashboards = useStore((s) => s.dashboards);
  const { user } = useAuth();

  const [dismissedImport, setDismissedImport] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.split('?')[0]]);

  const [path, query = ''] = route.split('?');
  const params = new URLSearchParams(query);
  const board = path.match(/^\/b\/([\w-]+)/);
  const shared = path.match(/^\/p\/([\w-]+)/);

  const showImportPrompt =
    Boolean(user) &&
    !dismissedImport &&
    dashboards.length > 0 &&
    !shared &&
    path !== '/signin';

  const handleImport = async () => {
    setImporting(true);
    try {
      const count = await importLocalDashboards();
      toast(`Imported ${count} dashboard${count === 1 ? '' : 's'} to your cloud workspace`);
      setDismissedImport(true);
    } catch (err: any) {
      toast(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {showImportPrompt && (
        <div
          className="import-banner"
          style={{
            background: 'var(--accent, #3b82f6)',
            color: '#fff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 100,
            position: 'relative',
          }}
        >
          <div className="row gap-sm" style={{ alignItems: 'center' }}>
            <Cloud size={16} />
            <span>
              You have {dashboards.length} dashboard{dashboards.length > 1 ? 's' : ''} saved locally. Import to your cloud workspace?
            </span>
          </div>
          <div className="row gap-xs" style={{ alignItems: 'center' }}>
            <button
              className="btn small"
              disabled={importing}
              onClick={handleImport}
              style={{
                background: '#fff',
                color: 'var(--accent, #3b82f6)',
                border: 0,
                padding: '4px 10px',
                fontWeight: 600,
              }}
            >
              {importing ? 'Importing...' : 'Import to Cloud'}
            </button>
            <button
              className="icon-btn small"
              aria-label="Dismiss banner"
              onClick={() => setDismissedImport(true)}
              style={{ color: '#fff', opacity: 0.8 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {shared ? (
        <Published key={shared[1]} token={shared[1]} embed={params.has('embed')} />
      ) : path === '/signin' || path === '/account' ? (
        <SignIn />
      ) : board ? (
        <Board key={board[1]} id={board[1]} startEditing={params.has('edit')} />
      ) : path === '/data' ? (
        <DataPage key={query} />
      ) : (
        <Home />
      )}
      <Toaster />
    </>
  );
}
