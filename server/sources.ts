import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Row, SourceConfig, SourceInfo, SourceKind, SourceSnapshot, DemoKind } from '../shared/data.ts';
import { INTERVALS, TIME_FIELD } from '../shared/data.ts';
import { csvToObjects } from '../shared/csv.ts';
import { db, save, type SourceRecord } from './store.ts';
import { coerceRow, extractRecords, inferFields, toRow } from './rows.ts';
import { safeFetch } from './net.ts';
import { DEMO_TICK_MS, demoHistory, demoRow } from './demo.ts';

/** With nobody watching, polling drops to twice a day ("lazy polling", addendum §2.1). */
const HIBERNATE_MS = 12 * 60 * 60 * 1000;
const MAX_BACKOFF_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ROWS: Record<SourceKind, number> = { csv: 5000, rest: 1000, webhook: 500, demo: 300 };
const INGEST_PER_SECOND = 30;

export class UserError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type Listener = (snap: SourceSnapshot) => void;
const listeners = new Map<string, Set<Listener>>();
const lastAttempt = new Map<string, number>();
const failures = new Map<string, number>();
const inflight = new Set<string>();
const ingestWindow = new Map<string, { second: number; count: number }>();

const id = () => `src_${randomBytes(6).toString('hex')}`;
const viewers = (sourceId: string) => listeners.get(sourceId)?.size ?? 0;

function find(sourceId: string, workspaceId?: string): SourceRecord {
  const rec = db.sources.find((s) => s.id === sourceId && (!workspaceId || !s.workspaceId || s.workspaceId === workspaceId || s.workspaceId === 'local'));
  if (!rec) throw new UserError('Data source not found', 404);
  return rec;
}

function liveStatus(rec: SourceRecord): SourceRecord['status'] {
  if (rec.status === 'error') return 'error';
  if (!rec.lastSuccessAt) return 'idle';
  if ((rec.kind === 'rest' || rec.kind === 'demo') && viewers(rec.id) === 0) return 'paused';
  return 'live';
}

export function info(rec: SourceRecord): SourceInfo {
  return {
    id: rec.id,
    name: rec.name,
    kind: rec.kind,
    config: rec.config,
    createdAt: rec.createdAt,
    status: liveStatus(rec),
    error: rec.error,
    lastUpdatedAt: rec.lastUpdatedAt,
    lastSuccessAt: rec.lastSuccessAt,
    rowCount: rec.rows.length,
    fields: rec.fields,
    headerNames: Object.keys(db.secrets[rec.id]?.headers ?? {}),
    viewers: viewers(rec.id),
  };
}

export function snapshot(rec: SourceRecord): SourceSnapshot {
  return {
    id: rec.id,
    name: rec.name,
    kind: rec.kind,
    status: liveStatus(rec),
    error: rec.error,
    intervalSec: rec.kind === 'rest' ? rec.config.intervalSec : rec.kind === 'demo' ? DEMO_TICK_MS / 1000 : undefined,
    lastUpdatedAt: rec.lastUpdatedAt,
    lastSuccessAt: rec.lastSuccessAt,
    fields: rec.fields,
    rows: rec.rows,
  };
}

function broadcast(rec: SourceRecord) {
  const snap = snapshot(rec);
  listeners.get(rec.id)?.forEach((l) => l(snap));
}

function applyRows(rec: SourceRecord, incoming: Row[], mode: 'append' | 'replace') {
  const max = rec.config.maxRows ?? DEFAULT_MAX_ROWS[rec.kind];
  const rows = mode === 'append' ? [...rec.rows, ...incoming] : incoming;
  rec.rows = rows.slice(-max);
  rec.fields = inferFields(rec.rows);
  rec.lastUpdatedAt = rec.lastSuccessAt = Date.now();
  rec.status = 'live';
  rec.error = undefined;
  save();
  broadcast(rec);
}

function fail(rec: SourceRecord, err: unknown) {
  rec.status = 'error';
  rec.error = err instanceof Error ? err.message : String(err);
  rec.lastUpdatedAt = Date.now();
  save();
  broadcast(rec);
}

// ───────────── CRUD ─────────────

export interface SourceInput {
  name?: string;
  kind?: SourceKind;
  config?: SourceConfig;
  /** REST: "Name: value" lines. Write-only. */
  headers?: string;
  /** CSV: parsed rows or raw CSV text. */
  rows?: Row[];
  csv?: string;
  /** Webhook: pre-fill with sample rows from a demo generator. */
  seedDemo?: DemoKind;
}

function parseHeaders(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i <= 0) continue;
    const name = line.slice(0, i).trim();
    if (!/^[\w-]+$/.test(name)) throw new UserError(`“${name}” isn’t a valid header name`);
    out[name] = line.slice(i + 1).trim();
  }
  return out;
}

function cleanConfig(kind: SourceKind, config: SourceConfig = {}): SourceConfig {
  const out: SourceConfig = {};
  if (kind === 'rest') {
    if (!config.url) throw new UserError('Add the API URL');
    out.url = String(config.url).trim();
    out.rootPath = config.rootPath?.trim() || undefined;
    const allowed = INTERVALS.map((i) => i.value);
    out.intervalSec = allowed.includes(Number(config.intervalSec)) ? Number(config.intervalSec) : 60;
  }
  if (kind === 'webhook' || kind === 'rest') out.mode = config.mode === 'replace' ? 'replace' : 'append';
  if (kind === 'demo') out.demo = (['store', 'api', 'automation'] as DemoKind[]).includes(config.demo!) ? config.demo : 'store';
  if (config.maxRows) out.maxRows = Math.max(10, Math.min(DEFAULT_MAX_ROWS[kind], Number(config.maxRows)));
  return out;
}

function csvRows(input: SourceInput): Row[] {
  const raw = input.csv !== undefined ? csvToObjects(input.csv) : input.rows ?? [];
  if (!Array.isArray(raw) || !raw.length) throw new UserError('The file has no rows (the first line should be column names)');
  return raw.slice(0, DEFAULT_MAX_ROWS.csv).map((r) => coerceRow(toRow(r)));
}

export function listSources(workspaceId?: string): SourceInfo[] {
  return db.sources
    .filter((s) => !workspaceId || !s.workspaceId || s.workspaceId === workspaceId || s.workspaceId === 'local')
    .map(info);
}

export function getSource(sourceId: string, workspaceId?: string) {
  return find(sourceId, workspaceId);
}

export async function createSource(input: SourceInput, workspaceId?: string): Promise<SourceInfo> {
  const kind = input.kind;
  if (!kind || !['csv', 'rest', 'webhook', 'demo'].includes(kind)) throw new UserError('Choose a source type');
  const rec: SourceRecord = {
    id: id(),
    workspaceId: workspaceId || 'local',
    name: input.name?.trim().slice(0, 80) || 'Untitled source',
    kind,
    config: cleanConfig(kind, input.config),
    createdAt: Date.now(),
    rows: [],
    fields: [],
    status: 'idle',
  };
  db.secrets[rec.id] = {};
  if (kind === 'rest' && input.headers) db.secrets[rec.id].headers = parseHeaders(input.headers);
  if (kind === 'webhook') db.secrets[rec.id].token = randomBytes(18).toString('base64url');
  db.sources.push(rec);

  if (kind === 'csv') applyRows(rec, csvRows(input), 'replace');
  if (kind === 'demo') applyRows(rec, demoHistory(rec.config.demo!), 'replace');
  if (kind === 'webhook' && input.seedDemo) applyRows(rec, demoHistory(input.seedDemo, 24, 15 * 60 * 1000), 'replace');
  if (kind === 'rest') await poll(rec);
  save();
  return info(rec);
}

export async function updateSource(sourceId: string, input: SourceInput, workspaceId?: string): Promise<SourceInfo> {
  const rec = find(sourceId, workspaceId);
  if (input.name !== undefined) rec.name = input.name.trim().slice(0, 80) || rec.name;
  if (input.config) rec.config = cleanConfig(rec.kind, { ...rec.config, ...input.config });
  if (input.headers !== undefined && rec.kind === 'rest') db.secrets[rec.id].headers = parseHeaders(input.headers);
  if (rec.kind === 'csv' && (input.rows || input.csv !== undefined)) applyRows(rec, csvRows(input), 'replace');
  if (rec.kind === 'rest' && (input.config || input.headers !== undefined)) await poll(rec);
  save();
  broadcast(rec);
  return info(rec);
}

export function deleteSource(sourceId: string, workspaceId?: string) {
  find(sourceId, workspaceId);
  db.sources = db.sources.filter((s) => s.id !== sourceId);
  delete db.secrets[sourceId];
  save();
}

export function clearRows(sourceId: string, workspaceId?: string) {
  const rec = find(sourceId, workspaceId);
  rec.rows = [];
  rec.fields = [];
  rec.lastSuccessAt = undefined;
  rec.status = 'idle';
  save();
  broadcast(rec);
  return info(rec);
}

export function webhookToken(sourceId: string, workspaceId?: string): string {
  const rec = find(sourceId, workspaceId);
  if (rec.kind !== 'webhook') throw new UserError('Only webhook sources have a token');
  return db.secrets[rec.id].token!;
}

export function rotateToken(sourceId: string, workspaceId?: string): string {
  webhookToken(sourceId, workspaceId);
  db.secrets[sourceId].token = randomBytes(18).toString('base64url');
  save();
  return db.secrets[sourceId].token!;
}

// ───────────── REST polling ─────────────

async function fetchRows(url: string, headers: Record<string, string>, rootPath?: string) {
  const { body } = await safeFetch(url, headers);
  if (typeof body === 'string') return { rows: csvRows({ csv: body }), isList: true };
  const { records, isList } = extractRecords(body, rootPath);
  const rows = records.slice(0, DEFAULT_MAX_ROWS.rest).map((r) => coerceRow(toRow(r)));
  return { rows, isList };
}

export async function poll(rec: SourceRecord) {
  if (rec.kind !== 'rest' || inflight.has(rec.id)) return;
  inflight.add(rec.id);
  lastAttempt.set(rec.id, Date.now());
  try {
    const { rows, isList } = await fetchRows(rec.config.url!, db.secrets[rec.id]?.headers ?? {}, rec.config.rootPath);
    failures.delete(rec.id);
    if (isList && rec.config.mode !== 'append') applyRows(rec, rows, 'replace');
    else applyRows(rec, rows.map((r) => ({ [TIME_FIELD]: new Date().toISOString(), ...r })), 'append');
  } catch (err) {
    failures.set(rec.id, (failures.get(rec.id) ?? 0) + 1);
    fail(rec, err);
  } finally {
    inflight.delete(rec.id);
  }
}

/** Try a REST endpoint without saving anything. */
export async function testRest(input: { url?: string; headers?: string; rootPath?: string }) {
  if (!input.url) throw new UserError('Add the API URL');
  try {
    const { rows } = await fetchRows(input.url.trim(), parseHeaders(input.headers ?? ''), input.rootPath);
    return { rows: rows.slice(0, 20), rowCount: rows.length, fields: inferFields(rows) };
  } catch (err) {
    if (err instanceof UserError) throw err;
    // Network and parsing problems are the user's to fix, so show them the real reason.
    throw new UserError(err instanceof Error ? err.message : String(err), 422);
  }
}

export async function refresh(sourceId: string, workspaceId?: string) {
  const rec = find(sourceId, workspaceId);
  if (rec.kind === 'rest') await poll(rec);
  else if (rec.kind === 'demo') applyRows(rec, [demoRow(rec.config.demo!, Date.now())], 'append');
  return info(rec);
}

// ───────────── Webhook ingest ─────────────

function tokenMatches(expected: string, given: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function ingest(sourceId: string, token: string, body: unknown): number {
  const rec = db.sources.find((s) => s.id === sourceId && s.kind === 'webhook');
  const expected = rec && db.secrets[rec.id]?.token;
  if (!rec || !expected || !tokenMatches(expected, token)) throw new UserError('Unknown source or wrong token', 401);

  const second = Math.floor(Date.now() / 1000);
  const win = ingestWindow.get(sourceId);
  if (win && win.second === second && win.count >= INGEST_PER_SECOND) throw new UserError('Too many events, slow down', 429);
  ingestWindow.set(sourceId, { second, count: win?.second === second ? win.count + 1 : 1 });

  const { records } = extractRecords(body);
  const now = new Date().toISOString();
  const rows = records.slice(0, 500).map((r) => {
    const row = coerceRow(toRow(r));
    return rec.config.mode === 'replace' || TIME_FIELD in row ? row : { [TIME_FIELD]: now, ...row };
  });
  applyRows(rec, rows, rec.config.mode === 'replace' ? 'replace' : 'append');
  return rows.length;
}

// ───────────── Live subscriptions ─────────────

/** Register a viewer. Their presence is what keeps fast polling and demo streams running. */
export function subscribe(sourceIds: string[], listener: Listener): () => void {
  const ids = sourceIds.filter((sid) => db.sources.some((s) => s.id === sid));
  for (const sid of ids) {
    if (!listeners.has(sid)) listeners.set(sid, new Set());
    listeners.get(sid)!.add(listener);
    const rec = find(sid);
    listener(snapshot(rec));
    // A viewer just arrived: refresh stale REST data right away instead of waiting for the next slot.
    if (rec.kind === 'rest' && Date.now() - (rec.lastSuccessAt ?? 0) > (rec.config.intervalSec ?? 60) * 1000) poll(rec);
    if (rec.kind === 'demo' && Date.now() - (rec.lastSuccessAt ?? 0) > DEMO_TICK_MS) applyRows(rec, [demoRow(rec.config.demo!, Date.now())], 'append');
    if (viewers(sid) === 1) broadcast(rec); // status flips from paused to live
  }
  return () => {
    for (const sid of ids) {
      listeners.get(sid)?.delete(listener);
      const rec = db.sources.find((s) => s.id === sid);
      if (rec && viewers(sid) === 0) broadcast(rec);
    }
  };
}

let demoClock = 0;
export function startScheduler() {
  setInterval(() => {
    const now = Date.now();
    demoClock += 1000;
    for (const rec of db.sources) {
      if (rec.kind === 'rest') {
        const watching = viewers(rec.id) > 0;
        const base = watching ? (rec.config.intervalSec ?? 60) * 1000 : HIBERNATE_MS;
        const fails = failures.get(rec.id) ?? 0;
        const wait = fails ? Math.min(base * 2 ** Math.min(fails, 6), Math.max(base, MAX_BACKOFF_MS)) : base;
        if (now - (lastAttempt.get(rec.id) ?? rec.lastSuccessAt ?? 0) >= wait) poll(rec);
      } else if (rec.kind === 'demo' && viewers(rec.id) > 0 && demoClock % DEMO_TICK_MS === 0) {
        applyRows(rec, [demoRow(rec.config.demo!, now)], 'append');
      }
    }
  }, 1000).unref();
}
