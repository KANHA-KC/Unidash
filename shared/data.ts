// Data contract shared by the browser app and the data server.
// Erasable TypeScript only (no enums/namespaces) so Node can run it without a build step.

export type SourceKind = 'csv' | 'rest' | 'webhook' | 'demo';
export type FieldType = 'number' | 'string' | 'date' | 'boolean';
export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

export interface FieldInfo {
  key: string;
  type: FieldType;
}

/** idle: never loaded · live: fresh · error: last attempt failed · paused: no viewers, polling hibernated */
export type SourceStatus = 'idle' | 'live' | 'error' | 'paused';

export interface SourceConfig {
  /** REST: the URL to poll (GET). */
  url?: string;
  /** REST: dotted path to the array inside the response, e.g. "data.items". */
  rootPath?: string;
  /** REST: seconds between polls while someone is viewing. */
  intervalSec?: number;
  /** Webhook/REST-object responses: add new rows to history, or replace everything. */
  mode?: 'append' | 'replace';
  /** Demo: which simulated stream. */
  demo?: DemoKind;
  /** Cap on stored rows (oldest dropped first). */
  maxRows?: number;
}

export type DemoKind = 'store' | 'api' | 'automation';

/** What the server tells clients about a source. Never contains secrets. */
export interface SourceInfo {
  id: string;
  name: string;
  kind: SourceKind;
  config: SourceConfig;
  createdAt: number;
  status: SourceStatus;
  error?: string;
  lastUpdatedAt?: number;
  lastSuccessAt?: number;
  rowCount: number;
  fields: FieldInfo[];
  /** Header names only (values stay on the server). */
  headerNames?: string[];
  viewers: number;
}

export interface SourceSnapshot {
  id: string;
  name: string;
  kind: SourceKind;
  status: SourceStatus;
  error?: string;
  intervalSec?: number;
  lastUpdatedAt?: number;
  lastSuccessAt?: number;
  fields: FieldInfo[];
  rows: Row[];
}

export const INTERVALS: { value: number; label: string }[] = [
  { value: 15, label: 'Every 15 seconds' },
  { value: 30, label: 'Every 30 seconds' },
  { value: 60, label: 'Every minute' },
  { value: 300, label: 'Every 5 minutes' },
  { value: 900, label: 'Every 15 minutes' },
  { value: 3600, label: 'Every hour' },
];

export const TIME_FIELD = '_time';
