import { useEffect, useRef, useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import type { ChecklistItem, LinkItem, Point } from '../types';
import { num, parseCsv, toCsv } from '../format';
import { uid } from '../store';

export function NumberInput({ value, onChange, placeholder, id }: { value: any; onChange: (v: number | '') => void; placeholder?: string; id?: string }) {
  const [text, setText] = useState(value === '' || value === null || value === undefined ? '' : String(value));
  // Re-sync when the value changes from outside (e.g. tapping a counter while the editor is open).
  useEffect(() => {
    if (num(text, NaN) !== value) setText(value === '' || value === null || value === undefined ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      id={id}
      className="input"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        const n = num(e.target.value, NaN);
        if (e.target.value.trim() === '') onChange('');
        else if (!Number.isNaN(n)) onChange(n);
      }}
    />
  );
}

export function PointsField({ value, onChange }: { value: Point[]; onChange: (v: Point[]) => void }) {
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState('');
  const set = (i: number, p: Partial<Point>) => onChange(value.map((pt, j) => (j === i ? { ...pt, ...p } : pt)));

  if (paste) {
    return (
      <div className="stack">
        <textarea
          className="input mono"
          rows={8}
          autoFocus
          value={text}
          placeholder={'Jan, 120\nFeb, 140\nMar, 180'}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row gap">
          <button
            className="btn primary"
            onClick={() => {
              const rows = parseCsv(text)
                .filter((r) => r.length >= 2 && !Number.isNaN(num(r[1], NaN)))
                .map((r) => ({ label: r[0], value: num(r[1]) }));
              if (rows.length) onChange(rows);
              setPaste(false);
            }}
          >
            Use this data
          </button>
          <button className="btn" onClick={() => setPaste(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="rows">
        {value.map((p, i) => (
          <div className="row-edit" key={i}>
            <input className="input" value={p.label} placeholder="Label" aria-label="Label" onChange={(e) => set(i, { label: e.target.value })} />
            <NumberInput value={p.value} onChange={(v) => set(i, { value: v === '' ? 0 : v })} placeholder="0" />
            <button className="icon-btn" aria-label="Remove row" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="row gap">
        <button className="btn ghost" onClick={() => onChange([...value, { label: '', value: 0 }])}>
          <Plus size={16} /> Add row
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setText(value.map((p) => `${p.label}, ${p.value}`).join('\n'));
            setPaste(true);
          }}
        >
          Paste data
        </button>
      </div>
    </div>
  );
}

export function ItemsField({ value, onChange }: { value: ChecklistItem[]; onChange: (v: ChecklistItem[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (!draft.trim()) return;
    onChange([...value, { id: uid(), text: draft.trim(), done: false }]);
    setDraft('');
  };
  return (
    <div className="stack">
      <div className="rows">
        {value.map((item) => (
          <div className="row-edit items" key={item.id}>
            <input
              type="checkbox"
              checked={item.done}
              aria-label="Done"
              onChange={(e) => onChange(value.map((i) => (i.id === item.id ? { ...i, done: e.target.checked } : i)))}
            />
            <input className="input" value={item.text} aria-label="Item" onChange={(e) => onChange(value.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i)))} />
            <button className="icon-btn" aria-label="Remove item" onClick={() => onChange(value.filter((i) => i.id !== item.id))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="row-edit add">
        <input
          className="input"
          value={draft}
          placeholder="Add an item and press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn" onClick={add} disabled={!draft.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

export function LinksField({ value, onChange }: { value: LinkItem[]; onChange: (v: LinkItem[]) => void }) {
  const set = (i: number, p: Partial<LinkItem>) => onChange(value.map((l, j) => (j === i ? { ...l, ...p } : l)));
  return (
    <div className="stack">
      <div className="rows">
        {value.map((l, i) => (
          <div className="row-edit" key={i}>
            <input className="input" value={l.label} placeholder="Name" aria-label="Link name" onChange={(e) => set(i, { label: e.target.value })} />
            <input className="input" value={l.url} placeholder="example.com" aria-label="Link address" inputMode="url" onChange={(e) => set(i, { url: e.target.value })} />
            <button className="icon-btn" aria-label="Remove link" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn ghost self-start" onClick={() => onChange([...value, { label: '', url: '' }])}>
        <Plus size={16} /> Add link
      </button>
    </div>
  );
}

export function CsvField({ value, onChange }: { value: string[][]; onChange: (v: string[][]) => void }) {
  const [text, setText] = useState(() => toCsv(value));
  return (
    <textarea
      className="input mono"
      rows={8}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseCsv(e.target.value));
      }}
    />
  );
}

export function NumbersField({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const [text, setText] = useState(() => (value ?? []).join(', '));
  return (
    <input
      className="input"
      value={text}
      placeholder="e.g. 4, 6, 5, 9, 12"
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(/[,\s]+/)
            .map((s) => num(s, NaN))
            .filter((n) => !Number.isNaN(n)),
        );
      }}
    />
  );
}

/** Downscale an uploaded image so it fits comfortably in local storage. */
function readImage(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const isData = value?.startsWith('data:');
  return (
    <div className="stack">
      <input
        className="input"
        value={isData ? '' : value ?? ''}
        placeholder={isData ? 'Uploaded image' : 'https://…'}
        inputMode="url"
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onChange(await readImage(f));
          e.target.value = '';
        }}
      />
      <button className="btn ghost self-start" onClick={() => file.current?.click()}>
        <Upload size={16} /> Upload from device
      </button>
    </div>
  );
}
