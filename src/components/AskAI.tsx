import { useState, type FormEvent } from 'react';
import { ArrowUp, LoaderCircle, Sparkles } from 'lucide-react';
import type { Dashboard, Widget } from '../types';
import { api, ApiError } from '../api';
import { applyAiEdit } from '../ai';
import { undo } from '../store';
import { toast } from './Toast';

interface Props {
  dashboard: Dashboard;
  /** The widgets on the current page, in order: the scope of layout edits. */
  widgets: Widget[];
  pageId?: string;
  /** When set, only this widget's JSON is sent and edited; otherwise a compact outline (layout edits). */
  widget?: Widget | null;
  onApplied?: () => void;
}

/** "Ask AI" for the board editor: an instruction → typed edit operations, applied as one undo step. */
export function AskAI({ dashboard, widgets, pageId, widget, onApplied }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const instruction = text.trim();
    if (!instruction || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { ops, summary } = await api.aiEdit(
        widget
          ? { instruction, widget }
          : { instruction, outline: widgets.map(({ id, type, title, size }) => ({ id, type, title, size })) },
      );
      if (!ops.length) {
        setMessage(summary || 'Nothing to change. Try saying it another way.');
        return;
      }
      applyAiEdit(dashboard.id, ops, widget ? [widget] : widgets, pageId);
      setText('');
      onApplied?.();
      toast(summary || 'Updated', { label: 'Undo', run: () => undo(dashboard.id) });
    } catch (err) {
      setMessage(
        err instanceof ApiError && err.status !== 503 && err.status !== 0
          ? err.message
          : 'AI edits aren’t available on this server (needs ANTHROPIC_API_KEY).',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="ask-ai" onSubmit={submit}>
      <div className="ask-ai-row">
        <Sparkles size={16} className="ask-ai-icon" aria-hidden />
        <input
          className="ask-ai-input"
          value={text}
          maxLength={500}
          aria-label={widget ? 'Ask AI to change this widget' : 'Ask AI to change this dashboard'}
          placeholder={widget ? 'Ask AI to change this widget' : 'Ask AI: “add a weekly distance chart”'}
          autoComplete="off"
          enterKeyHint="send"
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
        />
        <button className="icon-btn" aria-label="Apply" disabled={busy || !text.trim()}>
          {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
      {message && (
        <p className="ask-ai-msg small muted" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
