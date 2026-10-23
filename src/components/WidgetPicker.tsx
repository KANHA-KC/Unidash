import { useState } from 'react';
import { Search } from 'lucide-react';
import type { WidgetType } from '../types';
import { WIDGETS } from '../widgets/registry';
import { Sheet } from './Sheet';

const GROUPS = ['Numbers', 'Charts', 'Tracking', 'Content'] as const;

export function WidgetPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (t: WidgetType) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const matches = WIDGETS.filter((w) => !query || `${w.name} ${w.description} ${w.group}`.toLowerCase().includes(query));

  return (
    <Sheet open={open} onClose={onClose} title="Add a widget" wide>
      <div className="search">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search widgets" aria-label="Search widgets" />
      </div>
      {GROUPS.map((g) => {
        const list = matches.filter((w) => w.group === g);
        if (!list.length) return null;
        return (
          <section key={g} className="picker-group">
            <h3 className="eyebrow">{g}</h3>
            <div className="picker-grid">
              {list.map((w) => (
                <button key={w.type} className="picker-item" onClick={() => onPick(w.type)}>
                  <span className="picker-icon">
                    <w.icon size={20} />
                  </span>
                  <span className="picker-text">
                    <span className="picker-name">{w.name}</span>
                    <span className="muted small">{w.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {!matches.length && <p className="muted center pad">Nothing matches “{q}”.</p>}
    </Sheet>
  );
}
