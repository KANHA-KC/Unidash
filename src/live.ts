import { useEffect, useSyncExternalStore } from 'react';
import type { SourceInfo, SourceSnapshot } from '../shared/data.ts';
import { api } from './api';
import { getAuthToken, getCurrentWorkspaceId } from './auth';

// ───────────── Live snapshots (data path, kept apart from dashboard config) ─────────────

const snapshots = new Map<string, SourceSnapshot>();
let connection: 'idle' | 'connecting' | 'open' | 'offline' = 'idle';
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getSnapshot = (sourceId: string) => snapshots.get(sourceId);

export function useSnapshot(sourceId?: string): SourceSnapshot | undefined {
  useSyncExternalStore(subscribe, () => version);
  return sourceId ? snapshots.get(sourceId) : undefined;
}

export function useConnection() {
  return useSyncExternalStore(subscribe, () => connection);
}

/**
 * Keep one live stream open for the sources this page uses.
 * Replaced EventSource with a fetch-based SSE reader so Authorization and workspace headers can be passed.
 */
export function useLiveStream(sourceIds: string[], publicToken?: string) {
  const key = [...new Set(sourceIds)].sort().join(',');

  useEffect(() => {
    if (!key && !publicToken) return;
    const path = publicToken ? `/api/p/${publicToken}/stream` : `/api/stream?sources=${encodeURIComponent(key)}`;
    const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const url = `${API_BASE}${path}`;

    const controller = new AbortController();
    let active = true;

    async function streamLoop() {
      while (active) {
        connection = 'connecting';
        emit();

        try {
          const token = getAuthToken();
          const wsId = getCurrentWorkspaceId();
          const headers: Record<string, string> = {
            Accept: 'text/event-stream',
          };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          if (wsId) headers['x-workspace-id'] = wsId;

          const res = await fetch(url, {
            signal: controller.signal,
            headers,
          });

          if (!res.ok) {
            throw new Error(`SSE HTTP error ${res.status}`);
          }

          connection = 'open';
          emit();

          const reader = res.body?.getReader();
          if (!reader) throw new Error('No body stream in SSE response');

          const decoder = new TextDecoder();
          let buffer = '';

          while (active) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() ?? '';

            for (const chunk of chunks) {
              if (!chunk.trim()) continue;
              let eventName = 'message';
              let eventData = '';

              for (const line of chunk.split('\n')) {
                if (line.startsWith('event:')) eventName = line.slice(6).trim();
                else if (line.startsWith('data:')) eventData += line.slice(5).trim();
              }

              if (eventName === 'snapshot' && eventData) {
                try {
                  const snap = JSON.parse(eventData) as SourceSnapshot;
                  snapshots.set(snap.id, snap);
                  emit();
                } catch {}
              }
            }
          }
        } catch (err: any) {
          if (!active || err.name === 'AbortError') break;
          connection = 'offline';
          emit();
          // Exponential / fixed retry delay
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    streamLoop();

    return () => {
      active = false;
      controller.abort();
      connection = 'idle';
      emit();
    };
  }, [key, publicToken]);
}

// ───────────── Source list (for pickers and the Data page) ─────────────

let sources: SourceInfo[] | null = null;
let sourcesError: string | null = null;
let loading: Promise<void> | null = null;

export function reloadSources() {
  loading = api
    .sources()
    .then((list) => {
      sources = list;
      sourcesError = null;
    })
    .catch((err: Error) => {
      sourcesError = err.message;
    })
    .finally(() => {
      loading = null;
      emit();
    });
  return loading;
}

export function useSources() {
  useSyncExternalStore(subscribe, () => version);
  useEffect(() => {
    if (!sources && !loading) reloadSources();
  }, []);
  return { sources: sources ?? [], loaded: sources !== null, error: sourcesError };
}

/** Freshness as the blueprint asks for: live, stale, error, waiting or paused. */
export type Freshness = 'live' | 'stale' | 'error' | 'waiting' | 'paused' | 'static';

export function freshness(snap: SourceSnapshot | undefined, now = Date.now()): Freshness {
  if (!snap) return 'waiting';
  if (snap.status === 'error') return snap.rows.length ? 'stale' : 'error';
  if (!snap.lastSuccessAt || !snap.rows.length) return 'waiting';
  if (snap.kind === 'csv') return 'static';
  if (snap.status === 'paused') return 'paused';
  if (snap.intervalSec) {
    // Allow 2.5 refresh periods (and some slack) before calling it stale.
    const limit = Math.max(snap.intervalSec * 2500, 20_000);
    if (now - snap.lastSuccessAt > limit) return 'stale';
  }
  return 'live';
}
