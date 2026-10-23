export type WidgetType =
  | 'stat'
  | 'line'
  | 'bar'
  | 'donut'
  | 'progress'
  | 'checklist'
  | 'counter'
  | 'note'
  | 'table'
  | 'countdown'
  | 'clock'
  | 'links'
  | 'image'
  | 'heading';

/** Column span on the 4-column desktop grid. Phones and tablets collapse to 2 columns. */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export interface Point {
  label: string;
  value: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface LinkItem {
  label: string;
  url: string;
}

export type Aggregation = 'latest' | 'sum' | 'avg' | 'min' | 'max' | 'count';

/** Connects a widget to a data source. Which fields are used depends on the widget's bind kind. */
export interface Binding {
  sourceId: string;
  /** value widgets: the number to show */
  field?: string;
  /** series/category widgets: label (x axis or slice) and value fields */
  labelField?: string;
  valueField?: string;
  /** "none" plots each row as-is; anything else groups rows by label */
  agg?: Aggregation | 'none';
  /** table: which columns, and how many recent rows */
  columns?: string[];
  limit?: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  title: string;
  /** Type-specific settings; shapes are declared by each widget's defaults in the registry. */
  data: Record<string, any>;
  binding?: Binding;
  /** True while the widget still shows template sample values. */
  sample?: boolean;
  /** Which page it sits on; missing or unknown means the first page. */
  pageId?: string;
}

export interface Page {
  id: string;
  name: string;
}

/** Dashboard-level filter on one field of a source. No value means "All" (kept in the bar, inactive). */
export interface DashFilter {
  sourceId: string;
  field: string;
  value?: string;
  /** Added from the filter bar: stays there as a dropdown when cleared. Click filters vanish instead. */
  pinned?: boolean;
}

export type DateRange = 'all' | 'hour' | 'today' | '7d';

export type AccentName = 'blue' | 'orange' | 'aqua' | 'violet' | 'magenta' | 'green' | 'red';

export interface Dashboard {
  id: string;
  name: string;
  emoji: string;
  accent: AccentName;
  widgets: Widget[];
  createdAt: number;
  updatedAt: number;
  /** Set while a share link exists. */
  publication?: { token: string; publishedAt: number; mode?: 'public' | 'private' | 'password'; expiresAt?: number };
  /** Which template this came from (blueprint §8.4: record origin, never auto-update). */
  fromTemplate?: string;
  /** Pages (tabs). Missing means one implicit page holding every widget. */
  pages?: Page[];
  /** Filters applied to every widget bound to the filter's source (read/filter only). */
  filters?: DashFilter[];
  /** Time window applied to each bound source's date field. */
  dateRange?: DateRange;
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface Template {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  accent: AccentName;
  /** Live templates create this source on install and bind widgets that use sourceId "$source". */
  source?: { kind: 'demo' | 'webhook'; demo: 'store' | 'api' | 'automation'; name: string };
  live?: boolean;
  widgets: Omit<Widget, 'id'>[];
}
