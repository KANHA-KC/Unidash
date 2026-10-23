import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { FieldInfo, Row, SourceConfig, SourceKind, SourceStatus } from '../shared/data.ts';
import { hasPostgresPersistence } from './env.ts';
import { query } from './pg.ts';

export interface SourceRecord {
  id: string;
  workspaceId?: string;
  name: string;
  kind: SourceKind;
  config: SourceConfig;
  createdAt: number;
  rows: Row[];
  fields: FieldInfo[];
  status: SourceStatus;
  error?: string;
  lastUpdatedAt?: number;
  lastSuccessAt?: number;
}

/** Server-only values. Never sent to the browser except the webhook token, to its owner. */
export interface SourceSecrets {
  headers?: Record<string, string>;
  token?: string;
}

export type ShareMode = 'public' | 'private' | 'password';

export interface Publication {
  token: string;
  dashboard: unknown;
  /** Only these sources may be streamed to people holding the link. */
  sourceIds: string[];
  publishedAt: number;
  mode?: ShareMode;
  passwordHash?: string;
  expiresAt?: number;
  workspaceId?: string;
}

export interface DashboardRecord {
  id: string;
  workspaceId: string;
  name: string;
  schema: any;
  schemaVersion: number;
  status: string;
  visibility: string;
  createdAt: number;
  updatedAt: number;
}

interface Db {
  version: 1;
  sources: SourceRecord[];
  secrets: Record<string, SourceSecrets>;
  publications: Record<string, Publication>;
  dashboards: Record<string, DashboardRecord>;
  versions: Record<string, any[]>;
}

const DATA_DIR = resolve(process.env.UNIDASH_DATA_DIR ?? '.data');
const FILE = join(DATA_DIR, 'db.json');

function loadLocal(): Db {
  try {
    const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as Db;
    if (parsed.version === 1) {
      if (!parsed.dashboards) parsed.dashboards = {};
      if (!parsed.versions) parsed.versions = {};
      return parsed;
    }
  } catch {
    // First run or unreadable file: start empty.
  }
  return { version: 1, sources: [], secrets: {}, publications: {}, dashboards: {}, versions: {} };
}

export const db: Db = loadLocal();

let timer: NodeJS.Timeout | null = null;

/** Debounced, atomic write (temp file + rename) so a crash never leaves a half-written database. */
export function save() {
  if (timer) return;
  timer = setTimeout(flush, 400);
}

export function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(db), { mode: 0o600 });
  renameSync(tmp, FILE);

  if (hasPostgresPersistence) {
    syncToPostgres().catch((err) => console.warn('[pg sync error]:', err.message));
  }
}

/** Sync in-memory changes to Postgres if configured */
async function syncToPostgres() {
  try {
    // Sync sources
    for (const s of db.sources) {
      const secrets = db.secrets[s.id] ?? {};
      await query(
        `insert into public.data_sources (id, workspace_id, name, kind, config_json, secret_reference, status, rows_json, fields_json, last_updated_at, last_success_at, error)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         on conflict (id) do update set
           name = excluded.name,
           config_json = excluded.config_json,
           secret_reference = excluded.secret_reference,
           status = excluded.status,
           rows_json = excluded.rows_json,
           fields_json = excluded.fields_json,
           last_updated_at = excluded.last_updated_at,
           last_success_at = excluded.last_success_at,
           error = excluded.error`,
        [
          s.id,
          s.workspaceId ?? 'local',
          s.name,
          s.kind,
          JSON.stringify(s.config),
          JSON.stringify(secrets),
          s.status,
          JSON.stringify(s.rows),
          JSON.stringify(s.fields),
          s.lastUpdatedAt ? new Date(s.lastUpdatedAt) : null,
          s.lastSuccessAt ? new Date(s.lastSuccessAt) : null,
          s.error ?? null,
        ]
      );
    }

    // Sync publications
    for (const [token, pub] of Object.entries(db.publications)) {
      await query(
        `insert into public.publications (token, dashboard_json, source_ids, share_mode, password_hash, expires_at, published_at)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (token) do update set
           dashboard_json = excluded.dashboard_json,
           source_ids = excluded.source_ids,
           share_mode = excluded.share_mode,
           password_hash = excluded.password_hash,
           expires_at = excluded.expires_at,
           published_at = excluded.published_at`,
        [
          token,
          JSON.stringify(pub.dashboard),
          JSON.stringify(pub.sourceIds),
          pub.mode ?? 'public',
          pub.passwordHash ?? null,
          pub.expiresAt ? new Date(pub.expiresAt) : null,
          new Date(pub.publishedAt),
        ]
      );
    }

    // Sync dashboards
    for (const [id, d] of Object.entries(db.dashboards)) {
      await query(
        `insert into public.dashboards (id, workspace_id, name, schema_json, schema_version, status, visibility, updated_at, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (id) do update set
           name = excluded.name,
           schema_json = excluded.schema_json,
           updated_at = excluded.updated_at`,
        [
          id,
          d.workspaceId,
          d.name,
          JSON.stringify(d.schema),
          d.schemaVersion || 1,
          d.status || 'active',
          d.visibility || 'private',
          new Date(d.updatedAt),
          new Date(d.createdAt),
        ]
      );
    }
  } catch (err: any) {
    console.warn('[store] Postgres sync deferred:', err.message);
  }
}

/** Initial load from Postgres on server boot if available */
export async function loadFromPostgres(): Promise<void> {
  if (!hasPostgresPersistence) return;
  try {
    const sources = await query<any>('select * from public.data_sources');
    for (const r of sources) {
      const idx = db.sources.findIndex((s) => s.id === r.id);
      const rec: SourceRecord = {
        id: r.id,
        workspaceId: r.workspace_id,
        name: r.name,
        kind: r.kind,
        config: typeof r.config_json === 'string' ? JSON.parse(r.config_json) : r.config_json,
        createdAt: new Date(r.created_at).getTime(),
        rows: typeof r.rows_json === 'string' ? JSON.parse(r.rows_json) : r.rows_json,
        fields: typeof r.fields_json === 'string' ? JSON.parse(r.fields_json) : r.fields_json,
        status: r.status,
        error: r.error,
        lastUpdatedAt: r.last_updated_at ? new Date(r.last_updated_at).getTime() : undefined,
        lastSuccessAt: r.last_success_at ? new Date(r.last_success_at).getTime() : undefined,
      };
      if (idx >= 0) db.sources[idx] = rec;
      else db.sources.push(rec);
      if (r.secret_reference) {
        db.secrets[r.id] = typeof r.secret_reference === 'string' ? JSON.parse(r.secret_reference) : r.secret_reference;
      }
    }

    const pubs = await query<any>('select * from public.publications');
    for (const p of pubs) {
      db.publications[p.token] = {
        token: p.token,
        dashboard: typeof p.dashboard_json === 'string' ? JSON.parse(p.dashboard_json) : p.dashboard_json,
        sourceIds: typeof p.source_ids === 'string' ? JSON.parse(p.source_ids) : p.source_ids,
        publishedAt: new Date(p.published_at).getTime(),
        mode: p.share_mode,
        passwordHash: p.password_hash,
        expiresAt: p.expires_at ? new Date(p.expires_at).getTime() : undefined,
      };
    }

    const dashes = await query<any>('select * from public.dashboards');
    for (const d of dashes) {
      db.dashboards[d.id] = {
        id: d.id,
        workspaceId: d.workspace_id,
        name: d.name,
        schema: typeof d.schema_json === 'string' ? JSON.parse(d.schema_json) : d.schema_json,
        schemaVersion: d.schema_version,
        status: d.status,
        visibility: d.visibility,
        createdAt: new Date(d.created_at).getTime(),
        updatedAt: new Date(d.updated_at).getTime(),
      };
    }

    console.log(`[store] Loaded from Postgres: ${sources.length} sources, ${pubs.length} publications, ${dashes.length} dashboards`);
  } catch (err: any) {
    console.warn('[store] Could not load from Postgres, using local store:', err.message);
  }
}
