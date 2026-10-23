const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export function fmt(n: number | undefined | null, prefix = '', suffix = ''): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  const body = Math.abs(n) >= 10000 ? compact.format(n) : plain.format(n);
  return `${prefix}${body}${suffix}`;
}

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(ts).toLocaleDateString();
}

export { parseCsv } from '../shared/csv.ts';

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '')}"` : c)).join(', ')).join('\n');
}
