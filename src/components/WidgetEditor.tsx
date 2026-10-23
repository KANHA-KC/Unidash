import { useState, type ReactElement, type ReactNode } from 'react';
import { Copy, Trash } from 'lucide-react';
import type { Page, Widget, WidgetSize } from '../types';
import { getDef, SIZES, type Field } from '../widgets/registry';
import { Sheet } from './Sheet';
import { BindingEditor } from './BindingEditor';
import { BIND_KIND } from '../resolve';
import { CsvField, ImageField, ItemsField, LinksField, NumberInput, NumbersField, PointsField } from './Fields';

interface Props {
  widget: Widget | null;
  onClose: () => void;
  onUpdate: (fn: (w: Widget) => Widget) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** When the dashboard has several pages: the widget's current page and a way to move it. */
  pages?: Page[];
  pageId?: string;
  onMoveToPage?: (pageId: string) => void;
  /** "Ask AI" for this widget; call onApplied after an AI edit so the fields show the new values. */
  askAi?: (onApplied: () => void) => ReactNode;
}

export function WidgetEditor({ widget, onClose, onUpdate, onDuplicate, onDelete, pages, pageId, onMoveToPage, askAi }: Props) {
  const [aiRev, setAiRev] = useState(0);
  if (!widget) return null;
  const def = getDef(widget.type);
  // Any hand edit to the data means it's no longer template sample data.
  const setData = (key: string, value: any) => onUpdate((w) => ({ ...w, sample: false, data: { ...w.data, [key]: value } }));

  return (
    <Sheet
      open
      onClose={onClose}
      variant="right"
      title={`Edit ${def.name.toLowerCase()}`}
      footer={
        <>
          <button className="btn ghost" onClick={onDuplicate}>
            <Copy size={16} /> Duplicate
          </button>
          <button className="btn ghost danger" onClick={onDelete}>
            <Trash size={16} /> Delete
          </button>
          <span className="spacer" />
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      {askAi?.(() => setAiRev((r) => r + 1))}
      {/* Keyed by widget (and AI edit) so field-local text state resets when the values change underneath. */}
      <div className="form" key={`${widget.id}:${aiRev}`}>
        <label className="field">
          <span className="field-label">Title</span>
          <input className="input" value={widget.title} onChange={(e) => onUpdate((w) => ({ ...w, title: e.target.value }))} />
        </label>

        {widget.type !== 'heading' && (
          <div className="field">
            <span className="field-label">Size</span>
            <div className="segmented" role="radiogroup" aria-label="Size">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  role="radio"
                  aria-checked={widget.size === s.value}
                  className={widget.size === s.value ? 'on' : ''}
                  onClick={() => onUpdate((w) => ({ ...w, size: s.value as WidgetSize }))}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {pages && pages.length > 1 && onMoveToPage && (
          <label className="field">
            <span className="field-label">Page</span>
            <select className="input" value={pageId} onChange={(e) => onMoveToPage(e.target.value)}>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>{p.name || 'Untitled'}</option>
              ))}
            </select>
          </label>
        )}

        {BIND_KIND[widget.type] && (
          <BindingEditor widget={widget} onChange={(binding) => onUpdate((w) => ({ ...w, binding, sample: binding ? false : w.sample }))} />
        )}

        {def.fields.filter((f) => !(f.manual && widget.binding)).map((f) => (
          <FieldRow key={f.key} field={f} value={widget.data[f.key]} onChange={(v) => setData(f.key, v)} imageMode={widget.type === 'image'} />
        ))}
      </div>
    </Sheet>
  );
}

function FieldRow({ field, value, onChange, imageMode }: { field: Field; value: any; onChange: (v: any) => void; imageMode: boolean }) {
  const id = `f-${field.key}`;
  const hint = 'hint' in field ? field.hint : undefined;
  let control: ReactElement;
  switch (field.kind) {
    case 'text':
    case 'date':
      control = (
        <input id={id} className="input" type={field.kind === 'date' ? 'date' : 'text'} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case 'url':
      control = imageMode ? (
        <ImageField value={value ?? ''} onChange={onChange} />
      ) : (
        <input id={id} className="input" inputMode="url" value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case 'textarea':
      control = <textarea id={id} className="input" rows={7} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'number':
      control = <NumberInput id={id} value={value} placeholder={field.placeholder} onChange={onChange} />;
      break;
    case 'select':
      control = (
        <div className="segmented" role="radiogroup" aria-label={field.label}>
          {field.options.map((o) => (
            <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      );
      break;
    case 'points':
      control = <PointsField value={value ?? []} onChange={onChange} />;
      break;
    case 'items':
      control = <ItemsField value={value ?? []} onChange={onChange} />;
      break;
    case 'links':
      control = <LinksField value={value ?? []} onChange={onChange} />;
      break;
    case 'csv':
      control = <CsvField value={value ?? []} onChange={onChange} />;
      break;
    case 'numbers':
      control = <NumbersField value={value ?? []} onChange={onChange} />;
      break;
  }
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {field.label}
      </label>
      {control}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
