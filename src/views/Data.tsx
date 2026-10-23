import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Braces, FileSpreadsheet, Play, Plus, RefreshCw, Sparkles, Trash, Upload, Webhook } from 'lucide-react';
import type { DemoKind, FieldInfo, Row, SourceInfo, SourceKind } from '../../shared/data.ts';
import { INTERVALS } from '../../shared/data.ts';
import { csvToObjects } from '../../shared/csv.ts';
import { api, ingestUrl } from '../api';
import { reloadSources, useLiveStream, useSnapshot, useSources } from '../live';
import { prettyField } from '../resolve';
import { navigate, useRoute } from '../router';
import { timeAgo } from '../format';
import { Sheet } from '../components/Sheet';
import { LiveBadge } from '../components/WidgetCard';
import { CopyField } from '../components/ShareSheet';
import { toast } from '../components/Toast';
import { ThemeButton } from './Home';

const KINDS: { kind: SourceKind; icon: typeof Braces; name: string; text: string }[] = [
  { kind: 'csv', icon: FileSpreadsheet, name: 'Spreadsheet', text: 'Upload a CSV export from Excel, Google Sheets or any tool.' },
  { kind: 'rest', icon: Braces, name: 'API', text: 'Pull JSON from a URL on a schedule. Works with most REST APIs.' },
  { kind: 'webhook', icon: Webhook, name: 'Webhook', text: 'Let n8n, Make, Zapier, Stripe or your scripts push data in.' },
  { kind: 'demo', icon: Sparkles, name: 'Live demo data', text: 'Simulated data that updates every few seconds. Great for trying things out.' },
];
const KIND_NAME: Record<SourceKind, string> = { csv: 'Spreadsheet', rest: 'API', webhook: 'Webhook', demo: 'Demo' };
const DEMOS: { value: DemoKind; label: string; text: string }[] = [
  { value: 'store', label: 'Online store', text: 'Orders, revenue, region and channel' },
  { value: 'api', label: 'API health', text: 'Latency, requests, errors by endpoint' },
  { value: 'automation', label: 'Automation runs', text: 'Workflow runs, status, hours saved, cost' },
];
const EXAMPLES = [
  { label: 'Bitcoin price', url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot', rootPath: 'data', intervalSec: 15 },
  { label: 'Weather in London', url: 'https://api.open-meteo.com/v1/forecast?latitude=51.51&longitude=-0.13&current=temperature_2m,wind_speed_10m,relative_humidity_2m', rootPath: 'current', intervalSec: 900 },
];

const describe = (s: SourceInfo) =>
  s.kind === 'rest'
    ? INTERVALS.find((i) => i.value === s.config.intervalSec)?.label.toLowerCase() ?? 'polling'
    : s.kind === 'webhook'
      ? 'pushes data in'
      : s.kind === 'demo'
        ? 'simulated'
        : 'uploaded file';

export function DataPage() {
  const route = useRoute();
  const params = new URLSearchParams(route.split('?')[1] ?? '');
  const { sources, loaded, error } = useSources();
  const [adding, setAdding] = useState(params.has('new'));
  const [openId, setOpenId] = useState<string | null>(params.get('source'));
  useLiveStream(sources.map((s) => s.id));

  useEffect(() => {
    reloadSources();
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div className="row gap-sm">
          <button className="icon-btn" aria-label="Back" onClick={() => (history.length > 1 ? history.back() : navigate('/'))}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="board-title">Data sources</h1>
        </div>
        <div className="row gap-sm">
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> <span className="hide-xs">Add source</span>
          </button>
          <ThemeButton />
        </div>
      </header>
      <main className="container">
        {error ? (
          <div className="empty-state">
            <h2 className="title">Data server is offline</h2>
            <p className="muted">{error} Start everything with <code>npm run dev</code>.</p>
            <button className="btn" onClick={() => reloadSources()}>Try again</button>
          </div>
        ) : loaded && !sources.length ? (
          <div className="empty-state">
            <div className="empty-mark" aria-hidden><Plus size={26} /></div>
            <h2 className="title">Connect your first data</h2>
            <p className="muted">Sources feed your widgets. They refresh by themselves, and every widget shows how fresh its data is.</p>
            <button className="btn primary" onClick={() => setAdding(true)}>Add a data source</button>
          </div>
        ) : (
          <div className="source-list">
            {sources.map((s) => (
              <SourceRow key={s.id} source={s} onOpen={() => setOpenId(s.id)} />
            ))}
          </div>
        )}
        <p className="muted small data-note">
          Secrets such as API keys stay on the server and are never shown again or included in shared links. API polling runs at full speed only while someone has a dashboard open.
        </p>
      </main>

      <AddSourceSheet
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(s) => {
          setAdding(false);
          reloadSources();
          setOpenId(s.id);
        }}
      />
      <SourceSheet source={sources.find((s) => s.id === openId) ?? null} onClose={() => setOpenId(null)} />
    </div>
  );
}

function SourceRow({ source, onOpen }: { source: SourceInfo; onOpen: () => void }) {
  const snap = useSnapshot(source.id);
  const Icon = KINDS.find((k) => k.kind === source.kind)!.icon;
  return (
    <button className="source-row" onClick={onOpen}>
      <span className="picker-icon"><Icon size={18} /></span>
      <span className="source-main">
        <span className="picker-name">{source.name}</span>
        <span className="muted small">
          {KIND_NAME[source.kind]} · {describe(source)} · {plural(snap?.rows.length ?? source.rowCount, 'row')}
        </span>
      </span>
      <LiveBadge sourceId={source.id} />
    </button>
  );
}

// ───────────── Preview table ─────────────

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function cell(v: unknown, f: FieldInfo) {
  if (v === null || v === undefined) return '';
  if (f.type === 'date') {
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime())) return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return String(v);
}

function Preview({ rows, fields }: { rows: Row[]; fields: FieldInfo[] }) {
  if (!rows.length) return <p className="muted small">No rows yet.</p>;
  const cols = fields.slice(0, 6);
  return (
    <div className="table-wrap preview">
      <table>
        <thead>
          <tr>{cols.map((f) => <th key={f.key}>{prettyField(f.key)} <span className="type">{f.type}</span></th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((r, i) => (
            <tr key={i}>{cols.map((f) => <td key={f.key}>{cell(r[f.key], f)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────── Add a source ─────────────

function AddSourceSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (s: SourceInfo) => void }) {
  const [kind, setKind] = useState<SourceKind | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // csv
  const [csv, setCsv] = useState('');
  const file = useRef<HTMLInputElement>(null);
  // rest
  const [url, setUrl] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [headers, setHeaders] = useState('');
  const [intervalSec, setIntervalSec] = useState(60);
  const [test, setTest] = useState<{ rows: Row[]; fields: FieldInfo[]; rowCount: number } | null>(null);
  // webhook / demo
  const [demo, setDemo] = useState<DemoKind>('store');

  useEffect(() => {
    if (!open) {
      setKind(null);
      setName('');
      setErr('');
      setCsv('');
      setUrl('');
      setRootPath('');
      setHeaders('');
      setTest(null);
    }
  }, [open]);

  const csvPreview = csv ? csvToObjects(csv) : [];
  const csvFields: FieldInfo[] = csvPreview[0] ? Object.keys(csvPreview[0]).map((key) => ({ key, type: 'string' })) : [];

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const testApi = () => run(async () => setTest(await api.testRest({ url, headers, rootPath })));

  const create = () =>
    run(async () => {
      const base = { name: name.trim() || KINDS.find((k) => k.kind === kind)!.name, kind: kind! };
      const s =
        kind === 'csv'
          ? await api.createSource({ ...base, csv })
          : kind === 'rest'
            ? await api.createSource({ ...base, config: { url, rootPath, intervalSec }, headers })
            : kind === 'webhook'
              ? await api.createSource({ ...base, config: { mode: 'append' } })
              : await api.createSource({ ...base, name: name.trim() || DEMOS.find((d) => d.value === demo)!.label, config: { demo } });
      toast(`Connected “${s.name}”`);
      onCreated(s);
    });

  const canCreate =
    kind === 'csv' ? csvPreview.length > 0 : kind === 'rest' ? !!test : kind === 'webhook' || kind === 'demo';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind ? `New ${kind === 'rest' ? 'API' : KINDS.find((k) => k.kind === kind)!.name.toLowerCase()} source` : 'Add a data source'}
      wide={!kind}
      footer={
        kind ? (
          <>
            <button className="btn ghost" onClick={() => setKind(null)}>Back</button>
            <span className="spacer" />
            <button className="btn primary" disabled={!canCreate || busy} onClick={create}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          </>
        ) : undefined
      }
    >
      {!kind ? (
        <div className="picker-grid">
          {KINDS.map((k) => (
            <button key={k.kind} className="picker-item" onClick={() => setKind(k.kind)}>
              <span className="picker-icon"><k.icon size={20} /></span>
              <span className="picker-text">
                <span className="picker-name">{k.name}</span>
                <span className="muted small">{k.text}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="form">
          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" value={name} placeholder={kind === 'csv' ? 'e.g. Q3 sales' : kind === 'rest' ? 'e.g. Stripe balance' : kind === 'webhook' ? 'e.g. n8n workflow runs' : 'e.g. Store demo'} onChange={(e) => setName(e.target.value)} />
          </label>

          {kind === 'csv' && (
            <>
              <input
                ref={file}
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 8 * 1024 * 1024) return setErr('That file is over 8 MB');
                  setCsv(await f.text());
                  if (!name) setName(f.name.replace(/\.(csv|tsv)$/i, ''));
                  e.target.value = '';
                }}
              />
              <button className="drop" onClick={() => file.current?.click()}>
                <Upload size={20} />
                <span>{csv ? `${csvPreview.length} rows loaded — choose another file` : 'Choose a CSV file'}</span>
                <span className="muted small">The first row should contain column names</span>
              </button>
              <details>
                <summary className="muted small">…or paste the data</summary>
                <textarea className="input mono" rows={6} value={csv} placeholder={'date, revenue, plan\n2026-01-01, 1200, Pro'} onChange={(e) => setCsv(e.target.value)} />
              </details>
              {csvPreview.length > 0 && <Preview rows={csvPreview as Row[]} fields={csvFields} />}
            </>
          )}

          {kind === 'rest' && (
            <>
              <label className="field">
                <span className="field-label">URL</span>
                <input className="input" inputMode="url" value={url} placeholder="https://api.example.com/v1/metrics" onChange={(e) => { setUrl(e.target.value); setTest(null); }} />
              </label>
              <div className="row gap wrap">
                <span className="muted small">Try:</span>
                {EXAMPLES.map((x) => (
                  <button
                    key={x.label}
                    className="chip"
                    onClick={() => {
                      setUrl(x.url);
                      setRootPath(x.rootPath);
                      setIntervalSec(x.intervalSec);
                      setTest(null);
                      if (!name) setName(x.label);
                    }}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
              <label className="field">
                <span className="field-label">Refresh</span>
                <select className="input" value={intervalSec} onChange={(e) => setIntervalSec(Number(e.target.value))}>
                  {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </label>
              <details>
                <summary className="muted small">Authentication & advanced</summary>
                <div className="form inner">
                  <label className="field">
                    <span className="field-label">Headers</span>
                    <textarea className="input mono" rows={3} value={headers} placeholder="Authorization: Bearer your-key" onChange={(e) => { setHeaders(e.target.value); setTest(null); }} />
                    <span className="field-hint">One per line. Stored on the server only and never shown again.</span>
                  </label>
                  <label className="field">
                    <span className="field-label">Where the data is</span>
                    <input className="input mono" value={rootPath} placeholder="e.g. data.items (optional)" onChange={(e) => { setRootPath(e.target.value); setTest(null); }} />
                    <span className="field-hint">A list becomes rows. A single object is added as a new row on every refresh, building a history.</span>
                  </label>
                </div>
              </details>
              <button className="btn self-start" disabled={!url || busy} onClick={testApi}>
                <Play size={16} /> {busy && !test ? 'Testing…' : 'Test connection'}
              </button>
              {test && (
                <div className="stack">
                  <p className="ok-note">Connected · {test.rowCount} {test.rowCount === 1 ? 'row' : 'rows'}, {test.fields.length} fields</p>
                  <Preview rows={test.rows} fields={test.fields} />
                </div>
              )}
            </>
          )}

          {kind === 'webhook' && (
            <p className="muted">
              You’ll get a private URL. Anything that can send an HTTP POST with JSON — n8n, Make, Zapier, Stripe, a Python script — can push rows to it, and your widgets update instantly.
            </p>
          )}

          {kind === 'demo' && (
            <div className="stack">
              {DEMOS.map((d) => (
                <label key={d.value} className={`radio-card ${demo === d.value ? 'on' : ''}`}>
                  <input type="radio" name="demo" checked={demo === d.value} onChange={() => setDemo(d.value)} />
                  <span>
                    <span className="picker-name">{d.label}</span>
                    <span className="muted small"> — {d.text}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {err && <p className="error-note" role="alert">{err}</p>}
        </div>
      )}
    </Sheet>
  );
}

// ───────────── Source details ─────────────

function SourceSheet({ source, onClose }: { source: SourceInfo | null; onClose: () => void }) {
  const snap = useSnapshot(source?.id);
  const [token, setToken] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ url: string; rootPath: string; intervalSec: number; headers: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setToken(null);
    setConfirmDelete(false);
    setDraft(source?.kind === 'rest' ? { url: source.config.url ?? '', rootPath: source.config.rootPath ?? '', intervalSec: source.config.intervalSec ?? 60, headers: '' } : null);
    if (source?.kind === 'webhook') api.token(source.id).then((r) => setToken(r.token)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id]);

  if (!source) return null;
  const rows = snap?.rows ?? [];
  const fields = snap?.fields ?? source.fields;
  const recent = source.kind === 'csv' || source.kind === 'rest' ? rows : [...rows].reverse();

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    try {
      await fn();
      reloadSources();
      if (done) toast(done);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const endpoint = ingestUrl(source.id);
  const sample = { status: 'success', amount: 42, customer: 'Acme' };

  return (
    <Sheet open onClose={onClose} variant="right" title={source.name}>
      <div className="form">
        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="input"
            defaultValue={source.name}
            key={source.id}
            onBlur={(e) => e.target.value.trim() && e.target.value !== source.name && run(() => api.updateSource(source.id, { name: e.target.value }))}
          />
        </label>

        <div className="binding-status">
          <LiveBadge sourceId={source.id} />
          <span className="muted small">
            {KIND_NAME[source.kind]} · {plural(rows.length, 'row')}{snap?.lastSuccessAt ? ` · updated ${timeAgo(snap.lastSuccessAt)}` : ''}
          </span>
        </div>
        {snap?.status === 'error' && <p className="error-note" role="alert">{snap.error}</p>}

        {source.kind === 'webhook' && (
          <>
            <div className="field">
              <span className="field-label">Send data to</span>
              <CopyField value={endpoint} label="webhook URL" />
            </div>
            <div className="field">
              <span className="field-label">Secret token</span>
              <CopyField value={token ?? '…'} label="token" />
              <span className="field-hint">Send it as <code>Authorization: Bearer &lt;token&gt;</code>, or add <code>?token=</code> to the URL. Anyone with it can send data.</span>
            </div>
            <div className="field">
              <span className="field-label">Example</span>
              <CopyField
                multiline
                label="curl example"
                value={`curl -X POST ${endpoint} \\\n  -H "Authorization: Bearer ${token ?? '<token>'}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sample)}'`}
              />
              <span className="field-hint">Send one object or a list. Each one becomes a row with the time it arrived.</span>
            </div>
            <div className="row gap wrap">
              <button className="btn" disabled={busy || !token} onClick={() => run(() => api.ingest(source.id, token!, { ...sample, amount: Math.round(Math.random() * 100) }), 'Test event received')}>
                <Play size={16} /> Send a test event
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => run(async () => setToken((await api.rotateToken(source.id)).token), 'New token created — update your senders')}>
                New token
              </button>
              {rows.length > 0 && (
                <button className="btn ghost" disabled={busy} onClick={() => run(() => api.clear(source.id), 'Rows cleared')}>
                  Clear rows
                </button>
              )}
            </div>
          </>
        )}

        {source.kind === 'rest' && draft && (
          <>
            <label className="field">
              <span className="field-label">URL</span>
              <input className="input" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
            </label>
            <div className="field-pair">
              <label className="field">
                <span className="field-label">Refresh</span>
                <select className="input" value={draft.intervalSec} onChange={(e) => setDraft({ ...draft, intervalSec: Number(e.target.value) })}>
                  {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Where the data is</span>
                <input className="input mono" value={draft.rootPath} placeholder="optional" onChange={(e) => setDraft({ ...draft, rootPath: e.target.value })} />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Headers</span>
              <textarea className="input mono" rows={2} value={draft.headers} placeholder={source.headerNames?.length ? `Saved: ${source.headerNames.join(', ')} — type to replace` : 'Authorization: Bearer your-key'} onChange={(e) => setDraft({ ...draft, headers: e.target.value })} />
            </label>
            <div className="row gap wrap">
              <button
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      api.updateSource(source.id, {
                        config: { url: draft.url, rootPath: draft.rootPath, intervalSec: draft.intervalSec },
                        ...(draft.headers.trim() ? { headers: draft.headers } : {}),
                      }),
                    'Saved',
                  )
                }
              >
                Save
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => run(() => api.refresh(source.id))}>
                <RefreshCw size={16} /> Refresh now
              </button>
            </div>
          </>
        )}

        {source.kind === 'csv' && (
          <>
            <input
              ref={file}
              type="file"
              accept=".csv,.tsv,text/csv"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) run(async () => api.updateSource(source.id, { csv: await f.text() }), 'File replaced');
                e.target.value = '';
              }}
            />
            <button className="btn self-start" disabled={busy} onClick={() => file.current?.click()}>
              <Upload size={16} /> Upload a newer file
            </button>
          </>
        )}

        {source.kind === 'demo' && <p className="muted small">Simulated data. A new row arrives every few seconds while a dashboard using it is open.</p>}

        <div className="field">
          <span className="field-label">Latest rows</span>
          <Preview rows={recent} fields={fields} />
        </div>

        <div className="danger-zone">
          <button
            className="btn ghost danger"
            disabled={busy}
            onClick={() => {
              if (!confirmDelete) return setConfirmDelete(true);
              run(async () => {
                await api.deleteSource(source.id);
                onClose();
              }, 'Source deleted');
            }}
          >
            <Trash size={16} /> {confirmDelete ? 'Tap again to delete — widgets using it will stop updating' : 'Delete source'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
