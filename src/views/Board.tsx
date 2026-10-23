import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowLeft, Copy, Database, Download, Ellipsis, History, Pencil, Plus, Share, Trash } from 'lucide-react';
import type { AccentName, Dashboard, DashFilter, DateRange, Widget, WidgetType } from '../types';
import {
  addDashboard,
  flushVersion,
  getState,
  patchWidgetData,
  removeDashboard,
  restoreDashboard,
  snapshot,
  uid,
  undo,
  updateDashboard,
  updateWidget,
  useStore,
} from '../store';
import { getDef } from '../widgets/registry';
import { WidgetCard } from '../components/WidgetCard';
import { ShareSheet } from '../components/ShareSheet';
import { useLiveStream } from '../live';
import { WidgetEditor } from '../components/WidgetEditor';
import { AskAI } from '../components/AskAI';
import { WidgetPicker } from '../components/WidgetPicker';
import { Menu } from '../components/Menu';
import { toast } from '../components/Toast';
import { navigate } from '../router';
import { ThemeButton } from './Home';
import { FilterBar } from '../components/FilterBar';
import { PageTabs } from '../components/PageTabs';
import { VersionSheet } from '../components/VersionSheet';
import { pageIdOf, pagesOf, toggleFilter, widgetsOn } from '../pages';

const ACCENTS: AccentName[] = ['blue', 'violet', 'magenta', 'red', 'orange', 'green', 'aqua'];
const EMOJI = ['✨', '🚀', '📈', '💰', '💪', '🌤️', '📚', '📖', '✈️', '🎉', '🏡', '🎬', '🗂️', '🧠', '🌱', '🎯', '☕', '🎵', '🐾', '🍳', '⚽', '🛠️', '❤️', '📊'];
const QUICK: WidgetType[] = ['stat', 'line', 'checklist', 'note'];

function newWidget(type: WidgetType): Widget {
  const def = getDef(type);
  const data = structuredClone(def.data);
  if (Array.isArray(data.items)) data.items = data.items.map((i: any) => ({ ...i, id: uid() }));
  return { id: uid(), type, size: def.size, title: def.title, data };
}

export function Board({ id, startEditing }: { id: string; startEditing: boolean }) {
  const dash = useStore((s) => s.dashboards.find((d) => d.id === id));
  const [editing, setEditing] = useState(startEditing);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const lastSwap = useRef<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // One live connection for every source this dashboard is bound to.
  useLiveStream((dash?.widgets ?? []).flatMap((w) => (w.binding ? [w.binding.sourceId] : [])));

  // A brand-new blank dashboard opens straight into the widget picker.
  useEffect(() => {
    if (startEditing) {
      navigate(`/b/${id}`, true);
      if (dash && dash.widgets.length === 0) setPickerOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doUndo = useCallback(() => {
    if (undo(id)) toast('Undone');
  }, [id]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo]);

  if (!dash) {
    return (
      <div className="page">
        <main className="container empty-state">
          <h1 className="title">Dashboard not found</h1>
          <p className="muted">It may have been deleted.</p>
          <a className="btn primary" href="#/">Back to dashboards</a>
        </main>
      </div>
    );
  }

  const update = (fn: (d: Dashboard) => Dashboard, opts?: { history?: boolean }) => updateDashboard(dash.id, fn, opts);
  const editingWidget = dash.widgets.find((w) => w.id === editId) ?? null;
  const pages = pagesOf(dash);
  const page = pages.find((p) => p.id === pageId)?.id ?? pages[0].id;
  const visible = widgetsOn(dash, page);

  // Filters are a viewing choice: saved with the dashboard, but not an undo step or a new version.
  const setFilters = (next: { filters?: DashFilter[]; dateRange?: DateRange }) =>
    updateDashboard(dash.id, (d) => ({ ...d, ...next }), { history: false, touch: false });
  const filterCtx = { filters: dash.filters, dateRange: dash.dateRange };
  const onSelect = (sourceId: string, field: string, label: string) =>
    setFilters({ filters: toggleFilter(dash.filters, sourceId, field, label) });

  const addPage = () => {
    const np = { id: uid(), name: `Page ${pages.length + 1}` };
    update((d) => ({ ...d, pages: [...pagesOf(d), np] }));
    setPageId(np.id);
  };

  const deletePage = (pid: string) => {
    const i = pages.findIndex((p) => p.id === pid);
    const gone = pages[i];
    update((d) => {
      const ps = pagesOf(d);
      return { ...d, pages: ps.filter((p) => p.id !== pid), widgets: d.widgets.filter((w) => pageIdOf(w, ps) !== pid) };
    });
    setPageId(pages[i === 0 ? 1 : i - 1]?.id ?? null);
    toast(`Deleted page “${gone?.name || 'Untitled'}”`, { label: 'Undo', run: () => { undo(dash.id); setPageId(pid); } });
  };

  const addWidget = (type: WidgetType) => {
    const w = { ...newWidget(type), ...(dash.pages ? { pageId: page } : {}) };
    update((d) => ({ ...d, widgets: [...d.widgets, w] }));
    setPickerOpen(false);
    setEditing(true);
    openEditor(w.id);
    requestAnimationFrame(() => document.querySelector(`[data-wid="${w.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const openEditor = (wid: string) => {
    // One undo step for the whole editing session, however many fields change.
    snapshot(dash.id);
    setEditId(wid);
  };

  const deleteWidget = (wid: string) => {
    const w = dash.widgets.find((x) => x.id === wid);
    update((d) => ({ ...d, widgets: d.widgets.filter((x) => x.id !== wid) }));
    setEditId(null);
    toast(`Deleted “${w?.title || 'widget'}”`, { label: 'Undo', run: () => undo(dash.id) });
  };

  const duplicateWidget = (wid: string) => {
    const copy = { ...structuredClone(dash.widgets.find((x) => x.id === wid)!), id: uid() };
    update((d) => {
      const i = d.widgets.findIndex((x) => x.id === wid);
      const ws = [...d.widgets];
      ws.splice(i + 1, 0, copy);
      return { ...d, widgets: ws };
    });
    setEditId(copy.id);
    toast('Duplicated');
  };

  // Moves step over neighbours on the same page; widgets on other pages keep their order.
  const move = (wid: string, by: number) => {
    const k = visible.findIndex((x) => x.id === wid);
    const other = visible[Math.max(0, Math.min(visible.length - 1, k + by))];
    if (!other || other.id === wid) return;
    update((d) => {
      const ws = [...d.widgets];
      const i = ws.findIndex((x) => x.id === wid);
      const j = ws.findIndex((x) => x.id === other.id);
      [ws[i], ws[j]] = [ws[j], ws[i]];
      return { ...d, widgets: ws };
    });
  };

  // ---- Drag to reorder (mouse, pen and touch) ----
  const onGripDown = (e: PointerEvent, wid: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    snapshot(dash.id);
    lastSwap.current = null;
    setDragId(wid);
  };

  const onGripMove = (e: PointerEvent) => {
    if (!dragId) return;
    const edge = 72;
    if (e.clientY < edge) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 12);
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-wid]')?.dataset.wid;
    if (!over || over === dragId) {
      if (over === dragId) lastSwap.current = null;
      return;
    }
    if (over === lastSwap.current) return; // avoid flip-flopping between different-sized cards
    lastSwap.current = over;
    update(
      (d) => {
        const ws = [...d.widgets];
        const from = ws.findIndex((x) => x.id === dragId);
        const to = ws.findIndex((x) => x.id === over);
        const [m] = ws.splice(from, 1);
        ws.splice(to, 0, m);
        return { ...d, widgets: ws };
      },
      { history: false },
    );
  };

  const onGripUp = () => setDragId(null);

  const onCardKey = (e: KeyboardEvent, wid: string) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEditor(wid);
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
      e.preventDefault();
      move(wid, -1);
    } else if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
      e.preventDefault();
      move(wid, 1);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      deleteWidget(wid);
    }
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(dash, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${dash.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'dashboard'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const duplicateDashboard = () => {
    const copy: Dashboard = {
      ...structuredClone(dash),
      id: uid(),
      publication: undefined,
      name: `${dash.name} copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addDashboard(copy);
    navigate(`/b/${copy.id}`);
    toast('Dashboard duplicated');
  };

  const deleteDashboard = () => {
    const index = getState().dashboards.findIndex((d) => d.id === dash.id);
    const saved = dash;
    removeDashboard(dash.id);
    navigate('/');
    toast(`Deleted “${saved.name}”`, { label: 'Undo', run: () => restoreDashboard(saved, index) });
  };

  return (
    <div className={`page board accent-${dash.accent} ${editing ? 'is-editing' : ''} ${dragId ? 'is-dragging' : ''}`}>
      <header className="topbar sticky">
        <div className="row gap-sm grow min0">
          <a href="#/" className="icon-btn" aria-label="All dashboards">
            <ArrowLeft size={18} />
          </a>
          {editing ? (
            <>
              <Menu label="Change icon" trigger={<span className="emoji">{dash.emoji}</span>}>
                {(close) => (
                  <div className="emoji-grid">
                    {EMOJI.map((em) => (
                      <button key={em} onClick={() => { update((d) => ({ ...d, emoji: em })); close(); }} aria-label={`Use ${em}`}>
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </Menu>
              <input
                className="name-input"
                value={dash.name}
                aria-label="Dashboard name"
                onFocus={() => snapshot(dash.id)}
                onChange={(e) => update((d) => ({ ...d, name: e.target.value }), { history: false })}
              />
            </>
          ) : (
            <h1 className="board-title">
              <span aria-hidden>{dash.emoji}</span> {dash.name}
            </h1>
          )}
        </div>
        <div className="row gap-sm">
          {editing ? (
            <>
              <button className="btn" onClick={() => setPickerOpen(true)}>
                <Plus size={16} /> <span className="hide-xs">Add</span>
              </button>
              <button className="btn primary" onClick={() => { setEditing(false); flushVersion(dash.id); }}>
                Done
              </button>
            </>
          ) : (
            <>
              <button className="btn ghost hide-xs" onClick={() => setShareOpen(true)}>
                <Share size={15} /> Share
              </button>
              <button className="btn" onClick={() => setEditing(true)}>
                <Pencil size={15} /> Edit
              </button>
            </>
          )}
          <Menu label="More options" trigger={<Ellipsis size={18} />}>
            {(close) => (
              <>
                <div className="menu-label">Color</div>
                <div className="swatches">
                  {ACCENTS.map((a) => (
                    <button
                      key={a}
                      className={`swatch-btn accent-${a} ${dash.accent === a ? 'on' : ''}`}
                      aria-label={`${a} accent`}
                      aria-pressed={dash.accent === a}
                      onClick={() => update((d) => ({ ...d, accent: a }))}
                    />
                  ))}
                </div>
                <div className="menu-sep" />
                <div className="menu-theme">
                  <span>Appearance</span>
                  <ThemeButton />
                </div>
                <div className="menu-sep" />
                <button role="menuitem" onClick={() => { close(); setShareOpen(true); }}>
                  <Share size={16} /> Share link{dash.publication ? ' · on' : ''}
                </button>
                <button role="menuitem" onClick={() => { close(); navigate('/data'); }}>
                  <Database size={16} /> Data sources
                </button>
                <button role="menuitem" onClick={() => { close(); flushVersion(dash.id); setVersionsOpen(true); }}>
                  <History size={16} /> Version history
                </button>
                <div className="menu-sep" />
                <button role="menuitem" onClick={() => { close(); duplicateDashboard(); }}>
                  <Copy size={16} /> Duplicate dashboard
                </button>
                <button role="menuitem" onClick={() => { close(); exportFile(); }}>
                  <Download size={16} /> Export as file
                </button>
                <button role="menuitem" className="danger" onClick={() => { close(); deleteDashboard(); }}>
                  <Trash size={16} /> Delete dashboard
                </button>
              </>
            )}
          </Menu>
        </div>
      </header>

      <PageTabs
        pages={pages}
        current={page}
        onPick={setPageId}
        editing={editing}
        onAdd={addPage}
        onRenameStart={() => snapshot(dash.id)}
        onRename={(pid, name) => update((d) => ({ ...d, pages: pagesOf(d).map((p) => (p.id === pid ? { ...p, name } : p)) }), { history: false })}
        onDelete={deletePage}
      />

      <main className="container">
        <FilterBar widgets={dash.widgets} filters={dash.filters ?? []} dateRange={dash.dateRange ?? 'all'} onChange={setFilters} canAdd />
        {editing && <AskAI dashboard={dash} widgets={visible} pageId={page} />}
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-mark" aria-hidden>
              <Plus size={26} />
            </div>
            <h2 className="title">Nothing here yet</h2>
            <p className="muted">Add a number, a chart, a checklist — anything you want to keep an eye on.</p>
            <div className="row gap wrap center">
              {QUICK.map((t) => {
                const def = getDef(t);
                return (
                  <button key={t} className="btn" onClick={() => addWidget(t)}>
                    <def.icon size={16} /> {def.name}
                  </button>
                );
              })}
            </div>
            <button className="btn primary" onClick={() => setPickerOpen(true)}>
              Browse all widgets
            </button>
          </div>
        ) : (
          <div className="grid">
            {visible.map((w) => (
              <WidgetCard
                key={w.id}
                widget={w}
                editing={editing}
                filters={filterCtx}
                onSelect={onSelect}
                dragging={dragId === w.id}
                onOpen={() => openEditor(w.id)}
                onKeyDown={(e) => onCardKey(e, w.id)}
                onChange={(patch) => patchWidgetData(dash.id, w.id, patch)}
                grip={{ onPointerDown: (e) => onGripDown(e, w.id), onPointerMove: onGripMove, onPointerUp: onGripUp }}
              />
            ))}
            {editing && (
              <button className="card add-tile size-sm" onClick={() => setPickerOpen(true)}>
                <Plus size={20} />
                Add widget
              </button>
            )}
          </div>
        )}
      </main>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} dashboard={dash} />
      <VersionSheet open={versionsOpen} onClose={() => setVersionsOpen(false)} dashboardId={dash.id} />
      <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addWidget} />
      <WidgetEditor
        widget={editingWidget}
        onClose={() => setEditId(null)}
        onUpdate={(fn) => editingWidget && updateWidget(dash.id, editingWidget.id, fn, { history: false })}
        onDuplicate={() => editingWidget && duplicateWidget(editingWidget.id)}
        onDelete={() => editingWidget && deleteWidget(editingWidget.id)}
        askAi={(onApplied) => <AskAI dashboard={dash} widgets={visible} pageId={page} widget={editingWidget} onApplied={onApplied} />}
        pages={pages}
        pageId={editingWidget ? pageIdOf(editingWidget, pages) : undefined}
        onMoveToPage={(pid) => {
          if (!editingWidget) return;
          updateWidget(dash.id, editingWidget.id, (w) => ({ ...w, pageId: pid }), { history: false });
          setEditId(null);
          setPageId(pid);
          toast(`Moved to “${pages.find((p) => p.id === pid)?.name || 'Untitled'}”`);
        }}
      />
    </div>
  );
}
