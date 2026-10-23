import { useRef, useState } from 'react';
import { Database, Monitor, Moon, Plus, Sun, Upload, User as UserIcon } from 'lucide-react';
import type { Dashboard, Template, ThemePref } from '../types';
import { addDashboard, setTheme, uid, useStore } from '../store';
import { installTemplate } from '../templates';
import { timeAgo } from '../format';
import { MiniPreview } from '../components/MiniPreview';
import { TemplateGallery } from '../components/TemplateGallery';
import { AiPrompt } from '../components/AiPrompt';
import { Sheet } from '../components/Sheet';
import { toast } from '../components/Toast';
import { navigate } from '../router';
import { useAuth } from '../auth';

const NEXT_THEME: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon };

export function ThemeButton() {
  const theme = useStore((s) => s.theme);
  const Icon = THEME_ICON[theme];
  return (
    <button className="icon-btn" aria-label={`Theme: ${theme}. Change theme`} title={`Theme: ${theme}`} onClick={() => setTheme(NEXT_THEME[theme])}>
      <Icon size={18} />
    </button>
  );
}

export function Home() {
  const dashboards = useStore((s) => s.dashboards);
  const { user } = useAuth();
  const [newOpen, setNewOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [installing, setInstalling] = useState(false);

  const create = async (t: Template | null) => {
    if (installing) return;
    setInstalling(true);
    const { dashboard: d, offline } = await installTemplate(t, t ? undefined : 'Untitled dashboard');
    setInstalling(false);
    addDashboard(d);
    setNewOpen(false);
    if (offline) toast('Data server is offline, so this uses sample data for now');
    navigate(`/b/${d.id}${t ? '' : '?edit=1'}`);
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Dashboard;
      if (!parsed || !Array.isArray(parsed.widgets)) throw new Error('bad file');
      const d: Dashboard = {
        ...parsed,
        id: uid(),
        publication: undefined,
        widgets: parsed.widgets.map((w) => ({ ...w, id: uid() })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addDashboard(d);
      toast(`Imported “${d.name}”`);
    } catch {
      toast('That file isn’t a Unidash dashboard');
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden />
          Unidash
        </div>
        <div className="row gap-sm">
          <a className="btn ghost" href="#/signin" title={user ? user.email : 'Sign In'}>
            <UserIcon size={16} /> <span className="hide-xs">{user?.email ? user.email.split('@')[0] : 'Sign In'}</span>
          </a>
          <a className="btn ghost" href="#/data">
            <Database size={16} /> <span className="hide-xs">Data sources</span>
          </a>
          <button className="icon-btn" aria-label="Import a dashboard file" title="Import" onClick={() => fileInput.current?.click()}>
            <Upload size={18} />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = '';
            }}
          />
          <ThemeButton />
        </div>
      </header>

      <main className="container">
        {dashboards.length === 0 ? (
          <section className="hero">
            <h1>Anything can be a dashboard.</h1>
            <p className="lead">Pick a starting point. Every number, chart and list is yours to change.</p>
          </section>
        ) : (
          <section className="section">
            <div className="section-head">
              <h1 className="title">Your dashboards</h1>
              <button className="btn primary" onClick={() => setNewOpen(true)}>
                <Plus size={16} /> New
              </button>
            </div>
            <div className="card-grid">
              {dashboards.map((d) => (
                <a key={d.id} href={`#/b/${d.id}`} className={`dash-card accent-${d.accent}`}>
                  <MiniPreview sizes={d.widgets.map((w) => w.size)} />
                  <span className="tpl-name">
                    <span aria-hidden>{d.emoji}</span> {d.name}
                  </span>
                  <span className="muted small">
                    {d.widgets.length} {d.widgets.length === 1 ? 'widget' : 'widgets'} · edited {timeAgo(d.updatedAt)}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <AiPrompt onPickTemplate={create} />
        </section>

        <section className="section">
          {dashboards.length > 0 && <h2 className="subtitle">Start from a template</h2>}
          <TemplateGallery onPick={create} />
        </section>
      </main>

      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New dashboard" wide>
        <TemplateGallery onPick={create} />
      </Sheet>
    </div>
  );
}
