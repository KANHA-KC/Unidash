import { useEffect, useState, type ReactElement } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, ImagePlus, Minus, Plus, RotateCcw } from 'lucide-react';
import type { ChecklistItem, LinkItem, Point, Widget } from '../types';
import { BarChart, Donut, LineChart, Ring, Sparkline } from '../components/Charts';
import { fmt, num } from '../format';

interface Props {
  widget: Widget;
  /** Persist a change to this widget's data (interactive widgets work outside edit mode too). */
  onChange: (patch: Record<string, any>) => void;
  editing: boolean;
  /** Click-to-filter on category charts (donut slices, grouped bars). */
  onSelect?: (label: string) => void;
}

export function WidgetBody({ widget, onChange, editing, onSelect }: Props) {
  const d = widget.data;
  switch (widget.type) {
    case 'stat':
      return <Stat d={d} />;
    case 'progress':
      return <Progress d={d} />;
    case 'counter':
      return <Counter d={d} onChange={onChange} />;
    case 'line':
      return <LineChart points={(d.points as Point[]) ?? []} prefix={d.prefix} suffix={d.suffix} />;
    case 'bar':
      return <BarChart points={(d.points as Point[]) ?? []} prefix={d.prefix} suffix={d.suffix} selected={d.selected} onSelect={onSelect} />;
    case 'donut':
      return <Donut points={(d.points as Point[]) ?? []} prefix={d.prefix} suffix={d.suffix} selected={d.selected} onSelect={onSelect} />;
    case 'checklist':
      return <Checklist items={d.items ?? []} onChange={onChange} />;
    case 'table':
      return <Table rows={d.rows ?? []} />;
    case 'note':
      return <Note text={d.text ?? ''} />;
    case 'countdown':
      return <Countdown date={d.date} />;
    case 'clock':
      return <ClockView timeZone={d.timeZone} />;
    case 'links':
      return <Links links={d.links ?? []} editing={editing} />;
    case 'image':
      return <ImageView url={d.url} caption={d.caption} />;
    case 'heading':
      return d.subtitle ? <p className="heading-sub">{d.subtitle}</p> : null;
  }
}

function Stat({ d }: { d: Record<string, any> }) {
  const delta = d.delta === '' || d.delta === null || d.delta === undefined ? null : num(d.delta);
  const trend: number[] = Array.isArray(d.trend) ? d.trend : [];
  return (
    <div className="stat">
      <div className="stat-value">{fmt(num(d.value), d.prefix, d.suffix)}</div>
      {(delta !== null || d.caption) && (
        <div className="stat-meta">
          {delta !== null && (
            <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(delta)}%
            </span>
          )}
          {d.caption && <span className="muted">{d.caption}</span>}
        </div>
      )}
      {trend.length > 1 && <Sparkline values={trend} />}
    </div>
  );
}

function Progress({ d }: { d: Record<string, any> }) {
  const value = num(d.value);
  const target = num(d.target, 100) || 1;
  const ratio = value / target;
  const pct = Math.round(ratio * 100);
  if (d.style === 'bar') {
    return (
      <div className="progress-bar-wrap">
        <div className="progress-head">
          <span className="stat-value small">{fmt(value, d.prefix, d.suffix)}</span>
          <span className="muted">of {fmt(target, d.prefix, d.suffix)}</span>
        </div>
        <div className="bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
        <div className="muted small">{pct}% complete</div>
      </div>
    );
  }
  return (
    <div className="progress-ring-wrap">
      <Ring ratio={ratio}>
        <span className="ring-pct">{pct}%</span>
      </Ring>
      <div className="muted small center">
        {fmt(value, d.prefix, d.suffix)} of {fmt(target, d.prefix, d.suffix)}
      </div>
    </div>
  );
}

function Counter({ d, onChange }: { d: Record<string, any>; onChange: Props['onChange'] }) {
  const value = num(d.value);
  const step = num(d.step, 1) || 1;
  const goal = num(d.goal, 0);
  const reached = goal > 0 && value >= goal;
  return (
    <div className="counter">
      <div className="counter-row">
        <button className="round-btn" aria-label="Decrease" onClick={(e) => { e.stopPropagation(); onChange({ value: Math.max(0, value - step) }); }}>
          <Minus size={18} />
        </button>
        <div className="counter-value">
          <span className="stat-value">{fmt(value)}</span>
          {d.suffix && <span className="muted"> {d.suffix}</span>}
        </div>
        <button className="round-btn primary" aria-label="Increase" onClick={(e) => { e.stopPropagation(); onChange({ value: value + step }); }}>
          <Plus size={18} />
        </button>
      </div>
      {goal > 0 && (
        <>
          <div className="bar-track thin">
            <div className="bar-fill" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
          </div>
          <div className="counter-foot">
            <span className="muted small">{reached ? 'Goal reached 🎉' : `Goal ${fmt(goal)}`}</span>
            {value > 0 && (
              <button className="link-btn small" onClick={(e) => { e.stopPropagation(); onChange({ value: 0 }); }}>
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Checklist({ items, onChange }: { items: ChecklistItem[]; onChange: Props['onChange'] }) {
  const done = items.filter((i) => i.done).length;
  if (!items.length) return <p className="muted">No items yet.</p>;
  return (
    <div className="checklist">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              className={`check ${item.done ? 'done' : ''}`}
              aria-pressed={item.done}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ items: items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) });
              }}
            >
              <span className="box">{item.done && <Check size={13} strokeWidth={3} />}</span>
              <span className="check-text">{item.text}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="muted small">
        {done} of {items.length} done
      </div>
    </div>
  );
}

function Table({ rows }: { rows: string[][] }) {
  if (!rows.length) return <p className="muted">No rows yet.</p>;
  const [head, ...body] = rows;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>{head.map((_, j) => <td key={j}>{r[j] ?? ''}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ text }: { text: string }) {
  const blocks: ReactElement[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) blocks.push(<ul key={blocks.length}>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>);
    bullets = [];
  };
  text.split('\n').forEach((line) => {
    const m = line.match(/^\s*[-*•]\s+(.*)/);
    if (m) bullets.push(m[1]);
    else {
      flush();
      if (line.trim()) blocks.push(<p key={blocks.length}>{line}</p>);
    }
  });
  flush();
  return <div className="note">{blocks.length ? blocks : <p className="muted">Empty note</p>}</div>;
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function Countdown({ date }: { date?: string }) {
  const now = useNow(60_000);
  if (!date) return <p className="muted">Pick a date</p>;
  const target = new Date(`${date}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  const label = target.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div className="stat">
      <div className="stat-value">
        {days === 0 ? 'Today' : Math.abs(days)}
        {days !== 0 && <span className="unit">{Math.abs(days) === 1 ? ' day' : ' days'}</span>}
      </div>
      <div className="muted">{days < 0 ? `ago · ${label}` : label}</div>
    </div>
  );
}

function ClockView({ timeZone }: { timeZone?: string }) {
  const now = useNow(1000);
  let tz: string | undefined = timeZone?.trim() || undefined;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = undefined;
  }
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: tz });
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz });
  return (
    <div className="stat">
      <div className="stat-value tabular">{time}</div>
      <div className="muted">{date}</div>
    </div>
  );
}

function Links({ links, editing }: { links: LinkItem[]; editing: boolean }) {
  if (!links.length) return <p className="muted">No links yet.</p>;
  return (
    <ul className="links">
      {links.map((l, i) => {
        const href = /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`;
        let host = '';
        try {
          host = new URL(href).hostname.replace(/^www\./, '');
        } catch {
          host = l.url;
        }
        return (
          <li key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (editing) e.preventDefault();
                e.stopPropagation();
              }}
            >
              <span className="link-label">{l.label || host}</span>
              <span className="muted small">{host}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function ImageView({ url, caption }: { url?: string; caption?: string }) {
  if (!url)
    return (
      <div className="image-empty">
        <ImagePlus size={22} />
        <span>Add an image</span>
      </div>
    );
  return (
    <figure className="image">
      <img src={url} alt={caption || ''} loading="lazy" />
      {caption && <figcaption className="muted small">{caption}</figcaption>}
    </figure>
  );
}
