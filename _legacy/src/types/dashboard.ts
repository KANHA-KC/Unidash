export type WidgetType =
  | 'metric'
  | 'area-chart'
  | 'bar-chart'
  | 'donut-chart'
  | 'table'
  | 'habits'
  | 'status-feed'
  | 'gauge'
  | 'note';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export interface WidgetLayout {
  x: number; // 0 to 11 (12-column grid)
  y: number; // grid row
  w: number; // width in columns (1 to 12)
  h: number; // height in grid units
}

export interface DataBinding {
  sourceId: string;
  field?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'latest' | 'min' | 'max';
  format?: 'currency' | 'percent' | 'number' | 'bytes' | 'ms' | 'text';
}

export interface WidgetProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  cardStyle?: 'glass' | 'solid' | 'translucent' | 'minimal';
  // Metric specific
  value?: number | string;
  change?: number;
  changePeriod?: string;
  prefix?: string;
  suffix?: string;
  // Chart specific
  chartData?: Array<{ label: string; value: number; secondary?: number }>;
  chartType?: 'area' | 'bar' | 'donut';
  colorPalette?: string[];
  showLegend?: boolean;
  // Table specific
  columns?: Array<{ key: string; label: string; width?: string; type?: 'text' | 'badge' | 'number' | 'status' }>;
  rows?: Array<Record<string, any>>;
  pageSize?: number;
  // Habits / Checklist specific
  items?: Array<{ id: string; label: string; done: boolean; category?: string; streak?: number }>;
  // Status feed specific
  events?: Array<{ id: string; timestamp: string; message: string; level: 'info' | 'success' | 'warning' | 'error' }>;
  // Gauge specific
  gaugeValue?: number;
  gaugeMin?: number;
  gaugeMax?: number;
  gaugeTarget?: number;
  // Note specific
  content?: string;
  [key: string]: any;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  layout: WidgetLayout;
  props: WidgetProps;
  binding?: DataBinding;
  events?: Array<{ trigger: string; action: string; targetId?: string }>;
}

export interface DashboardPage {
  id: string;
  title: string;
  icon?: string;
  components: DashboardWidget[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'rest' | 'csv' | 'realtime' | 'manual';
  status: 'connected' | 'syncing' | 'stale' | 'error';
  lastSync: string;
  refreshIntervalSec: number;
  endpointUrl?: string;
  data: any;
}

export interface DashboardTheme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  accentColor: string; // e.g. '#0071e3'
  glassBlur: number; // in px
  borderRadius: number; // in px
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'personal' | 'technical' | 'custom';
  pages: DashboardPage[];
  activePageId: string;
  theme: DashboardTheme;
  visibility: 'private' | 'link' | 'public';
  slug: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isFavorite?: boolean;
}

export interface Template {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'business' | 'personal' | 'technical';
  author: string;
  authorAvatar?: string;
  downloads: number;
  rating: number;
  featured?: boolean;
  icon: string;
  previewColor: string;
  widgetCount: number;
  dashboard: Dashboard;
  requiredConnectors: string[];
}

export type ViewMode = 'home' | 'editor' | 'published';
