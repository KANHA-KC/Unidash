import type { FieldInfo, Row, SourceSnapshot } from '../shared/data.ts';
import { TIME_FIELD } from '../shared/data.ts';
import type { Aggregation, Binding, DashFilter, DateRange, Point, Widget, WidgetType } from './types';

/** How a widget type consumes data. */
export type BindKind = 'value' | 'series' | 'category' | 'table';

export const BIND_KIND: Partial<Record<WidgetType, BindKind>> = {
  stat: 'value',
  progress: 'value',
  line: 'series',
  bar: 'series',
  donut: 'category',
  table: 'table',
};

export const AGG_LABELS: Record<Aggregation, string> = {
  latest: 'Latest value',
  sum: 'Total',
  avg: 'Average',
  min: 'Lowest',
  max: 'Highest',
  count: 'Number of rows',
};

const toNum = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN);

function aggregate(values: number[], agg: Aggregation): number {
  const nums = values.filter(Number.isFinite);
  if (agg === 'count') return values.length;
  if (!nums.length) return agg === 'sum' ? 0 : NaN;
  switch (agg) {
    case 'latest':
      return nums[nums.length - 1];
    case 'sum':
      return nums.reduce((a, b) => a + b, 0);
    case 'avg':
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min':
      return Math.min(...nums);
    case 'max':
      return Math.max(...nums);
  }
}

const round = (n: number) => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100);

/** Short, readable label for a date-ish cell: time for today, otherwise day + month. */
function labelOf(v: unknown, field?: FieldInfo): string {
  if (v === null || v === undefined) return '—';
  if (field?.type === 'date') {
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime())) {
      const today = new Date().toDateString() === d.toDateString();
      return today
        ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  }
  return String(v);
}

/** Pick sensible default fields so a freshly connected widget shows something right away. */
export function defaultBinding(kind: BindKind, sourceId: string, fields: FieldInfo[]): Binding {
  const numeric = fields.filter((f) => f.type === 'number');
  const text = fields.filter((f) => f.type === 'string');
  const date = fields.find((f) => f.type === 'date');
  switch (kind) {
    case 'value':
      return { sourceId, field: numeric[0]?.key, agg: 'latest' };
    case 'series':
      return { sourceId, labelField: date?.key ?? text[0]?.key, valueField: numeric[0]?.key, agg: 'none', limit: 30 };
    case 'category':
      return { sourceId, labelField: text[0]?.key, valueField: numeric[0]?.key, agg: 'sum' };
    case 'table':
      return { sourceId, columns: fields.filter((f) => !f.key.startsWith('_')).slice(0, 5).map((f) => f.key), limit: 8 };
  }
}

function groupBy(rows: Row[], labelField: string, valueField: string | undefined, agg: Aggregation) {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    const key = String(r[labelField] ?? '—');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(agg === 'count' || !valueField ? 1 : toNum(r[valueField]));
  }
  return [...groups].map(([label, vals]) => ({ label, value: round(aggregate(vals, agg)) }));
}

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'hour', label: 'Last hour' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
];

/** The field a date range applies to: the arrival time if there is one, else the first date column. */
export function dateFieldOf(fields: FieldInfo[]): string | undefined {
  return fields.find((f) => f.key === TIME_FIELD)?.key ?? fields.find((f) => f.type === 'date')?.key;
}

function rangeStart(range: DateRange, now = Date.now()): number {
  if (range === 'hour') return now - 3_600_000;
  if (range === '7d') return now - 7 * 86_400_000;
  if (range === 'today') return new Date(now).setHours(0, 0, 0, 0);
  return -Infinity;
}

/**
 * The field a click on this widget filters by (donut slices, grouped bars), or undefined when its
 * points aren't categories — e.g. a line over time or one bar per row.
 */
export function selectableField(widget: Widget, fields: FieldInfo[] = []): string | undefined {
  const b = widget.binding;
  const kind = BIND_KIND[widget.type];
  if (!b?.labelField) return undefined;
  if (kind === 'category') return b.labelField;
  if (kind === 'series' && widget.type === 'bar' && b.agg && b.agg !== 'none') {
    return fields.find((f) => f.key === b.labelField)?.type === 'date' ? undefined : b.labelField;
  }
  return undefined;
}

export interface FilterContext {
  filters?: DashFilter[];
  dateRange?: DateRange;
}

/** Active filters for one source, minus the one a widget shows as its own categories. */
export function activeFilters(ctx: FilterContext | undefined, sourceId: string, except?: string) {
  return (ctx?.filters ?? []).filter((f) => f.sourceId === sourceId && f.value !== undefined && f.field !== except);
}

/** Apply dashboard filters and the date range before any aggregation. */
export function filterRows(snap: SourceSnapshot, ctx: FilterContext | undefined, except?: string): Row[] {
  const fs = activeFilters(ctx, snap.id, except);
  const range = ctx?.dateRange ?? 'all';
  const dateField = range === 'all' ? undefined : dateFieldOf(snap.fields);
  if (!fs.length && !dateField) return snap.rows;
  const start = rangeStart(range);
  return snap.rows.filter((r) => {
    for (const f of fs) if (String(r[f.field] ?? '—') !== f.value) return false;
    if (dateField) {
      const t = new Date(String(r[dateField])).getTime();
      if (!(t >= start)) return false;
    }
    return true;
  });
}

/**
 * Turn a source snapshot into the data shape the widget renders. Returns null when there is
 * nothing to show yet, so the widget can render a "waiting for data" state instead of zeros.
 * Filters apply to every widget on the source; a widget whose categories *are* the filtered field
 * keeps all of them and highlights the selection instead, so another slice can still be picked.
 */
export function resolveData(widget: Widget, snap: SourceSnapshot | undefined, ctx?: FilterContext): Record<string, any> | null {
  const b = widget.binding;
  const kind = BIND_KIND[widget.type];
  if (!b || !kind || !snap || !snap.rows.length) return null;
  const own = selectableField(widget, snap.fields);
  const rows = filterRows(snap, ctx, own);
  const selected = own ? (ctx?.filters ?? []).find((f) => f.sourceId === snap.id && f.field === own)?.value : undefined;
  const fieldInfo = (key?: string) => snap.fields.find((f) => f.key === key);

  if (kind === 'value') {
    if (!b.field && b.agg !== 'count') return null;
    const agg = (b.agg as Aggregation) ?? 'latest';
    const series = rows.map((r) => toNum(r[b.field!])).filter(Number.isFinite);
    const value = round(aggregate(agg === 'count' ? rows.map(() => 1) : series, agg));
    const out: Record<string, any> = { value };
    if (widget.type === 'stat') {
      out.trend = series.slice(-24);
      if (agg === 'latest' && series.length >= 2) {
        const prev = series[series.length - 2];
        out.delta = prev ? Math.round(((series[series.length - 1] - prev) / Math.abs(prev)) * 1000) / 10 : null;
      } else out.delta = null;
    }
    return out;
  }

  if (kind === 'series') {
    if (!b.valueField && b.agg !== 'count') return null;
    const label = b.labelField;
    let points: Point[];
    if (!b.agg || b.agg === 'none' || !label) {
      points = rows.slice(-(b.limit ?? 30)).map((r, i) => ({
        label: label ? labelOf(r[label], fieldInfo(label)) : String(i + 1),
        value: toNum(r[b.valueField!]),
      }));
    } else {
      points = groupBy(rows, label, b.valueField, b.agg).slice(-(b.limit ?? 30));
    }
    return { points: points.filter((p) => Number.isFinite(p.value)), selected };
  }

  if (kind === 'category') {
    if (!b.labelField) return null;
    const agg = !b.agg || b.agg === 'none' ? 'sum' : b.agg;
    const points = groupBy(rows, b.labelField, b.valueField, agg).sort((a, z) => z.value - a.value);
    return { points, selected };
  }

  // table
  const cols = b.columns?.length ? b.columns : snap.fields.slice(0, 5).map((f) => f.key);
  const recentFirst = snap.fields.some((f) => f.key === TIME_FIELD) || snap.kind === 'webhook' || snap.kind === 'demo';
  const picked = recentFirst ? rows.slice(-(b.limit ?? 8)).reverse() : rows.slice(0, b.limit ?? 8);
  return {
    rows: [
      cols.map(prettyField),
      ...picked.map((r) => cols.map((c) => labelOf(r[c], fieldInfo(c)))),
    ],
  };
}

/** "avg_order" → "Avg order", "_time" → "Time", "meta.client" → "Meta client" */
export function prettyField(key: string) {
  const s = key.replace(/^_+/, '').replace(/[._-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
