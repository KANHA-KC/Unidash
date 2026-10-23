import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Automatically load .env if present (Node 22 native support with safe fallback)
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    const envPath = resolve('.env');
    if (existsSync(envPath)) (process as any).loadEnvFile(envPath);
  }
} catch {
  // If native loader fails, parse simply:
  try {
    const envPath = resolve('.env');
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  } catch {}
}

export const PORT = Number(process.env.PORT ?? 3001);
export const HOST = process.env.HOST ?? '127.0.0.1';
export const TRUST_LAN = process.env.UNIDASH_TRUST_LAN === '1';
export const DATA_DIR = resolve(process.env.UNIDASH_DATA_DIR ?? '.data');

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';

/**
 * Cloud mode is active when Supabase URL and keys are configured.
 * When false, Unidash stays in local-only single-machine mode.
 */
export const isCloudMode = Boolean(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY));

/**
 * True when Postgres persistence is active.
 */
export const hasPostgresPersistence = Boolean(DATABASE_URL || (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY));
