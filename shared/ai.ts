// AI dashboard contract shared by the browser app and the data server (blueprint §9).
// The model's output is untrusted: everything goes through sanitize* before it is stored or
// rendered. Unknown widget types and fields are dropped; bad values are repaired or dropped.
// Erasable TypeScript only (no enums/namespaces) so Node can run it without a build step.
// Keep the field lists in step with src/widgets/registry.ts.

import type { AccentName, Widget, WidgetSize, WidgetType } from '../src/types.ts';

type Kind =
  | 'number'
  | 'string'
  | 'text'
  | 'date'
  | 'timezone'
  | 'url'
  | 'points'
  | 'items'
  | 'links'
  | 'rows'
  | 'numbers'
  | { oneOf: string[] };

interface Spec {
  /** What the widget is for, shown to the model. */
  use: string;
  size: WidgetSize;
  fields: Record<string, Kind>;
}

export const WIDGET_SPECS: Record<WidgetType, Spec> = {
  stat: {
    use: 'One key number with optional % change and a small trend line',
    size: 'sm',
    fields: { value: 'number', prefix: 'string', suffix: 'string', delta: 'number', caption: 'string', trend: 'numbers' },
  },
  progress: {
    use: 'Progress toward a target (ring or bar)',
    size: 'sm',
    fields: { value: 'number', target: 'number', prefix: 'string', suffix: 'string', style: { oneOf: ['ring', 'bar'] } },
  },
  counter: {
    use: 'A tap-to-count tally, e.g. glasses of water',
    size: 'sm',
    fields: { value: 'number', step: 'number', goal: 'number', suffix: 'string' },
  },
  line: { use: 'A value over time', size: 'md', fields: { points: 'points', prefix: 'string', suffix: 'string' } },
  bar: { use: 'Compare values side by side', size: 'md', fields: { points: 'points', prefix: 'string', suffix: 'string' } },
  donut: { use: 'Parts of a whole, up to 6 slices', size: 'md', fields: { points: 'points', prefix: 'string', suffix: 'string' } },
  checklist: { use: 'To-dos, habits or steps', size: 'sm', fields: { items: 'items' } },
  table: { use: 'Rows and columns; first row is the header', size: 'md', fields: { rows: 'rows' } },
  note: { use: 'Free text; lines starting with "- " become bullets', size: 'sm', fields: { text: 'text' } },
  countdown: { use: 'Days until a date', size: 'sm', fields: { date: 'date' } },
  clock: { use: 'Current time in a time zone', size: 'sm', fields: { timeZone: 'timezone' } },
  links: { use: 'Shortcuts to websites', size: 'sm', fields: { links: 'links' } },
  image: { use: 'An image from a public https URL', size: 'sm', fields: { url: 'url', caption: 'string' } },
  heading: { use: 'A full-width section heading that groups the widgets after it', size: 'full', fields: { subtitle: 'string' } },
};

export const WIDGET_TYPES = Object.keys(WIDGET_SPECS) as WidgetType[];
export const SIZES: WidgetSize[] = ['sm', 'md', 'lg', 'full'];
export const ACCENTS: AccentName[] = ['blue', 'orange', 'aqua', 'violet', 'magenta', 'green', 'red'];
/** Widgets whose values are made-up examples and so carry the "Sample" tag (as in templates). */
const SAMPLE_TYPES: WidgetType[] = ['stat', 'progress', 'line', 'bar', 'donut', 'table'];

export const MAX_WIDGETS = 24;
const MAX_TEXT = 4000;
const MAX_LIST = 40;

/** A widget as the model describes it (no id; the app assigns one). */
export type DraftWidget = Omit<Widget, 'id'>;

export interface DraftDashboard {
  name: string;
  emoji: string;
  accent: AccentName;
  widgets: DraftWidget[];
}

export type EditOp =
  | { op: 'add_component'; widget: DraftWidget; index?: number }
  | { op: 'update_props'; id: string; title?: string; size?: WidgetSize; data?: Record<string, unknown> }
  | { op: 'move_component'; id: string; index: number }
  | { op: 'remove_component'; id: string };

// ───────────── Value repair ─────────────

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const rid = () => Math.random().toString(36).slice(2, 10);

function str(v: unknown, max = 120): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return undefined;
  return v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max);
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v.replace(/[,\s]/g, '')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : undefined;
}

function httpUrl(v: unknown): string | undefined {
  const s = str(v, 2000)?.trim();
  if (!s) return undefined;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}

function value(kind: Kind, v: unknown): unknown {
  if (typeof kind === 'object') return typeof v === 'string' && kind.oneOf.includes(v) ? v : undefined;
  switch (kind) {
    case 'number':
      return num(v);
    case 'string':
      return str(v);
    case 'text':
      return str(v, MAX_TEXT);
    case 'date': {
      const s = str(v, 40);
      return s && /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(s.slice(0, 10))) ? s.slice(0, 10) : undefined;
    }
    case 'timezone': {
      const s = str(v, 60)?.trim() ?? '';
      if (!s) return '';
      try {
        new Intl.DateTimeFormat('en', { timeZone: s });
        return s;
      } catch {
        return '';
      }
    }
    case 'url':
      return httpUrl(v) ?? '';
    case 'numbers':
      return Array.isArray(v) ? v.map(num).filter((n) => n !== undefined).slice(0, MAX_LIST) : undefined;
    case 'points':
      return Array.isArray(v)
        ? v
            .filter(isObj)
            .map((p) => ({ label: str(p.label, 40) ?? '', value: num(p.value) }))
            .filter((p): p is { label: string; value: number } => p.value !== undefined)
            .slice(0, MAX_LIST)
        : undefined;
    case 'items':
      return Array.isArray(v)
        ? v
            .map((i) => (typeof i === 'string' ? { text: i } : i))
            .filter(isObj)
            .map((i) => ({ id: rid(), text: str(i.text, 200) ?? '', done: i.done === true }))
            .filter((i) => i.text)
            .slice(0, MAX_LIST)
        : undefined;
    case 'links':
      return Array.isArray(v)
        ? v
            .filter(isObj)
            .map((l) => ({ label: str(l.label, 60) ?? '', url: httpUrl(l.url) }))
            .filter((l): l is { label: string; url: string } => !!l.url)
            .map((l) => ({ label: l.label || new URL(l.url).hostname, url: l.url }))
            .slice(0, MAX_LIST)
        : undefined;
    case 'rows': {
      if (!Array.isArray(v)) return undefined;
      const rows = v
        .filter(Array.isArray)
        .slice(0, MAX_LIST)
        .map((r) => (r as unknown[]).slice(0, 12).map((c) => str(c, 120) ?? ''));
      return rows.length ? rows : undefined;
    }
  }
}

/** Keep only the fields this widget type declares, each repaired or dropped. */
export function sanitizeData(type: WidgetType, data: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!isObj(data)) return out;
  for (const [key, kind] of Object.entries(WIDGET_SPECS[type].fields)) {
    if (!(key in data)) continue;
    const v = value(kind, data[key]);
    if (v !== undefined) out[key] = v;
  }
  return out;
}

const isType = (v: unknown): v is WidgetType => typeof v === 'string' && v in WIDGET_SPECS;
const isSize = (v: unknown): v is WidgetSize => typeof v === 'string' && (SIZES as string[]).includes(v);

/** A validated new widget, or null if the type is unknown. Generated values are marked sample. */
export function sanitizeWidget(raw: unknown): DraftWidget | null {
  if (!isObj(raw) || !isType(raw.type)) return null;
  const type = raw.type;
  const spec = WIDGET_SPECS[type];
  return {
    type,
    title: str(raw.title, 80)?.trim() || '',
    size: type === 'heading' ? 'full' : isSize(raw.size) ? raw.size : spec.size,
    data: sanitizeData(type, raw.data),
    ...(SAMPLE_TYPES.includes(type) ? { sample: true } : {}),
  };
}

function emoji(v: unknown): string {
  const s = str(v, 16)?.trim() ?? '';
  // One emoji-ish grapheme: no letters or digits, at most a few code points.
  return s && [...s].length <= 4 && !/[\p{L}\p{N}]/u.test(s) ? s : '✨';
}

/** Validate a whole generated dashboard. Throws if nothing usable is left. */
export function sanitizeDashboard(raw: unknown): DraftDashboard {
  if (!isObj(raw)) throw new Error('The model did not return a dashboard');
  const widgets = (Array.isArray(raw.widgets) ? raw.widgets : [])
    .map(sanitizeWidget)
    .filter((w): w is DraftWidget => !!w)
    .slice(0, MAX_WIDGETS);
  if (!widgets.some((w) => w.type !== 'heading')) throw new Error('The model did not return any widgets');
  return {
    name: str(raw.name, 60)?.trim() || 'New dashboard',
    emoji: emoji(raw.emoji),
    accent: typeof raw.accent === 'string' && (ACCENTS as string[]).includes(raw.accent) ? (raw.accent as AccentName) : 'blue',
    widgets,
  };
}

/**
 * Validate edit operations. Ops that name a widget id outside `ids` (the widgets the model was
 * shown) are dropped, as are unknown ops and fields.
 */
export function sanitizeOps(raw: unknown, ids: Set<string>, types: Map<string, WidgetType>): EditOp[] {
  const list = isObj(raw) && Array.isArray(raw.ops) ? raw.ops : Array.isArray(raw) ? raw : [];
  const out: EditOp[] = [];
  for (const o of list.slice(0, 30)) {
    if (!isObj(o)) continue;
    const index = num(o.index);
    if (o.op === 'add_component') {
      const widget = sanitizeWidget(o.widget);
      if (widget) out.push({ op: 'add_component', widget, ...(index !== undefined ? { index: Math.max(0, Math.floor(index)) } : {}) });
      continue;
    }
    const id = typeof o.id === 'string' && ids.has(o.id) ? o.id : null;
    if (!id) continue;
    if (o.op === 'remove_component') out.push({ op: 'remove_component', id });
    else if (o.op === 'move_component' && index !== undefined) out.push({ op: 'move_component', id, index: Math.max(0, Math.floor(index)) });
    else if (o.op === 'update_props') {
      const op: EditOp = { op: 'update_props', id };
      const title = str(o.title, 80)?.trim();
      if (title) op.title = title;
      if (isSize(o.size)) op.size = o.size;
      const type = types.get(id);
      if (type && isObj(o.data)) {
        const data = sanitizeData(type, o.data);
        if (Object.keys(data).length) op.data = data;
      }
      if (op.title || op.size || op.data) out.push(op);
    }
  }
  return out;
}

/** Apply edit operations to a widget list. Pure: the store records it as one undo step. */
export function applyOps(widgets: Widget[], ops: EditOp[], newId: () => string): Widget[] {
  let ws = [...widgets];
  for (const op of ops) {
    const i = 'id' in op ? ws.findIndex((w) => w.id === op.id) : -1;
    switch (op.op) {
      case 'add_component': {
        const at = Math.min(op.index ?? ws.length, ws.length);
        ws.splice(at, 0, { ...op.widget, id: newId() });
        break;
      }
      case 'remove_component':
        if (i >= 0) ws.splice(i, 1);
        break;
      case 'move_component': {
        if (i < 0) break;
        const [w] = ws.splice(i, 1);
        ws.splice(Math.min(op.index, ws.length), 0, w);
        break;
      }
      case 'update_props': {
        if (i < 0) break;
        const w = ws[i];
        ws[i] = {
          ...w,
          ...(op.title ? { title: op.title } : {}),
          ...(op.size && w.type !== 'heading' ? { size: op.size } : {}),
          ...(op.data ? { data: { ...w.data, ...op.data } } : {}),
        };
        break;
      }
    }
  }
  if (ws.length > MAX_WIDGETS * 2) ws = ws.slice(0, MAX_WIDGETS * 2);
  return ws;
}

// ───────────── What the model sees ─────────────

function kindDoc(kind: Kind): string {
  if (typeof kind === 'object') return kind.oneOf.map((o) => JSON.stringify(o)).join(' | ');
  return {
    number: 'number',
    string: 'short string',
    text: 'string (may contain \\n)',
    date: '"YYYY-MM-DD"',
    timezone: 'IANA time zone like "Europe/London", or "" for local',
    url: 'https URL or ""',
    points: '[{ "label": string, "value": number }]',
    items: '[{ "text": string, "done": boolean }]',
    links: '[{ "label": string, "url": https URL }]',
    rows: 'string[][] (first row = header)',
    numbers: 'number[] (oldest first)',
  }[kind];
}

/** Human-readable catalog of widget types and their data shapes, for the system prompt. */
export function widgetCatalog(): string {
  return WIDGET_TYPES.map((t) => {
    const s = WIDGET_SPECS[t];
    const fields = Object.entries(s.fields)
      .map(([k, kind]) => `${k}: ${kindDoc(kind)}`)
      .join('; ');
    return `- ${t} (${s.use}; default size ${s.size}) data: { ${fields} }`;
  }).join('\n');
}

function kindSchema(kind: Kind): Record<string, unknown> {
  if (typeof kind === 'object') return { type: 'string', enum: kind.oneOf };
  const obj = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
  switch (kind) {
    case 'number':
      return { type: 'number' };
    case 'numbers':
      return { type: 'array', items: { type: 'number' } };
    case 'points':
      return { type: 'array', items: obj({ label: { type: 'string' }, value: { type: 'number' } }) };
    case 'items':
      return { type: 'array', items: obj({ text: { type: 'string' }, done: { type: 'boolean' } }) };
    case 'links':
      return { type: 'array', items: obj({ label: { type: 'string' }, url: { type: 'string' } }) };
    case 'rows':
      return { type: 'array', items: { type: 'array', items: { type: 'string' } } };
    default:
      return { type: 'string' };
  }
}

/** JSON schema for structured output of a generated dashboard: one variant per widget type. */
export function dashboardJsonSchema(): Record<string, unknown> {
  const variants = WIDGET_TYPES.map((t) => {
    const fields = WIDGET_SPECS[t].fields;
    return {
      type: 'object',
      properties: {
        type: { type: 'string', const: t },
        title: { type: 'string' },
        size: { type: 'string', enum: SIZES },
        data: {
          type: 'object',
          properties: Object.fromEntries(Object.entries(fields).map(([k, kind]) => [k, kindSchema(kind)])),
          required: Object.keys(fields),
          additionalProperties: false,
        },
      },
      required: ['type', 'title', 'size', 'data'],
      additionalProperties: false,
    };
  });
  return {
    type: 'object',
    properties: {
      name: { type: 'string' },
      emoji: { type: 'string' },
      accent: { type: 'string', enum: ACCENTS },
      widgets: { type: 'array', items: { anyOf: variants } },
    },
    required: ['name', 'emoji', 'accent', 'widgets'],
    additionalProperties: false,
  };
}
