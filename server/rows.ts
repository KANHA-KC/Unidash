import type { Cell, FieldInfo, FieldType, Row } from '../shared/data.ts';

const MAX_KEYS = 60;
const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/** Flatten one JSON value into a row: nested objects become dotted keys, arrays become JSON text. */
export function toRow(value: unknown): Row {
  const row: Row = {};
  const walk = (v: unknown, prefix: string, depth: number) => {
    if (Object.keys(row).length >= MAX_KEYS) return;
    if (v === null || v === undefined) {
      if (prefix) row[prefix] = null;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      row[prefix || 'value'] = Number.isFinite(v as number) || typeof v === 'boolean' ? (v as Cell) : null;
    } else if (typeof v === 'string') {
      row[prefix || 'value'] = v.length > 500 ? v.slice(0, 500) : v;
    } else if (Array.isArray(v)) {
      row[prefix || 'value'] = JSON.stringify(v).slice(0, 500);
    } else if (typeof v === 'object' && depth < 3) {
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) walk(child, prefix ? `${prefix}.${k}` : k, depth + 1);
    } else {
      row[prefix || 'value'] = JSON.stringify(v).slice(0, 500);
    }
  };
  walk(value, '', 0);
  return row;
}

/** Find the array of records inside a response, optionally following a dotted path. */
export function extractRecords(body: unknown, rootPath?: string): { records: unknown[]; isList: boolean } {
  let node: unknown = body;
  if (rootPath?.trim()) {
    for (const part of rootPath.trim().split('.')) {
      if (node && typeof node === 'object') node = (node as Record<string, unknown>)[part];
      else {
        node = undefined;
        break;
      }
    }
    if (node === undefined) throw new Error(`Nothing found at “${rootPath}” in the response`);
  } else if (node && typeof node === 'object' && !Array.isArray(node)) {
    // Common wrappers: { data: [...] }, { results: [...] }, { items: [...] }, { rows: [...] }
    for (const key of ['data', 'results', 'items', 'rows', 'records']) {
      const inner = (node as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return { records: inner, isList: true };
    }
  }
  if (Array.isArray(node)) return { records: node, isList: true };
  return { records: [node], isList: false };
}

export function inferFields(rows: Row[]): FieldInfo[] {
  const order: string[] = [];
  const types = new Map<string, Set<FieldType>>();
  for (const row of rows.slice(-300)) {
    for (const [k, v] of Object.entries(row)) {
      if (!types.has(k)) {
        types.set(k, new Set());
        order.push(k);
      }
      if (v === null || v === '') continue;
      const t: FieldType =
        typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : DATE_RE.test(v) ? 'date' : 'string';
      types.get(k)!.add(t);
    }
  }
  return order.map((key) => {
    const set = types.get(key)!;
    // Mixed or empty columns are treated as text.
    const type: FieldType = set.size === 1 ? [...set][0] : 'string';
    return { key, type };
  });
}

/** Turn numeric-looking strings (from CSV or loose APIs) into numbers. */
export function coerceRow(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t !== '' && /^-?[\d,]*\.?\d+(e-?\d+)?$/i.test(t) && !/^0\d/.test(t)) {
        const n = Number(t.replace(/,/g, ''));
        out[k] = Number.isFinite(n) ? n : v;
        continue;
      }
      if (t === 'true' || t === 'false') {
        out[k] = t === 'true';
        continue;
      }
    }
    out[k] = v;
  }
  return out;
}
