import { Plus, X } from 'lucide-react';
import type { Page } from '../types';

interface Props {
  pages: Page[];
  current: string;
  onPick: (id: string) => void;
  /** Editing adds "+ Page", lets the active page be renamed inline, and removed. */
  editing?: boolean;
  onAdd?: () => void;
  onRename?: (id: string, name: string) => void;
  onRenameStart?: () => void;
  onDelete?: (id: string) => void;
}

/** Page tabs: a row of chips that scrolls sideways on phones. Hidden for one-page dashboards outside editing. */
export function PageTabs({ pages, current, onPick, editing, onAdd, onRename, onRenameStart, onDelete }: Props) {
  if (pages.length < 2 && !editing) return null;
  return (
    <nav className="page-tabs" aria-label="Pages">
      <div className="page-tabs-row" role="tablist">
        {pages.map((p) =>
          editing && p.id === current ? (
            <span key={p.id} className="page-tab on editing" role="tab" aria-selected>
              <input
                value={p.name}
                aria-label="Page name"
                size={Math.max(4, p.name.length)}
                onFocus={onRenameStart}
                onChange={(e) => onRename?.(p.id, e.target.value)}
              />
              {pages.length > 1 && (
                <button className="filter-x" aria-label={`Delete page ${p.name}`} onClick={() => onDelete?.(p.id)}>
                  <X size={13} />
                </button>
              )}
            </span>
          ) : (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === current}
              className={`page-tab ${p.id === current ? 'on' : ''}`}
              onClick={() => onPick(p.id)}
            >
              {p.name || 'Untitled'}
            </button>
          ),
        )}
        {editing && (
          <button className="page-tab add" onClick={onAdd}>
            <Plus size={14} /> Page
          </button>
        )}
      </div>
    </nav>
  );
}
