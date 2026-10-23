import { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Key, Link2Off, Lock, RefreshCw, Shield } from 'lucide-react';
import type { Dashboard } from '../types';
import { api, shareUrl, type PublishOptions } from '../api';
import { updateDashboard } from '../store';
import { Sheet } from './Sheet';
import { toast } from './Toast';

export function CopyField({ value, label, multiline }: { value: string; label: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('Couldn’t copy — select the text and copy it manually');
    }
  };
  return (
    <div className="copy-field">
      {multiline ? (
        <textarea className="input mono" readOnly rows={3} value={value} aria-label={label} onFocus={(e) => e.target.select()} />
      ) : (
        <input className="input mono" readOnly value={value} aria-label={label} onFocus={(e) => e.target.select()} />
      )}
      <button className="btn" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span className="hide-xs">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}

export function ShareSheet({ open, onClose, dashboard }: { open: boolean; onClose: () => void; dashboard: Dashboard }) {
  const [busy, setBusy] = useState(false);
  const pub = dashboard.publication;
  const outdated = pub && dashboard.updatedAt > pub.publishedAt;
  const bound = dashboard.widgets.some((w) => w.binding);

  const [mode, setMode] = useState<'public' | 'password' | 'private'>(pub?.mode ?? 'public');
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState<'never' | '24h' | '7d' | '30d'>('never');

  const calcExpiry = (): number | undefined => {
    if (expiry === '24h') return Date.now() + 24 * 3600 * 1000;
    if (expiry === '7d') return Date.now() + 7 * 24 * 3600 * 1000;
    if (expiry === '30d') return Date.now() + 30 * 24 * 3600 * 1000;
    return undefined;
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Publishing metadata shouldn't count as an edit, so it skips undo history.
  const setPublication = (publication: Dashboard['publication']) =>
    updateDashboard(dashboard.id, (d) => ({ ...d, publication }), { history: false, touch: false });

  const publish = () =>
    run(async () => {
      if (mode === 'password' && !password.trim()) {
        toast('Please enter a passphrase for password protection');
        return;
      }
      const opts: PublishOptions = {
        mode,
        password: mode === 'password' ? password : undefined,
        expiresAt: calcExpiry(),
      };
      const { token, publishedAt } = await api.publish(dashboard, opts);
      setPublication({ token, publishedAt, mode, expiresAt: opts.expiresAt });
      toast('Link is live');
    });

  const update = () =>
    run(async () => {
      const opts: PublishOptions = {
        mode,
        password: mode === 'password' && password ? password : undefined,
        expiresAt: calcExpiry(),
      };
      const { publishedAt } = await api.republish(pub!.token, dashboard, opts);
      setPublication({ token: pub!.token, publishedAt, mode, expiresAt: opts.expiresAt });
      toast('Shared version updated');
    });

  const stop = () =>
    run(async () => {
      await api.unpublish(pub!.token).catch(() => undefined);
      setPublication(undefined);
      toast('Link turned off');
    });

  return (
    <Sheet open={open} onClose={onClose} title="Share">
      {!pub ? (
        <div className="stack share gap">
          <p>Create a view-only live link. Viewers see your widgets update in real time without being able to edit.</p>
          {bound && <p className="muted small">Data from connected sources on this dashboard will be visible through the link.</p>}

          <div className="field">
            <span className="field-label">Access Mode</span>
            <div className="row gap-xs" style={{ margin: '6px 0 12px 0' }}>
              <button
                type="button"
                className={`btn ${mode === 'public' ? 'primary' : 'ghost'}`}
                style={{ flex: 1, padding: '8px 10px', fontSize: 13 }}
                onClick={() => setMode('public')}
              >
                <Globe size={14} /> Public
              </button>
              <button
                type="button"
                className={`btn ${mode === 'password' ? 'primary' : 'ghost'}`}
                style={{ flex: 1, padding: '8px 10px', fontSize: 13 }}
                onClick={() => setMode('password')}
              >
                <Key size={14} /> Password
              </button>
              <button
                type="button"
                className={`btn ${mode === 'private' ? 'primary' : 'ghost'}`}
                style={{ flex: 1, padding: '8px 10px', fontSize: 13 }}
                onClick={() => setMode('private')}
              >
                <Lock size={14} /> Workspace
              </button>
            </div>
            <span className="field-hint">
              {mode === 'public' && 'Anyone with the URL can view this dashboard.'}
              {mode === 'password' && 'Viewers must enter a password before viewing.'}
              {mode === 'private' && 'Only authenticated members of your workspace can view.'}
            </span>
          </div>

          {mode === 'password' && (
            <div className="field">
              <span className="field-label">Set Passphrase</span>
              <input
                className="input"
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <span className="field-label">Link Expiration</span>
            <select className="input" value={expiry} onChange={(e) => setExpiry(e.target.value as any)}>
              <option value="never">Never expires</option>
              <option value="24h">Expires in 24 hours</option>
              <option value="7d">Expires in 7 days</option>
              <option value="30d">Expires in 30 days</option>
            </select>
          </div>

          <button className="btn primary self-start" disabled={busy} onClick={publish} style={{ marginTop: 8 }}>
            Create link
          </button>
        </div>
      ) : (
        <div className="form">
          <div className="field">
            <div className="row gap-xs" style={{ alignItems: 'center', marginBottom: 6 }}>
              <span className="field-label" style={{ margin: 0 }}>View-only link</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'var(--card-bg-subtle, rgba(255,255,255,0.06))',
                  border: '1px solid var(--border)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {pub.mode ?? 'public'}
              </span>
            </div>
            <CopyField value={shareUrl(pub.token)} label="share link" />
            <div className="row gap wrap" style={{ marginTop: 8 }}>
              <a className="btn ghost" href={shareUrl(pub.token)} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} /> Open link
              </a>
              {outdated && (
                <button className="btn ghost" disabled={busy} onClick={update}>
                  <RefreshCw size={16} /> Update with latest changes
                </button>
              )}
            </div>
            <span className="field-hint">
              {outdated
                ? 'You’ve edited since sharing. Viewers still see the earlier layout (data stays live).'
                : 'Viewers see the latest version.'}
            </span>
          </div>

          <div className="field">
            <span className="field-label">Embed in Notion, website or client portal</span>
            <CopyField
              multiline
              label="embed code"
              value={`<iframe src="${shareUrl(pub.token, true)}" width="100%" height="640" style="border:0;border-radius:16px" title="${dashboard.name.replace(/"/g, '')}"></iframe>`}
            />
          </div>

          <button className="btn ghost danger self-start" disabled={busy} onClick={stop}>
            <Link2Off size={16} /> Turn off link
          </button>
        </div>
      )}
    </Sheet>
  );
}
