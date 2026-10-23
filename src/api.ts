import type { FieldInfo, Row, SourceConfig, SourceInfo, SourceKind, DemoKind } from '../shared/data.ts';
import type { Dashboard, Widget } from './types';
import type { DraftDashboard, EditOp } from '../shared/ai.ts';
import { getAuthToken, getCurrentWorkspaceId } from './auth';

export class ApiError extends Error {
  status: number;
  requiresPassword?: boolean;
  constructor(message: string, status: number, requiresPassword = false) {
    super(message);
    this.status = status;
    this.requiresPassword = requiresPassword;
  }
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const token = getAuthToken();
  const wsId = getCurrentWorkspaceId();
  const headers: Record<string, string> = {
    ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(extraHeaders ?? {}),
  };
  if (token && !headers['authorization']) headers['authorization'] = `Bearer ${token}`;
  if (wsId && !headers['x-workspace-id']) headers['x-workspace-id'] = wsId;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Can’t reach the Unidash data server. Is it running?', 0);
  }
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON means we hit something other than our server
  }
  if (!res.ok || json === null) {
    const isPw = json?.requiresPassword || json?.error === 'Password required';
    throw new ApiError(
      json?.error ??
        (res.status === 404 || res.status >= 500
          ? 'Can’t reach the Unidash data server. Is it running?'
          : `Request failed (${res.status})`),
      res.status,
      isPw
    );
  }
  return json as T;
}

export interface NewSource {
  name: string;
  kind: SourceKind;
  config?: SourceConfig;
  headers?: string;
  rows?: Row[];
  csv?: string;
  seedDemo?: DemoKind;
}

export interface PublishOptions {
  mode?: 'public' | 'private' | 'password';
  password?: string;
  expiresAt?: number;
}

export const api = {
  sources: () => call<SourceInfo[]>('GET', '/sources'),
  createSource: (input: NewSource) => call<SourceInfo>('POST', '/sources', input),
  updateSource: (id: string, input: Partial<NewSource>) => call<SourceInfo>('PATCH', `/sources/${id}`, input),
  deleteSource: (id: string) => call<{ ok: true }>('DELETE', `/sources/${id}`),
  refresh: (id: string) => call<SourceInfo>('POST', `/sources/${id}/refresh`),
  clear: (id: string) => call<SourceInfo>('POST', `/sources/${id}/clear`),
  token: (id: string) => call<{ token: string }>('GET', `/sources/${id}/token`),
  rotateToken: (id: string) => call<{ token: string }>('POST', `/sources/${id}/token`),
  testRest: (input: { url: string; headers?: string; rootPath?: string }) =>
    call<{ rows: Row[]; rowCount: number; fields: FieldInfo[] }>('POST', '/sources/test', input),
  ingest: async (id: string, token: string, body: unknown) => {
    const res = await fetch(`${API_BASE}/api/ingest/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError((await res.json().catch(() => null))?.error ?? 'Failed', res.status);
  },

  // Publishing with options
  publish: (dashboard: Dashboard, opts?: PublishOptions) =>
    call<{ token: string; publishedAt: number; mode?: string; expiresAt?: number }>('POST', '/publish', {
      dashboard,
      ...opts,
    }),
  republish: (token: string, dashboard: Dashboard, opts?: PublishOptions) =>
    call<{ token: string; publishedAt: number; mode?: string; expiresAt?: number }>('PUT', `/publish/${token}`, {
      dashboard,
      ...opts,
    }),
  unpublish: (token: string) => call<{ ok: true }>('DELETE', `/publish/${token}`),
  published: (token: string, password?: string) =>
    call<{ dashboard: Dashboard; publishedAt: number; mode?: string }>(
      'GET',
      `/p/${token}`,
      undefined,
      password ? { 'x-share-password': password } : undefined
    ),

  // Cloud dashboards & versions
  listDashboards: () => call<Dashboard[]>('GET', '/dashboards'),
  saveDashboard: (dashboard: Dashboard) => call<Dashboard>('PUT', `/dashboards/${dashboard.id}`, { dashboard }),
  deleteDashboard: (id: string) => call<{ ok: true }>('DELETE', `/dashboards/${id}`),
  saveCloudVersion: (id: string, version: any) => call<{ ok: true }>('POST', `/dashboards/${id}/versions`, version),
  getCloudVersions: (id: string) => call<any[]>('GET', `/dashboards/${id}/versions`),
  importDashboards: (dashboards: Dashboard[]) =>
    call<{ ok: true; imported: number }>('POST', '/dashboards/import', { dashboards }),
  getWorkspace: () => call<{ workspaceId: string; user: any; isCloud: boolean }>('GET', '/workspace'),

  // AI
  aiGenerate: (prompt: string) => call<{ dashboard: DraftDashboard }>('POST', '/ai/generate', { prompt }),
  aiEdit: (input: { instruction: string; widget?: Widget; outline?: Pick<Widget, 'id' | 'type' | 'title' | 'size'>[] }) =>
    call<{ ops: EditOp[]; summary: string }>('POST', '/ai/edit', input),
};

/** Public URL for a shared dashboard on this host. */
export const shareUrl = (token: string, embed = false) =>
  `${location.origin}${location.pathname}#/p/${token}${embed ? '?embed=1' : ''}`;
export const ingestUrl = (id: string) => `${location.origin}/api/ingest/${id}`;
