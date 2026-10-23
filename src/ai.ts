import type { Dashboard, Template, Widget } from './types';
import type { DraftDashboard, EditOp } from '../shared/ai.ts';
import { applyOps, sanitizeDashboard } from '../shared/ai.ts';
import { uid, updateDashboard } from './store';
import { TEMPLATES } from './templates';

/** Turn a validated AI draft into a stored dashboard (validated again: the browser trusts nothing it renders). */
export function dashboardFromDraft(draft: DraftDashboard): Dashboard {
  const clean = sanitizeDashboard(draft);
  const now = Date.now();
  return { id: uid(), ...clean, widgets: clean.widgets.map((w) => ({ ...w, id: uid() })), createdAt: now, updatedAt: now };
}

/**
 * Apply AI edit operations through the store as a single undo step. Ops index into `pageWidgets`
 * (what the model was shown); widgets on other pages keep their places.
 */
export function applyAiEdit(dashId: string, ops: EditOp[], pageWidgets: Widget[], pageId?: string) {
  updateDashboard(dashId, (d) => {
    const onPage = new Set(pageWidgets.map((w) => w.id));
    const current = d.widgets.filter((w) => onPage.has(w.id));
    const edited = applyOps(current, ops, uid).map((w) => (onPage.has(w.id) || !d.pages?.length || !pageId ? w : { ...w, pageId }));
    // Refill this page's slots in order; extra widgets go at the end.
    const rest = [...edited];
    const widgets = d.widgets.flatMap((w) => (onPage.has(w.id) ? (rest.length ? [rest.shift()!] : []) : [w]));
    return { ...d, widgets: [...widgets, ...rest] };
  });
}

// Extra words people use for each template's topic, so the no-AI fallback still finds a match.
const KEYWORDS: Record<string, string> = {
  'automation-portal': 'automation n8n zapier make workflow agency client portal runs',
  'live-store': 'shop store ecommerce orders shopify revenue sales',
  'api-health': 'api uptime latency errors server monitoring devops status',
  startup: 'startup saas mrr arr churn runway investors growth founder',
  sales: 'sales pipeline deals crm quota leads prospects',
  project: 'project launch milestones tasks deadline sprint team roadmap',
  creator: 'creator youtube instagram tiktok followers subscribers content social views',
  habits: 'habits daily routine mood water sleep journal life wellbeing',
  fitness: 'fitness workout gym run running marathon training race km miles weight exercise cycling swim steps health',
  budget: 'budget money spending expenses finance savings income bills',
  study: 'study exam school university course homework revision learning',
  reading: 'reading books pages library novels',
  trip: 'trip travel vacation holiday flight packing itinerary',
  event: 'event wedding party guests vendors conference birthday',
  home: 'home household chores family bills house',
};

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const stem = (w: string) => w.replace(/(ing|es|s)$/, '');

/** The template closest to a prompt by keywords, or null when nothing matches. */
export function suggestTemplate(prompt: string): Template | null {
  const asked = new Set(words(prompt).filter((w) => w.length > 2).map(stem));
  let best: Template | null = null;
  let bestScore = 0;
  for (const t of TEMPLATES) {
    const bag = new Set(words(`${t.name} ${t.description} ${t.category} ${KEYWORDS[t.id] ?? ''} ${t.widgets.map((w) => w.title).join(' ')}`).map(stem));
    let score = 0;
    for (const w of asked) if (bag.has(w)) score += 1;
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}
