import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Dashboard } from './types';
import { api } from './api';
import { getAuthToken, isCloudEnabled, subscribeAuth } from './auth';
import { getState, registerCloudHooks, replaceDashboards } from './store';

let initialized = false;
let syncing = false;
let lastSyncedAt: number | null = null;
const cloudListeners = new Set<() => void>();

function notify() {
  cloudListeners.forEach((l) => l());
}

function subscribeCloud(listener: () => void) {
  cloudListeners.add(listener);
  return () => cloudListeners.delete(listener);
}

// Track debounce timer for autosave
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const pendingDashboardSaves = new Map<string, Dashboard>();

function scheduleCloudSave(dashboards: Dashboard[]) {
  const token = getAuthToken();
  if (!token) return;

  for (const d of dashboards) {
    pendingDashboardSaves.set(d.id, d);
  }

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushCloudSaves, 600);
}

async function flushCloudSaves() {
  const token = getAuthToken();
  if (!token || pendingDashboardSaves.size === 0) return;

  const toSave = [...pendingDashboardSaves.values()];
  pendingDashboardSaves.clear();
  syncing = true;
  notify();

  try {
    for (const d of toSave) {
      await api.saveDashboard(d);
    }
    lastSyncedAt = Date.now();
  } catch (err) {
    console.warn('[cloud autosave error]:', err);
  } finally {
    syncing = false;
    notify();
  }
}

async function handleSaveVersion(d: Dashboard) {
  const token = getAuthToken();
  if (!token) return;
  try {
    await api.saveCloudVersion(d.id, { at: d.updatedAt || Date.now(), dashboard: d });
  } catch (err) {
    console.warn('[cloud version error]:', err);
  }
}

/** Load dashboards from the cloud into store */
export async function loadCloudDashboards(): Promise<Dashboard[]> {
  const token = getAuthToken();
  if (!token) return [];

  syncing = true;
  notify();
  try {
    const list = await api.listDashboards();
    if (Array.isArray(list) && list.length > 0) {
      replaceDashboards(list);
    }
    lastSyncedAt = Date.now();
    return list;
  } catch (err) {
    console.warn('[cloud load error]:', err);
    return [];
  } finally {
    syncing = false;
    notify();
  }
}

/** Import existing local dashboards from this browser into the cloud workspace */
export async function importLocalDashboards(): Promise<number> {
  const current = getState().dashboards;
  if (!current.length) return 0;

  syncing = true;
  notify();
  try {
    const res = await api.importDashboards(current);
    await loadCloudDashboards();
    return res.imported;
  } finally {
    syncing = false;
    notify();
  }
}

/** Initialize cloud hooks and auth listeners */
export function initCloudSync() {
  if (initialized) return;
  initialized = true;

  registerCloudHooks({
    onCommit: (dashboards) => scheduleCloudSave(dashboards),
    onSaveVersion: (d) => handleSaveVersion(d),
  });

  // When auth state changes, load cloud dashboards if signed in
  subscribeAuth(() => {
    const token = getAuthToken();
    if (token) {
      loadCloudDashboards();
    }
  });

  // Initial load if already authenticated
  if (getAuthToken()) {
    loadCloudDashboards();
  }
}

export function useCloudStatus() {
  useSyncExternalStore(subscribeCloud, () => syncing);
  const dashboards = getState().dashboards;
  const token = getAuthToken();

  return {
    isCloud: isCloudEnabled,
    isAuthenticated: Boolean(token),
    syncing,
    lastSyncedAt,
    localCount: dashboards.length,
    loadCloudDashboards,
    importLocalDashboards,
  };
}
