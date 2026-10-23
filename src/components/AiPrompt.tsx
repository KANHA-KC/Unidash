import { useState, type FormEvent } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import type { Template } from '../types';
import { api, ApiError } from '../api';
import { dashboardFromDraft, suggestTemplate } from '../ai';
import { addDashboard } from '../store';
import { navigate } from '../router';
import { toast } from './Toast';

interface Notice {
  text: string;
  template: Template | null;
}

/** Home: "What do you want to build?" → a generated dashboard, or the closest template when AI is unavailable. */
export function AiPrompt({ onPickTemplate }: { onPickTemplate: (t: Template) => void }) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = prompt.trim();
    if (!q || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const { dashboard } = await api.aiGenerate(q);
      const d = dashboardFromDraft(dashboard);
      addDashboard(d);
      toast('Built with AI. The numbers are samples to replace.');
      navigate(`/b/${d.id}`);
    } catch (err) {
      const unavailable = !(err instanceof ApiError) || err.status === 503 || err.status === 0;
      const template = suggestTemplate(q);
      const why = unavailable
        ? 'AI isn’t available on this server.'
        : (err as Error).message;
      setNotice({
        text: template ? `${why} Closest template:` : `${why} Try a template below.`,
        template,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="ai-prompt" onSubmit={submit}>
      <label className="ai-label" htmlFor="ai-prompt">
        What do you want to build?
      </label>
      <div className="ai-row">
        <input
          id="ai-prompt"
          className="input"
          value={prompt}
          maxLength={1000}
          placeholder="e.g. Track my marathon training"
          autoComplete="off"
          enterKeyHint="go"
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
        />
        <button className="btn primary" disabled={busy || !prompt.trim()}>
          {busy ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
          {busy ? 'Building…' : 'Build'}
        </button>
      </div>
      <div className="ai-status" role="status" aria-live="polite">
        {busy && <span className="muted small">Designing your dashboard. This can take up to half a minute.</span>}
        {notice && (
          <span className="small">
            <span className="muted">{notice.text}</span>{' '}
            {notice.template && (
              <button type="button" className="link-btn strong" onClick={() => onPickTemplate(notice.template!)}>
                {notice.template.emoji} {notice.template.name}
              </button>
            )}
          </span>
        )}
      </div>
    </form>
  );
}
