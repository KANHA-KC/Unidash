import { Pool } from 'pg';
import { DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.ts';

let pool: Pool | null = null;
let poolAvailable: boolean | null = null;

export function getPool(): Pool | null {
  if (pool) return pool;
  if (!DATABASE_URL) return null;

  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
      console.warn('[pg] Pool error, will retry on next query:', err.message);
      poolAvailable = false;
    });
  } catch (err) {
    console.warn('[pg] Could not initialize Postgres pool:', err);
    return null;
  }

  return pool;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const p = getPool();
  if (!p) throw new Error('Database not connected');
  try {
    const res = await p.query(text, params);
    poolAvailable = true;
    return res.rows as T[];
  } catch (err: any) {
    poolAvailable = false;
    throw err;
  }
}

/** Check whether Postgres connection is active and responsive */
export async function testConnection(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  try {
    await p.query('SELECT 1');
    poolAvailable = true;
    return true;
  } catch (err: any) {
    console.warn('[pg] Connection test failed:', err.message);
    poolAvailable = false;
    return false;
  }
}

/** Initialize core tables if they do not exist */
export async function initSchema(): Promise<void> {
  if (!DATABASE_URL) return;
  const p = getPool();
  if (!p) return;

  const ddl = `
    create table if not exists public.workspaces (
      id text primary key,
      name text not null,
      owner_id uuid,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    create table if not exists public.workspace_members (
      workspace_id text not null references public.workspaces(id) on delete cascade,
      user_id uuid not null,
      role text not null default 'member',
      created_at timestamptz default now(),
      primary key (workspace_id, user_id)
    );

    create table if not exists public.dashboards (
      id text primary key,
      workspace_id text not null references public.workspaces(id) on delete cascade,
      name text not null,
      schema_json jsonb not null,
      schema_version int not null default 1,
      status text not null default 'active',
      visibility text not null default 'private',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    create table if not exists public.dashboard_versions (
      id text primary key,
      dashboard_id text not null references public.dashboards(id) on delete cascade,
      version int not null default 1,
      schema_json jsonb not null,
      created_by uuid,
      created_at timestamptz default now()
    );

    create table if not exists public.data_sources (
      id text primary key,
      workspace_id text not null references public.workspaces(id) on delete cascade,
      name text not null,
      kind text not null,
      config_json jsonb not null default '{}'::jsonb,
      secret_reference jsonb default '{}'::jsonb,
      status text not null default 'idle',
      rows_json jsonb not null default '[]'::jsonb,
      fields_json jsonb not null default '[]'::jsonb,
      last_updated_at timestamptz,
      last_success_at timestamptz,
      error text,
      created_at timestamptz default now()
    );

    create table if not exists public.publications (
      token text primary key,
      dashboard_id text,
      dashboard_json jsonb not null,
      source_ids jsonb not null default '[]'::jsonb,
      share_mode text not null default 'public',
      password_hash text,
      expires_at timestamptz,
      published_at timestamptz default now()
    );
  `;

  try {
    await p.query(ddl);
    console.log('[pg] Schema verified in Postgres');
  } catch (err: any) {
    console.warn('[pg] Schema verification failed (continuing with existing schema/store):', err.message);
  }
}
