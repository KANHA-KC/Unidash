import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { db, flush, loadFromPostgres, save, type DashboardRecord, type Publication, type ShareMode } from './store.ts';
import {
  UserError,
  clearRows,
  createSource,
  deleteSource,
  ingest,
  listSources,
  refresh,
  rotateToken,
  startScheduler,
  subscribe,
  testRest,
  updateSource,
  webhookToken,
} from './sources.ts';
import { editDashboard, generateDashboard } from './ai.ts';
import { isCloudMode, HOST, PORT, TRUST_LAN } from './env.ts';
import { authenticate, hashPassword, verifyPassword, type AuthContext } from './auth.ts';
import { initSchema } from './pg.ts';

const DIST = resolve('dist');
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * Is this request from the owner's own machine? The Vite dev proxy forwards with
 * x-forwarded-for, whose last entry is the real client address it saw.
 */
function isLocal(req: IncomingMessage) {
  if (TRUST_LAN) return true;
  if (!LOOPBACK.has(req.socket.remoteAddress ?? '')) return false;
  const fwd = req.headers['x-forwarded-for'];
  if (!fwd) return true;
  const last = String(fwd).split(',').pop()!.trim();
  return LOOPBACK.has(last);
}

/** Endpoints anyone may call without authentication: shared links, webhook ingest, health check. */
export const isPublic = (path: string) =>
  path === '/api/health' || path.startsWith('/api/p/') || path.startsWith('/api/ingest/');

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: string[],
  url: URL,
  ctx: AuthContext,
) => Promise<unknown> | unknown;

const routes: { method: string; pattern: RegExp; handler: Handler }[] = [];
export const route = (method: string, path: string, handler: Handler) =>
  routes.push({ method, pattern: new RegExp(`^${path.replace(/:\w+/g, '([\\w-]+)')}$`), handler });

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage, limit: number): Promise<any> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new UserError(`Request body is larger than ${Math.round(limit / 1024 / 1024)} MB`, 413);
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new UserError('Body must be valid JSON');
  }
}

/** Server-Sent Events: one connection per open dashboard; its existence is the viewer's presence. */
function openStream(req: IncomingMessage, res: ServerResponse, sourceIds: string[]) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.write('retry: 3000\n\n');
  const unsubscribe = subscribe(sourceIds, (snap) => res.write(`event: snapshot\ndata: ${JSON.stringify(snap)}\n\n`));
  const ping = setInterval(() => res.write(': ping\n\n'), 20_000);
  req.on('close', () => {
    clearInterval(ping);
    unsubscribe();
  });
}

// ───────────── System & Health ─────────────

route('GET', '/api/health', () => ({ ok: true, cloud: isCloudMode }));
route('GET', '/api/workspace', (_req, _res, _p, _url, ctx) => ({
  workspaceId: ctx.workspaceId,
  user: ctx.user,
  isCloud: ctx.isCloud,
}));

// ───────────── Data sources ─────────────

route('GET', '/api/sources', (_req, _res, _p, _url, ctx) => listSources(ctx.workspaceId));
route('POST', '/api/sources', async (req, _res, _p, _url, ctx) =>
  createSource(await readJson(req, 8 * 1024 * 1024), ctx.workspaceId)
);
route('POST', '/api/sources/test', async (req) => testRest(await readJson(req, 64 * 1024)));
route('PATCH', '/api/sources/:id', async (req, _res, [id], _url, ctx) =>
  updateSource(id, await readJson(req, 8 * 1024 * 1024), ctx.workspaceId)
);
route('DELETE', '/api/sources/:id', (_req, _res, [id], _url, ctx) => {
  deleteSource(id, ctx.workspaceId);
  return { ok: true };
});
route('POST', '/api/sources/:id/refresh', (_req, _res, [id], _url, ctx) => refresh(id, ctx.workspaceId));
route('POST', '/api/sources/:id/clear', (_req, _res, [id], _url, ctx) => clearRows(id, ctx.workspaceId));
route('GET', '/api/sources/:id/token', (_req, _res, [id], _url, ctx) => ({ token: webhookToken(id, ctx.workspaceId) }));
route('POST', '/api/sources/:id/token', (_req, _res, [id], _url, ctx) => ({ token: rotateToken(id, ctx.workspaceId) }));

route('GET', '/api/stream', (req, res, _p, url) => {
  const ids = (url.searchParams.get('sources') ?? '').split(',').filter(Boolean).slice(0, 50);
  openStream(req, res, ids);
  return undefined;
});

// Inbound webhooks from n8n, Make, Zapier, Stripe or any script. Token via header or ?token=.
route('POST', '/api/ingest/:id', async (req, _res, [id], url) => {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? url.searchParams.get('token') ?? '';
  const received = ingest(id, auth, await readJson(req, 1024 * 1024));
  return { ok: true, received };
});

// ───────────── AI ─────────────

route('POST', '/api/ai/generate', async (req) => ({ dashboard: await generateDashboard(await readJson(req, 16 * 1024)) }));
route('POST', '/api/ai/edit', async (req) => editDashboard(await readJson(req, 256 * 1024)));

// ───────────── Cloud Dashboards CRUD ─────────────

route('GET', '/api/dashboards', (_req, _res, _p, _url, ctx) => {
  const list = Object.values(db.dashboards)
    .filter((d) => !ctx.isCloud || d.workspaceId === ctx.workspaceId)
    .map((d) => d.schema);
  return list;
});

route('PUT', '/api/dashboards/:id', async (req, _res, [id], _url, ctx) => {
  const { dashboard } = await readJson(req, 4 * 1024 * 1024);
  const clean = validDashboard(dashboard);
  const rec: DashboardRecord = {
    id,
    workspaceId: ctx.workspaceId,
    name: clean.name || 'Untitled',
    schema: clean,
    schemaVersion: 1,
    status: 'active',
    visibility: 'private',
    createdAt: clean.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  db.dashboards[id] = rec;
  save();
  return clean;
});

route('DELETE', '/api/dashboards/:id', (_req, _res, [id], _url, ctx) => {
  const d = db.dashboards[id];
  if (d && (!ctx.isCloud || d.workspaceId === ctx.workspaceId)) {
    delete db.dashboards[id];
    delete db.versions[id];
    save();
  }
  return { ok: true };
});

route('POST', '/api/dashboards/:id/versions', async (req, _res, [id], _url) => {
  const body = await readJson(req, 4 * 1024 * 1024);
  const list = db.versions[id] ?? [];
  list.push({ at: body.at || Date.now(), dashboard: body.dashboard });
  db.versions[id] = list.slice(-30);
  save();
  return { ok: true };
});

route('GET', '/api/dashboards/:id/versions', (_req, _res, [id]) => {
  return db.versions[id] ?? [];
});

route('POST', '/api/dashboards/import', async (req, _res, _p, _url, ctx) => {
  const { dashboards } = await readJson(req, 16 * 1024 * 1024);
  if (!Array.isArray(dashboards)) throw new UserError('Dashboards must be an array');
  let count = 0;
  for (const d of dashboards) {
    if (!d || !d.id) continue;
    const clean = validDashboard(d);
    db.dashboards[d.id] = {
      id: d.id,
      workspaceId: ctx.workspaceId,
      name: clean.name,
      schema: clean,
      schemaVersion: 1,
      status: 'active',
      visibility: 'private',
      createdAt: clean.createdAt || Date.now(),
      updatedAt: clean.updatedAt || Date.now(),
    };
    count++;
  }
  save();
  return { ok: true, imported: count };
});

// ───────────── Publishing ─────────────

function boundSources(dashboard: any): string[] {
  const ids = new Set<string>();
  for (const w of dashboard?.widgets ?? []) if (typeof w?.binding?.sourceId === 'string') ids.add(w.binding.sourceId);
  return [...ids];
}

function validDashboard(d: any) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.widgets) || typeof d.name !== 'string') {
    throw new UserError('That isn’t a dashboard');
  }
  // Strip anything that should never leave the owner's workspace.
  const { publication: _p, ...rest } = d;
  return rest;
}

route('POST', '/api/publish', async (req, _res, _p, _url, ctx) => {
  const body = await readJson(req, 4 * 1024 * 1024);
  const clean = validDashboard(body.dashboard);
  const token = randomBytes(12).toString('base64url');
  const mode: ShareMode = body.mode === 'password' || body.mode === 'private' ? body.mode : 'public';
  const passwordHash = mode === 'password' && body.password ? hashPassword(body.password) : undefined;
  const expiresAt = body.expiresAt ? Number(body.expiresAt) : undefined;

  const pub: Publication = {
    token,
    dashboard: clean,
    sourceIds: boundSources(clean),
    publishedAt: Date.now(),
    mode,
    passwordHash,
    expiresAt,
    workspaceId: ctx.workspaceId,
  };
  db.publications[token] = pub;
  save();
  return { token, publishedAt: pub.publishedAt, mode, expiresAt };
});

route('PUT', '/api/publish/:token', async (req, _res, [token], _url, ctx) => {
  const pub = db.publications[token];
  if (!pub) throw new UserError('This link no longer exists', 404);
  if (ctx.isCloud && pub.workspaceId && pub.workspaceId !== ctx.workspaceId) {
    throw new UserError('Access denied', 403);
  }
  const body = await readJson(req, 4 * 1024 * 1024);
  const clean = validDashboard(body.dashboard);
  const mode: ShareMode = body.mode ? (body.mode === 'password' || body.mode === 'private' ? body.mode : 'public') : (pub.mode ?? 'public');
  const passwordHash = body.password ? hashPassword(body.password) : pub.passwordHash;
  const expiresAt = body.expiresAt !== undefined ? (body.expiresAt ? Number(body.expiresAt) : undefined) : pub.expiresAt;

  Object.assign(pub, {
    dashboard: clean,
    sourceIds: boundSources(clean),
    publishedAt: Date.now(),
    mode,
    passwordHash,
    expiresAt,
  });
  save();
  return { token, publishedAt: pub.publishedAt, mode: pub.mode, expiresAt: pub.expiresAt };
});

route('DELETE', '/api/publish/:token', (_req, _res, [token], _url, ctx) => {
  const pub = db.publications[token];
  if (pub && (!ctx.isCloud || !pub.workspaceId || pub.workspaceId === ctx.workspaceId)) {
    delete db.publications[token];
    save();
  }
  return { ok: true };
});

/** Verify publication access (public, password-protected, or private) */
async function checkPublicationAccess(req: IncomingMessage, pub: Publication, url: URL): Promise<boolean> {
  // Expiration check
  if (pub.expiresAt && Date.now() > pub.expiresAt) {
    throw new UserError('This shared link has expired', 410);
  }

  // Password-protected check
  if (pub.mode === 'password') {
    const given = (req.headers['x-share-password'] as string) || url.searchParams.get('password') || '';
    if (!given || !pub.passwordHash || !verifyPassword(given, pub.passwordHash)) {
      throw new UserError('This dashboard is password-protected', 401);
    }
  }

  // Private workspace check
  if (pub.mode === 'private') {
    try {
      const ctx = await authenticate(req);
      if (pub.workspaceId && ctx.workspaceId !== pub.workspaceId) {
        throw new UserError('You do not have access to this private dashboard', 403);
      }
    } catch (err: any) {
      throw new UserError('Sign in with authorized access to view this dashboard', 401);
    }
  }

  return true;
}

route('GET', '/api/p/:token', async (req, _res, [token], url) => {
  const pub = db.publications[token];
  if (!pub) throw new UserError('This link no longer exists', 404);

  // If password required and not given, return explicit hint
  if (pub.mode === 'password') {
    const given = (req.headers['x-share-password'] as string) || url.searchParams.get('password') || '';
    if (!given || !pub.passwordHash || !verifyPassword(given, pub.passwordHash)) {
      throw new UserError('Password required', 401);
    }
  }

  await checkPublicationAccess(req, pub, url);
  return { dashboard: pub.dashboard, publishedAt: pub.publishedAt, mode: pub.mode };
});

// Viewers of a shared link may only stream the sources that dashboard uses.
route('GET', '/api/p/:token/stream', async (req, res, [token], url) => {
  const pub = db.publications[token];
  if (!pub) throw new UserError('This link no longer exists', 404);
  await checkPublicationAccess(req, pub, url);
  openStream(req, res, pub.sourceIds);
  return undefined;
});

// ───────────── Static app (production) ─────────────

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function serveStatic(url: URL, res: ServerResponse) {
  if (!existsSync(DIST)) return send(res, 404, { error: 'Run “npm run build” first, or use “npm run dev”.' });
  let file = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'Forbidden' });
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  const immutable = file.includes(`${DIST}/assets/`);
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(file).pipe(res);
}

// ───────────── Server Request Listener ─────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host || 'localhost'}`);
  const isIngest = url.pathname.startsWith('/api/ingest/');

  if (isIngest) {
    // Webhooks may come from browser-based tools too.
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', 'authorization, content-type');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();
  }

  // Handle CORS for dev or cross-origin setups
  if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('access-control-allow-headers', 'authorization, content-type, x-workspace-id, x-share-password');
    return res.writeHead(204).end();
  }

  if (!url.pathname.startsWith('/api/')) return serveStatic(url, res);

  // Authentication & Access control gate
  let ctx: AuthContext;
  if (isPublic(url.pathname)) {
    ctx = { user: { id: 'public' }, workspaceId: 'public', isCloud: isCloudMode };
  } else if (isCloudMode) {
    try {
      ctx = await authenticate(req);
    } catch (err: any) {
      return send(res, err.status ?? 401, { error: err.message || 'Authentication required' });
    }
  } else {
    // Local-only mode
    if (!isLocal(req)) {
      return send(res, 403, {
        error: 'Data sources can only be managed from the computer running Unidash until accounts are added.',
      });
    }
    ctx = { user: { id: 'local_user', email: 'owner@localhost' }, workspaceId: 'local', isCloud: false };
  }

  for (const r of routes) {
    const m = r.method === req.method && url.pathname.match(r.pattern);
    if (!m) continue;
    try {
      const out = await r.handler(req, res, m.slice(1), url, ctx);
      if (out !== undefined && !res.headersSent) send(res, 200, out);
    } catch (err: any) {
      const status = err instanceof UserError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) {
        send(res, status, {
          error: status === 500 ? 'Something went wrong on the server' : err.message,
          requiresPassword: err.message === 'Password required',
        });
      }
    }
    return;
  }
  send(res, 404, { error: 'Not found' });
});

// Boot initialization
(async () => {
  await initSchema();
  await loadFromPostgres();
  startScheduler();
  server.listen(PORT, HOST, () => {
    console.log(`Unidash data server on http://${HOST}:${PORT} [mode: ${isCloudMode ? 'cloud (Supabase)' : 'local'}]`);
  });
})();

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    flush();
    process.exit(0);
  });
}
