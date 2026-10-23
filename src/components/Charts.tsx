import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactElement, type ReactNode } from 'react';
import type { Point } from '../types';
import { fmt } from '../format';

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

function niceTicks(lo: number, hi: number, count = 3) {
  if (lo === hi) {
    const pad = Math.abs(hi) || 1;
    lo -= pad / 2;
    hi += pad / 2;
  }
  const step = niceStep((hi - lo) / count);
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) out.push(+v.toPrecision(12));
  return out;
}

/** Pick evenly spaced label indexes so x labels never collide. */
function labelIndexes(labels: string[], width: number) {
  const n = labels.length;
  // Room per label grows with the longest label (11px text ≈ 6.2px per character).
  const longest = Math.max(...labels.map((l) => l.length), 1);
  const max = Math.max(2, Math.floor(width / Math.max(52, longest * 6.2 + 16)));
  if (n <= max) return new Set([...Array(n).keys()]);
  const step = Math.ceil((n - 1) / (max - 1));
  const set = new Set<number>();
  let last = 0;
  for (let i = 0; i < n; i += step) set.add((last = i));
  // Always label the newest point; drop its neighbour if they'd overlap.
  if (last !== n - 1 && n - 1 - last < step * 0.75) set.delete(last);
  set.add(n - 1);
  return set;
}

/** Axis labels need enough precision to tell neighbouring ticks apart. */
function tickFormat(ticks: number[], prefix: string, suffix: string) {
  const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1;
  const top = Math.max(...ticks.map(Math.abs));
  if (step >= 1000 && step / top > 0.05) return (t: number) => fmt(t, prefix, suffix);
  const decimals = Math.max(0, Math.min(4, -Math.floor(Math.log10(step))));
  const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals });
  return (t: number) => `${prefix}${nf.format(t)}${suffix}`;
}

interface ChartProps {
  points: Point[];
  prefix?: string;
  suffix?: string;
}

/** Click-to-filter: the selected category, and a toggle for a clicked one. */
interface SelectProps {
  selected?: string;
  onSelect?: (label: string) => void;
}

/** Enter/Space activate a selectable mark, like a button. */
const keyActivate = (run: () => void) => (e: { key: string; preventDefault: () => void }) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    run();
  }
};

const PAD_TOP = 16;
const PAD_BOTTOM = 24;

function Tooltip({ x, y, label, value }: { x: number; y: number; label: string; value: string }) {
  return (
    <div className="tip" style={{ left: x, top: y }}>
      <span className="tip-label">{label}</span>
      <span className="tip-value">{value}</span>
    </div>
  );
}

function Empty() {
  return <div className="chart-empty">Add some data to see a chart</div>;
}

export function LineChart({ points, prefix = '', suffix = '' }: ChartProps) {
  const [ref, { width, height: measured }] = useSize<HTMLDivElement>();
  const height = Math.max(150, measured);
  const [hover, setHover] = useState<number | null>(null);
  if (!points.length) return <Empty />;

  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values), height > 220 ? 4 : 3);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const tick = tickFormat(ticks, prefix, suffix);
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => (points.length === 1 ? width / 2 : 6 + (i * (width - 12)) / (points.length - 1));
  const y = (v: number) => PAD_TOP + plotH - ((v - lo) / (hi - lo)) * plotH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join('');
  const area = `${line}L${x(points.length - 1)},${PAD_TOP + plotH}L${x(0)},${PAD_TOP + plotH}Z`;
  const shown = labelIndexes(points.map((p) => p.label), width);

  const onMove = (e: RPointerEvent) => {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const rel = e.clientX - rect.left;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - rel) < Math.abs(x(best) - rel)) best = i;
    });
    setHover(best);
  };

  return (
    <div className="chart fill" ref={ref}>
      {width > 0 && (
        <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Line chart">
          <defs>
            <linearGradient id="area-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => (
            <g key={t}>
              <line x1={0} x2={width} y1={y(t)} y2={y(t)} className="gridline" />
              {/* The bottom label would sit on the line's start, so it's left off. */}
              {i > 0 && <text x={0} y={y(t) - 4} className="axis">{tick(t)}</text>}
            </g>
          ))}
          <path d={area} fill="url(#area-fade)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) =>
            shown.has(i) ? (
              <text key={i} x={x(i)} y={height - 6} className="axis" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
                {p.label}
              </text>
            ) : null,
          )}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD_TOP} y2={PAD_TOP + plotH} className="crosshair" />
              <circle cx={x(hover)} cy={y(points[hover].value)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
          <rect width={width} height={height} fill="transparent" />
        </svg>
      )}
      {hover !== null && (
        <Tooltip x={x(hover)} y={y(points[hover].value)} label={points[hover].label} value={fmt(points[hover].value, prefix, suffix)} />
      )}
    </div>
  );
}

function barPath(x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function BarChart({ points, prefix = '', suffix = '', selected, onSelect }: ChartProps & SelectProps) {
  const [ref, { width, height: measured }] = useSize<HTMLDivElement>();
  const height = Math.max(150, measured);
  const [hover, setHover] = useState<number | null>(null);
  if (!points.length) return <Empty />;

  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values), 4);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const tick = tickFormat(ticks, prefix, suffix);
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotH - ((v - lo) / (hi - lo)) * plotH;
  const slot = width / points.length;
  const barW = Math.max(4, Math.min(44, slot * 0.62));
  const shown = labelIndexes(points.map((p) => p.label), width);

  return (
    <div className="chart fill" ref={ref}>
      {width > 0 && (
        <svg width={width} height={height} onPointerLeave={() => setHover(null)} role="img" aria-label="Bar chart">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={width} y1={y(t)} y2={y(t)} className={t === 0 ? 'baseline' : 'gridline'} />
              <text x={0} y={y(t) - 4} className="axis">{tick(t)}</text>
            </g>
          ))}
          {points.map((p, i) => {
            const cx = slot * i + slot / 2;
            const top = y(Math.max(0, p.value));
            const h = Math.abs(y(p.value) - y(0));
            const lit = selected !== undefined ? p.label === selected || hover === i : hover === null || hover === i;
            const pick = onSelect ? () => onSelect(p.label) : undefined;
            return (
              <g
                key={i}
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
                onClick={pick}
                onKeyDown={pick && keyActivate(pick)}
                className={pick ? 'pickable' : undefined}
                role={pick ? 'button' : undefined}
                tabIndex={pick ? 0 : undefined}
                aria-pressed={pick ? p.label === selected : undefined}
                aria-label={pick ? `Filter by ${p.label}` : undefined}
              >
                <rect x={slot * i} y={PAD_TOP} width={slot} height={plotH} fill="transparent" />
                {p.value >= 0 ? (
                  <path d={barPath(cx - barW / 2, top, barW, h, 4)} fill="var(--accent)" opacity={lit ? 1 : 0.45} />
                ) : (
                  <rect x={cx - barW / 2} y={y(0)} width={barW} height={h} fill="var(--accent)" opacity={lit ? 1 : 0.45} />
                )}
                {shown.has(i) && (
                  <text x={cx} y={height - 6} className="axis" textAnchor="middle">{p.label}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && (
        <Tooltip
          x={slot * hover + slot / 2}
          y={y(Math.max(0, points[hover].value))}
          label={points[hover].label}
          value={fmt(points[hover].value, prefix, suffix)}
        />
      )}
    </div>
  );
}

const SERIES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`;
}

export function Donut({ points, prefix = '', suffix = '', selected, onSelect }: ChartProps & SelectProps) {
  const [hover, setHover] = useState<number | null>(null);
  // Beyond eight slices, fold the smallest into "Other" so colors never repeat.
  let slices = points.filter((p) => p.value > 0);
  const folded = slices.length > 8;
  if (folded) {
    const sorted = [...slices].sort((a, b) => b.value - a.value);
    slices = [...sorted.slice(0, 7), { label: 'Other', value: sorted.slice(7).reduce((s, p) => s + p.value, 0) }];
  }
  if (!slices.length) return <Empty />;
  const total = slices.reduce((s, p) => s + p.value, 0);
  const size = 140;
  const r = 56;
  let angle = 0;
  const selIndex = selected === undefined ? -1 : slices.findIndex((p) => p.label === selected);
  const active = hover ?? (selIndex >= 0 ? selIndex : null);
  const focus = active === null ? null : slices[active];
  // The folded "Other" slice isn't a real category, so it can't be picked.
  const pickFor = (p: Point, i: number) => (onSelect && !(folded && i === 7) ? () => onSelect(p.label) : undefined);

  return (
    <div className="donut">
      <div className="donut-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Breakdown chart">
          {slices.map((p, i) => {
            const a0 = angle;
            const a1 = angle + (p.value / total) * Math.PI * 2;
            angle = a1;
            const d = slices.length === 1 ? arc(70, 70, r, 0, Math.PI * 2 - 0.0001) : arc(70, 70, r, a0, a1);
            const pick = pickFor(p, i);
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={SERIES[i]}
                strokeWidth={active === i ? 20 : 16}
                opacity={active === null || active === i ? 1 : 0.4}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onClick={pick}
                className={`donut-slice ${pick ? 'pickable' : ''}`}
              />
            );
          })}
          {/* 2px surface gaps between slices */}
          {slices.length > 1 &&
            slices.reduce<{ a: number; lines: ReactElement[] }>(
              (acc, p, i) => {
                const a = acc.a;
                acc.lines.push(
                  <line key={i} x1={70 + 44 * Math.sin(a)} y1={70 - 44 * Math.cos(a)} x2={70 + 68 * Math.sin(a)} y2={70 - 68 * Math.cos(a)} stroke="var(--surface)" strokeWidth={2} pointerEvents="none" />,
                );
                acc.a += (p.value / total) * Math.PI * 2;
                return acc;
              },
              { a: 0, lines: [] },
            ).lines}
        </svg>
        <div className="donut-center">
          <span className="donut-total">{fmt(focus ? focus.value : total, prefix, suffix)}</span>
          <span className="donut-caption">{focus ? focus.label : 'Total'}</span>
        </div>
      </div>
      <ul className="legend">
        {slices.map((p, i) => {
          const pick = pickFor(p, i);
          return (
            <li
              key={i}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onClick={pick}
              onKeyDown={pick && keyActivate(pick)}
              role={pick ? 'button' : undefined}
              tabIndex={pick ? 0 : undefined}
              aria-pressed={pick ? p.label === selected : undefined}
              aria-label={pick ? `Filter by ${p.label}` : undefined}
              className={`${active === i ? 'on' : ''} ${selIndex >= 0 && selIndex !== i ? 'dim' : ''} ${pick ? 'pickable' : ''}`}
            >
              <span className="swatch" style={{ background: SERIES[i] }} />
              <span className="legend-label">{p.label}</span>
              <span className="legend-value">{Math.round((p.value / total) * 100)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sparkline({ values, height = 36 }: { values: number[]; height?: number }) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => 2 + (i * (width - 4)) / (values.length - 1);
  const y = (v: number) => 3 + (height - 6) * (1 - (v - lo) / span);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('');
  return (
    <div ref={ref} className="spark" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} aria-hidden>
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3} fill="var(--accent)" />
        </svg>
      )}
    </div>
  );
}

export function Ring({ ratio, size = 112, children }: { ratio: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${c * clamped} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-bar"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
