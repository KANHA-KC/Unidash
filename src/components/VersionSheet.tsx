import { Sheet } from './Sheet';
import { MiniPreview } from './MiniPreview';
import { restoreVersion, undo, useVersions } from '../store';
import { pagesOf } from '../pages';
import { timeAgo } from '../format';
import { toast } from './Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  dashboardId: string;
}

/** The last 20 saved versions of a dashboard (kept in this browser), newest first. */
export function VersionSheet({ open, onClose, dashboardId }: Props) {
  const versions = useVersions(dashboardId);
  const list = [...versions].reverse();

  const restore = (at: number) => {
    restoreVersion(dashboardId, at);
    onClose();
    toast('Version restored', { label: 'Undo', run: () => undo(dashboardId) });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Version history">
      {list.length === 0 ? (
        <p className="muted">No saved versions yet. A version is saved a little after you make changes, and when you tap Done.</p>
      ) : (
        <>
          <p className="muted small">The last {versions.length === 1 ? 'version is' : `${versions.length} versions are`} kept in this browser.</p>
          <ul className="version-list">
            {list.map((v, i) => {
              const d = v.dashboard;
              const pages = pagesOf(d).length;
              return (
                <li key={v.at} className="version-row">
                  <MiniPreview sizes={d.widgets.map((w) => w.size)} />
                  <div className="grow min0">
                    <div className="version-name">
                      {d.emoji} {d.name}
                    </div>
                    <div className="muted small">
                      {i === 0 ? 'Latest · ' : ''}
                      {new Date(v.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {timeAgo(v.at)} ·{' '}
                      {d.widgets.length} {d.widgets.length === 1 ? 'widget' : 'widgets'}
                      {pages > 1 ? ` · ${pages} pages` : ''}
                    </div>
                  </div>
                  <button className="btn" onClick={() => restore(v.at)}>
                    Restore
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
