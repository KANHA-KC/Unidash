import { useSyncExternalStore } from 'react';
import type { Dashboard, ThemePref, Widget } from './types';

const KEY = 'unidash.v2';

interface State {
  dashboards: Dashboard[];
  theme: ThemePref;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.dashboards)) return { theme: 'system', ...parsed };
    }
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return { dashboards: [], theme: 'system' };
}

let state: State = load();
const listeners = new Set<() => void>();

// Per-dashboard undo history (snapshots taken before each change).
const history = new Map<string, Dashboard[]>();
const HISTORY_LIMIT = 50;

// Cloud hooks for Phase 2 accounts & sync
type CloudAutosaveHook = (dashboards: Dashboard[]) => void;
type CloudVersionHook = (dashboard: Dashboard) => void;

let onCommitHook: CloudAutosaveHook | null = null;
let onSaveVersionHook: CloudVersionHook | null = null;

export function registerCloudHooks(hooks: {
  onCommit?: CloudAutosaveHook;
  onSaveVersion?: CloudVersionHook;
}) {
  if (hooks.onCommit) onCommitHook = hooks.onCommit;
  if (hooks.onSaveVersion) onSaveVersionHook = hooks.onSaveVersion;
}

export function replaceDashboards(dashboards: Dashboard[]) {
  commit({ ...state, dashboards });
}

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode: keep working in memory.
  }
  listeners.forEach((l) => l());
  onCommitHook?.(state.dashboards);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export const getState = () => state;

export function setTheme(theme: ThemePref) {
  commit({ ...state, theme });
}

export function addDashboard(d: Dashboard) {
  commit({ ...state, dashboards: [d, ...state.dashboards] });
}

export function removeDashboard(id: string) {
  commit({ ...state, dashboards: state.dashboards.filter((d) => d.id !== id) });
  history.delete(id);
}

export function restoreDashboard(d: Dashboard, index = 0) {
  const list = [...state.dashboards];
  list.splice(index, 0, d);
  commit({ ...state, dashboards: list });
}

export function updateDashboard(
  id: string,
  fn: (d: Dashboard) => Dashboard,
  opts: { history?: boolean; touch?: boolean } = {},
) {
  const current = state.dashboards.find((d) => d.id === id);
  if (!current) return;
  if (opts.history !== false) pushHistory(current);
  if (opts.touch !== false) {
    // The very first edit keeps the original as a version, so it can always be restored.
    if (!versions[id]?.length) saveVersion(current);
    scheduleVersion(id);
  }
  const changed = fn(current);
  // touch: false keeps updatedAt for metadata-only changes (e.g. publishing).
  const next = opts.touch === false ? changed : { ...changed, updatedAt: Date.now() };
  commit({ ...state, dashboards: state.dashboards.map((d) => (d.id === id ? next : d)) });
}

/** Record the current state so a series of un-tracked updates (e.g. a drag) can be undone as one step. */
export function snapshot(id: string) {
  const current = state.dashboards.find((d) => d.id === id);
  if (current) pushHistory(current);
}

function pushHistory(d: Dashboard) {
  const stack = history.get(d.id) ?? [];
  stack.push(d);
  if (stack.length > HISTORY_LIMIT) stack.shift();
  history.set(d.id, stack);
}

export function undo(id: string): boolean {
  const stack = history.get(id);
  const prev = stack?.pop();
  if (!prev) return false;
  commit({ ...state, dashboards: state.dashboards.map((d) => (d.id === id ? prev : d)) });
  return true;
}

export function updateWidget(
  dashId: string,
  widgetId: string,
  fn: (w: Widget) => Widget,
  opts?: { history?: boolean },
) {
  updateDashboard(
    dashId,
    (d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === widgetId ? fn(w) : w)) }),
    opts,
  );
}

export function patchWidgetData(dashId: string, widgetId: string, patch: Record<string, any>) {
  updateWidget(dashId, widgetId, (w) => ({ ...w, data: { ...w.data, ...patch } }));
}

// ───────────── Version history (last 20 saved versions per dashboard, this browser only) ─────────────

const VKEY = 'unidash.versions';
const VERSION_LIMIT = 20;
/** A version is saved once edits pause for this long, or when the user taps Done. */
const VERSION_IDLE_MS = 30_000;

export interface Version {
  at: number;
  dashboard: Dashboard;
}

function loadVersions(): Record<string, Version[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(VKEY) ?? '{}');
    // Drop history of dashboards that no longer exist.
    const ids = new Set(state.dashboards.map((d) => d.id));
    return Object.fromEntries(Object.entries(parsed).filter(([id, list]) => ids.has(id) && Array.isArray(list))) as Record<string, Version[]>;
  } catch {
    return {};
  }
}

let versions: Record<string, Version[]> = loadVersions();
const pending = new Map<string, ReturnType<typeof setTimeout>>();

/** What a version holds: the design, not sharing state or the current filter selection. */
function versionOf(d: Dashboard): Dashboard {
  const { publication: _p, filters: _f, dateRange: _r, ...rest } = structuredClone(d);
  return rest;
}
const sameContent = (a: Dashboard, b: Dashboard) =>
  JSON.stringify({ ...a, updatedAt: 0 }) === JSON.stringify({ ...b, updatedAt: 0 });

function saveVersion(d: Dashboard) {
  const list = versions[d.id] ?? [];
  const v = versionOf(d);
  if (list.length && sameContent(list[list.length - 1].dashboard, v)) return;
  versions = { ...versions, [d.id]: [...list, { at: d.updatedAt || Date.now(), dashboard: v }].slice(-VERSION_LIMIT) };
  try {
    localStorage.setItem(VKEY, JSON.stringify(versions));
  } catch {
    // Quota exceeded: history stays in memory for this visit.
  }
  listeners.forEach((l) => l());
  onSaveVersionHook?.(d);
}

function scheduleVersion(id: string) {
  clearTimeout(pending.get(id));
  pending.set(id, setTimeout(() => flushVersion(id), VERSION_IDLE_MS));
}

/** Save the current state as a version now (Done button, leaving the page). */
export function flushVersion(id: string) {
  const t = pending.get(id);
  if (t === undefined) return;
  clearTimeout(t);
  pending.delete(id);
  const d = state.dashboards.find((x) => x.id === id);
  if (d) saveVersion(d);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => [...pending.keys()].forEach(flushVersion));
}

const NO_VERSIONS: Version[] = [];

/** Saved versions, oldest first. */
export function useVersions(id: string): Version[] {
  const list = useSyncExternalStore(subscribe, () => versions[id] ?? NO_VERSIONS);
  return list;
}

/** Bring back a saved version. The current state is saved first, and the restore can be undone. */
export function restoreVersion(id: string, at: number) {
  const v = versions[id]?.find((x) => x.at === at);
  const current = state.dashboards.find((d) => d.id === id);
  if (!v || !current) return;
  flushVersion(id);
  saveVersion(current);
  updateDashboard(id, (d) => ({
    ...structuredClone(v.dashboard),
    id: d.id,
    createdAt: d.createdAt,
    publication: d.publication,
    filters: d.filters,
    dateRange: d.dateRange,
  }));
}
