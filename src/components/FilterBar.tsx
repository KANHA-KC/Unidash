import { Clock, X } from 'lucide-react';
import type { DashFilter, DateRange, Widget } from '../types';
import { DATE_RANGES, dateFieldOf, prettyField } from '../resolve';
import { getSnapshot, useSnapshot } from '../live';

interface Props {
  widgets: Widget[];
  filters: DashFilter[];
  dateRange: DateRange;
  onChange: (next: { filters?: DashFilter[]; dateRange?: DateRange }) => void;
  /** Offer "+ Filter" to add a dropdown for a field (the editor; shared viewers only use what's there). */
  canAdd?: boolean;
}

const MAX_VALUES = 60;

/**
 * Slim row of dashboard filters: a date range for sources with a date field, a dropdown per
 * pinned field, and a removable chip per clicked value. Everything here only filters what is
 * shown — nothing is written back to the source.
 */
export function FilterBar({ widgets, filters, dateRange, onChange, canAdd }: Props) {
  useSnapshot(); // re-render as snapshots arrive, so new values show up in the dropdowns
  const sourceIds = [...new Set(widgets.flatMap((w) => (w.binding ? [w.binding.sourceId] : [])))];
  const snaps = sourceIds.map((id) => getSnapshot(id)).filter((s) => !!s);
  if (!sourceIds.length) return null;

  const hasDate = snaps.some((s) => dateFieldOf(s.fields));
  const many = snaps.length > 1;
  const nameOf = (f: DashFilter) => {
    const snap = getSnapshot(f.sourceId);
    return `${many && snap ? `${snap.name} · ` : ''}${prettyField(f.field)}`;
  };
  const valuesOf = (f: DashFilter) => {
    const rows = getSnapshot(f.sourceId)?.rows ?? [];
    const set = new Set(rows.map((r) => String(r[f.field] ?? '—')));
    if (f.value !== undefined) set.add(f.value);
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, MAX_VALUES);
  };

  const same = (a: DashFilter, b: DashFilter) => a.sourceId === b.sourceId && a.field === b.field;
  const setValue = (f: DashFilter, value: string | undefined) =>
    onChange({ filters: filters.map((x) => (same(x, f) ? { ...x, value } : x)) });
  const remove = (f: DashFilter) => onChange({ filters: filters.filter((x) => !same(x, f)) });

  // Text and yes/no fields make sensible dropdowns; numbers and dates don't.
  const addable = canAdd
    ? snaps.flatMap((s) =>
        s.fields
          .filter((fi) => (fi.type === 'string' || fi.type === 'boolean') && !fi.key.startsWith('_'))
          .filter((fi) => !filters.some((f) => f.sourceId === s.id && f.field === fi.key))
          .map((fi) => ({ key: `${s.id}\u0000${fi.key}`, label: `${many ? `${s.name} · ` : ''}${prettyField(fi.key)}` })),
      )
    : [];

  if (!hasDate && !filters.length && !addable.length) return null;

  return (
    <div className="filter-bar" role="toolbar" aria-label="Filters">
      {hasDate && (
        <label className={`filter-chip select ${dateRange !== 'all' ? 'on' : ''}`}>
          <Clock size={14} aria-hidden />
          <select value={dateRange} aria-label="Date range" onChange={(e) => onChange({ dateRange: e.target.value as DateRange })}>
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
      )}
      {filters.map((f) =>
        f.pinned ? (
          <span key={`${f.sourceId}:${f.field}`} className={`filter-chip select ${f.value !== undefined ? 'on' : ''}`}>
            <label className="filter-select">
              <span className="filter-name">{nameOf(f)}:</span>
              <select
                value={f.value ?? ''}
                aria-label={`Filter by ${nameOf(f)}`}
                onChange={(e) => setValue(f, e.target.value === '' ? undefined : e.target.value)}
              >
                <option value="">All</option>
                {valuesOf(f).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            {canAdd && (
              <button className="filter-x" aria-label={`Remove ${nameOf(f)} filter`} onClick={() => remove(f)}>
                <X size={13} />
              </button>
            )}
          </span>
        ) : f.value !== undefined ? (
          <span key={`${f.sourceId}:${f.field}`} className="filter-chip on">
            <span className="filter-name">{nameOf(f)}:</span> {f.value}
            <button className="filter-x" aria-label={`Clear ${nameOf(f)} filter`} onClick={() => remove(f)}>
              <X size={13} />
            </button>
          </span>
        ) : null,
      )}
      {addable.length > 0 && (
        <label className="filter-chip select add">
          <select
            value=""
            aria-label="Add a filter"
            onChange={(e) => {
              const [sourceId, field] = e.target.value.split('\u0000');
              if (field) onChange({ filters: [...filters, { sourceId, field, pinned: true }] });
            }}
          >
            <option value="" disabled>+ Filter</option>
            {addable.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
