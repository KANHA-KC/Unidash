import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Template } from '../types';
import { CATEGORIES, TEMPLATES } from '../templates';
import { MiniPreview } from './MiniPreview';

/** Inline gallery used on the home screen and inside the "New dashboard" sheet. */
export function TemplateGallery({ onPick }: { onPick: (t: Template | null) => void }) {
  const [cat, setCat] = useState('All');
  const list = TEMPLATES.filter((t) => cat === 'All' || t.category === cat);

  return (
    <div>
      <div className="chips" role="tablist" aria-label="Template categories">
        {CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="card-grid">
        <button className="tpl-card blank" onClick={() => onPick(null)}>
          <span className="blank-icon">
            <Plus size={22} />
          </span>
          <span className="tpl-name">Blank dashboard</span>
          <span className="muted small">Start from scratch</span>
        </button>
        {list.map((t) => (
          <button key={t.id} className={`tpl-card accent-${t.accent}`} onClick={() => onPick(t)}>
            <MiniPreview sizes={t.widgets.map((w) => w.size)} />
            {t.live && (
              <span className="live-pill">
                <span className="live-dot" aria-hidden /> Live
              </span>
            )}
            <span className="tpl-name">
              <span aria-hidden>{t.emoji}</span> {t.name}
            </span>
            <span className="muted small">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
