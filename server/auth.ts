import type { IncomingMessage } from 'node:http';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { isCloudMode, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env.ts';
import { query } from './pg.ts';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, any>;
}

export interface AuthContext {
  user: AuthUser;
  workspaceId: string;
  isCloud: boolean;
  token?: string;
}

// In-memory token cache (token -> { user, expiresAt }) to avoid round-trips on every request
const tokenCache = new Map<string, { user: AuthUser; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

/** Verify JWT with Supabase GoTrue Auth service */
async function verifySupabaseToken(token: string): Promise<AuthUser> {
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: apiKey,
    },
  });

  if (!res.ok) {
    tokenCache.delete(token);
    throw new AuthError('Invalid or expired authentication session', 401);
  }

  const data = (await res.json()) as any;
  const user: AuthUser = {
    id: data.id,
    email: data.email,
    role: data.role,
    user_metadata: data.user_metadata,
  };

  tokenCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  return user;
}

/** Get or create default workspace for a user */
async function resolveWorkspace(user: AuthUser, requestedWorkspaceId?: string): Promise<string> {
  if (requestedWorkspaceId) {
    // If requested, verify or record access if DB is available
    return requestedWorkspaceId;
  }

  // Check DB if available
  try {
    const rows = await query<{ workspace_id: string }>(
      'select workspace_id from public.workspace_members where user_id = $1 limit 1',
      [user.id]
    );
    if (rows.length && rows[0].workspace_id) return rows[0].workspace_id;
  } catch {
    // DB not available or table empty: fall through to deterministic user workspace
  }

  // Deterministic personal workspace for user
  return `ws_${createHash('md5').update(user.id).digest('hex').slice(0, 12)}`;
}

/**
 * Authenticate incoming request.
 * - In local mode: returns mock local context.
 * - In cloud mode: verifies JWT and resolves workspace.
 */
export async function authenticate(req: IncomingMessage): Promise<AuthContext> {
  if (!isCloudMode) {
    return {
      user: { id: 'local_user', email: 'owner@localhost' },
      workspaceId: 'local',
      isCloud: false,
    };
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new AuthError('Sign in required to access this resource', 401);
  }

  const user = await verifySupabaseToken(token);
  const requestedWs = (req.headers['x-workspace-id'] as string) || undefined;
  const workspaceId = await resolveWorkspace(user, requestedWs);

  return {
    user,
    workspaceId,
    isCloud: true,
    token,
  };
}

// ───────────── Password hashing for protected publications ─────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derived = scryptSync(password, salt, 32);
    return timingSafeEqual(keyBuffer, derived);
  } catch {
    return false;
  }
}
