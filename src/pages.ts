import type { DashFilter, Dashboard, Page, Widget } from './types';

/**
 * Pages are optional: a dashboard without `pages` (everything made before Phase 4, and AI or
 * template output) is one implicit page. Widgets without a known `pageId` sit on the first page,
 * so no stored dashboard ever needs rewriting.
 */
export const DEFAULT_PAGE: Page = { id: 'main', name: 'Overview' };

export function pagesOf(d: Pick<Dashboard, 'pages'>): Page[] {
  return d.pages?.length ? d.pages : [DEFAULT_PAGE];
}

export function pageIdOf(w: Widget, pages: Page[]): string {
  return w.pageId && pages.some((p) => p.id === w.pageId) ? w.pageId : pages[0].id;
}

export function widgetsOn(d: Dashboard, pageId: string): Widget[] {
  const pages = pagesOf(d);
  return d.widgets.filter((w) => pageIdOf(w, pages) === pageId);
}

/** Click-to-filter: pick a value, or clear it when the same value is clicked again. */
export function toggleFilter(filters: DashFilter[] = [], sourceId: string, field: string, value: string): DashFilter[] {
  const i = filters.findIndex((f) => f.sourceId === sourceId && f.field === field);
  if (i < 0) return [...filters, { sourceId, field, value }];
  const f = filters[i];
  if (f.value === value && !f.pinned) return filters.filter((_, j) => j !== i);
  const next = [...filters];
  next[i] = { ...f, value: f.value === value ? undefined : value };
  return next;
}
