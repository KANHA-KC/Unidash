import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { GripVertical } from 'lucide-react';
import type { Widget } from '../types';
import { WidgetBody } from '../widgets/WidgetBody';
import { BIND_KIND, resolveData, selectableField, type FilterContext } from '../resolve';
import { freshness, useSnapshot, type Freshness } from '../live';
import { timeAgo } from '../format';

interface Props {
  widget: Widget;
  editing?: boolean;
  dragging?: boolean;
  onOpen?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onChange?: (patch: Record<string, any>) => void;
  /** Dashboard filters and date range, applied before aggregation. */
  filters?: FilterContext;
  /** Click-to-filter: a category was clicked on this widget's chart. */
  onSelect?: (sourceId: string, field: string, label: string) => void;
  grip?: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: () => void;
  };
}

function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

const LABEL: Record<Freshness, string> = {
  live: 'Live',
  stale: 'Stale',
  error: 'Error',
  waiting: 'Waiting',
  paused: 'Paused',
  static: 'Uploaded',
};

export function LiveBadge({ sourceId }: { sourceId: string }) {
  useTick(5000);
  const snap = useSnapshot(sourceId);
  const state = freshness(snap);
  const when = snap?.lastSuccessAt ? timeAgo(snap.lastSuccessAt) : null;
  const title =
    state === 'error' || state === 'stale'
      ? `${snap?.name}: ${snap?.error ?? 'not updated recently'}${when ? ` · last good data ${when}` : ''}`
      : `${snap?.name ?? 'Source'}${when ? ` · updated ${when}` : ''}`;
  return (
    <span className={`live-badge ${state}`} title={title}>
      <span className="live-dot" aria-hidden />
      {LABEL[state]}
      {when && state !== 'waiting' && <span className="live-when">· {when}</span>}
    </span>
  );
}

export function WidgetCard({ widget, editing = false, dragging, onOpen, onKeyDown, onChange, filters, onSelect, grip }: Props) {
  const bound = !!widget.binding && !!BIND_KIND[widget.type];
  const snap = useSnapshot(bound ? widget.binding!.sourceId : undefined);
  const resolved = bound ? resolveData(widget, snap, filters) : null;
  const pickField = bound && onSelect && !editing ? selectableField(widget, snap?.fields) : undefined;
  const select = pickField ? (label: string) => onSelect!(widget.binding!.sourceId, pickField, label) : undefined;
  const shown = resolved ? { ...widget, data: { ...widget.data, ...resolved } } : widget;
  const isHeading = widget.type === 'heading';

  return (
    <section
      data-wid={widget.id}
      className={`card size-${widget.size} type-${widget.type} ${isHeading ? 'heading-card' : ''} ${dragging ? 'dragging' : ''}`}
      onClick={editing ? onOpen : undefined}
      onKeyDown={editing ? onKeyDown : undefined}
      tabIndex={editing ? 0 : undefined}
      role={editing ? 'button' : undefined}
      aria-label={editing ? `Edit ${widget.title}. Alt plus arrow keys to move.` : undefined}
    >
      <header className="card-head">
        {isHeading ? <h2 className="section-title">{widget.title}</h2> : <h3 className="card-title">{widget.title}</h3>}
        <span className="card-tags">
          {bound && <LiveBadge sourceId={widget.binding!.sourceId} />}
          {!bound && widget.sample && <span className="sample-tag" title="Example values from the template. Edit or connect data to replace them.">Sample</span>}
          {editing && grip && (
            <button
              className="grip"
              aria-label={`Drag to move ${widget.title}`}
              onPointerDown={grip.onPointerDown}
              onPointerMove={grip.onPointerMove}
              onPointerUp={grip.onPointerUp}
              onPointerCancel={grip.onPointerUp}
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <GripVertical size={16} />
            </button>
          )}
        </span>
      </header>
      <div className="card-body">
        {bound && !resolved ? (
          <div className="waiting">
            <span className="live-dot pulse" aria-hidden />
            {snap?.status === 'error' ? snap.error : snap && !snap.rows.length ? 'Waiting for the first data…' : snap ? 'Pick fields to show' : 'Connecting…'}
          </div>
        ) : (
          <WidgetBody widget={shown} editing={editing} onChange={onChange ?? (() => {})} onSelect={select} />
        )}
      </div>
    </section>
  );
}
