import type { FieldInfo } from '../../shared/data.ts';
import { Database, Plus } from 'lucide-react';
import type { Aggregation, Binding, Widget } from '../types';
import { AGG_LABELS, BIND_KIND, defaultBinding, prettyField, type BindKind } from '../resolve';
import { reloadSources, useSources } from '../live';
import { navigate } from '../router';
import { LiveBadge } from './WidgetCard';

interface Props {
  widget: Widget;
  onChange: (binding: Binding | undefined) => void;
}

function Select({ label, value, onChange, options }: { label: string; value: string | number | undefined; onChange: (v: string) => void; options: { value: string | number; label: string }[] }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {value === undefined && <option value="">Choose…</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const fieldOptions = (fields: FieldInfo[], filter?: (f: FieldInfo) => boolean) =>
  fields.filter(filter ?? (() => true)).map((f) => ({ value: f.key, label: prettyField(f.key) }));
const isNum = (f: FieldInfo) => f.type === 'number';

export function BindingEditor({ widget, onChange }: Props) {
  const kind = BIND_KIND[widget.type] as BindKind;
  const { sources, loaded, error } = useSources();
  const b = widget.binding;
  const source = sources.find((s) => s.id === b?.sourceId);
  const fields = source?.fields ?? [];

  const connect = () => {
    reloadSources();
    const first = sources[0];
    onChange(first ? defaultBinding(kind, first.id, first.fields) : { sourceId: '' });
  };
  const set = (patch: Partial<Binding>) => onChange({ ...b!, ...patch });

  return (
    <div className="binding">
      <div className="field">
        <span className="field-label">Data</span>
        <div className="segmented" role="radiogroup" aria-label="Data">
          <button role="radio" aria-checked={!b} className={!b ? 'on' : ''} onClick={() => onChange(undefined)}>
            Type it in
          </button>
          <button role="radio" aria-checked={!!b} className={b ? 'on' : ''} onClick={() => !b && connect()}>
            Connect live data
          </button>
        </div>
      </div>

      {b && (
        <div className="binding-body">
          {error ? (
            <p className="muted small">{error}</p>
          ) : loaded && !sources.length ? (
            <div className="binding-empty">
              <Database size={20} />
              <p>No data sources yet. Connect a spreadsheet, an API or a webhook first.</p>
              <button className="btn primary" onClick={() => navigate('/data?new=1')}>
                <Plus size={16} /> Add a data source
              </button>
            </div>
          ) : (
            <>
              <Select
                label="Source"
                value={b.sourceId || undefined}
                options={[...sources.map((s) => ({ value: s.id, label: s.name })), { value: '__new', label: '+ New data source…' }]}
                onChange={(v) => {
                  if (v === '__new') return navigate('/data?new=1');
                  const s = sources.find((x) => x.id === v);
                  if (s) onChange(defaultBinding(kind, s.id, s.fields));
                }}
              />
              {source && !fields.length && <p className="muted small">This source has no data yet. Fields appear once the first rows arrive.</p>}

              {source && fields.length > 0 && kind === 'value' && (
                <div className="field-pair">
                  <Select
                    label="Show"
                    value={b.agg ?? 'latest'}
                    options={(Object.keys(AGG_LABELS) as Aggregation[]).map((a) => ({ value: a, label: AGG_LABELS[a] }))}
                    onChange={(v) => set({ agg: v as Aggregation })}
                  />
                  {b.agg !== 'count' && (
                    <Select label="Of field" value={b.field} options={fieldOptions(fields, isNum)} onChange={(v) => set({ field: v })} />
                  )}
                </div>
              )}

              {source && fields.length > 0 && kind === 'series' && (
                <>
                  <div className="field-pair">
                    <Select label="Along the bottom" value={b.labelField} options={fieldOptions(fields)} onChange={(v) => set({ labelField: v })} />
                    {b.agg !== 'count' && (
                      <Select label="Value" value={b.valueField} options={fieldOptions(fields, isNum)} onChange={(v) => set({ valueField: v })} />
                    )}
                  </div>
                  <div className="field-pair">
                    <Select
                      label="Rows"
                      value={b.agg ?? 'none'}
                      options={[
                        { value: 'none', label: 'One point per row' },
                        { value: 'sum', label: 'Group & total' },
                        { value: 'avg', label: 'Group & average' },
                        { value: 'count', label: 'Group & count' },
                        { value: 'max', label: 'Group & highest' },
                      ]}
                      onChange={(v) => set({ agg: v as Binding['agg'] })}
                    />
                    <Select
                      label="Show last"
                      value={b.limit ?? 30}
                      options={[10, 20, 30, 50, 100].map((n) => ({ value: n, label: `${n}` }))}
                      onChange={(v) => set({ limit: Number(v) })}
                    />
                  </div>
                </>
              )}

              {source && fields.length > 0 && kind === 'category' && (
                <div className="field-pair">
                  <Select label="Slices by" value={b.labelField} options={fieldOptions(fields, (f) => f.type !== 'number')} onChange={(v) => set({ labelField: v })} />
                  <Select
                    label="Size"
                    value={b.agg === 'count' ? '__count' : b.valueField}
                    options={[...fieldOptions(fields, isNum).map((o) => ({ ...o, label: `Total ${o.label.toLowerCase()}` })), { value: '__count', label: 'Number of rows' }]}
                    onChange={(v) => set(v === '__count' ? { agg: 'count', valueField: undefined } : { agg: 'sum', valueField: v })}
                  />
                </div>
              )}

              {source && fields.length > 0 && kind === 'table' && (
                <>
                  <div className="field">
                    <span className="field-label">Columns</span>
                    <div className="chips wrap-chips">
                      {fields.map((f) => {
                        const on = (b.columns ?? []).includes(f.key);
                        return (
                          <button
                            key={f.key}
                            className={`chip ${on ? 'on' : ''}`}
                            aria-pressed={on}
                            onClick={() => set({ columns: on ? b.columns!.filter((c) => c !== f.key) : [...(b.columns ?? []), f.key] })}
                          >
                            {prettyField(f.key)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Select
                    label="Rows to show"
                    value={b.limit ?? 8}
                    options={[5, 8, 10, 15, 25].map((n) => ({ value: n, label: `${n}` }))}
                    onChange={(v) => set({ limit: Number(v) })}
                  />
                </>
              )}

              {source && (
                <div className="binding-status">
                  <LiveBadge sourceId={source.id} />
                  <span className="muted small">{source.rowCount} {source.rowCount === 1 ? 'row' : 'rows'}</span>
                  <button className="link-btn small" onClick={() => navigate(`/data?source=${source.id}`)}>
                    Manage source
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
