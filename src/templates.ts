import type { Binding, Dashboard, Template, Widget, WidgetSize, WidgetType } from './types';
import { uid } from './store';
import { api } from './api';
import { getDef } from './widgets/registry';

/** Template values for numbers, charts and tables are examples, so they're labelled "Sample". */
const SAMPLE_TYPES: WidgetType[] = ['stat', 'progress', 'line', 'bar', 'donut', 'table'];

const w = (type: WidgetType, title: string, size: WidgetSize, data: Record<string, any> = {}): Omit<Widget, 'id'> => ({
  type,
  title,
  size,
  data,
  ...(SAMPLE_TYPES.includes(type) ? { sample: true } : {}),
});

/** A widget bound to the template's own source ("$source" is replaced on install). */
const live = (type: WidgetType, title: string, size: WidgetSize, binding: Omit<Binding, 'sourceId'>, data: Record<string, any> = {}): Omit<Widget, 'id'> => ({
  type,
  title,
  size,
  data,
  binding: { sourceId: '$source', ...binding },
});

const pts = (labels: string[], values: number[]) => labels.map((label, i) => ({ label, value: values[i] }));
const items = (...list: [string, boolean][]) => list.map(([text, done]) => ({ id: uid(), text, done }));
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const CATEGORIES = ['All', 'Live data', 'Work', 'Personal', 'Health', 'Money', 'Learning', 'Events'];

export const TEMPLATES: Template[] = [
  {
    id: 'automation-portal',
    name: 'Automation client portal',
    emoji: '🤖',
    category: 'Live data',
    accent: 'violet',
    live: true,
    description: 'Show clients their n8n / Make / Zapier runs live. Comes with a webhook.',
    source: { kind: 'webhook', demo: 'automation', name: 'Automation runs (webhook)' },
    widgets: [
      live('stat', 'Hours saved', 'sm', { field: 'hours_saved', agg: 'sum' }, { suffix: ' h' }),
      live('stat', 'Runs', 'sm', { agg: 'count' }),
      live('stat', 'Spend on AI & APIs', 'sm', { field: 'cost_usd', agg: 'sum' }, { prefix: '$' }),
      live('donut', 'Run status', 'sm', { labelField: 'status', agg: 'count' }),
      live('bar', 'Hours saved by workflow', 'md', { labelField: 'workflow', valueField: 'hours_saved', agg: 'sum' }, { suffix: ' h' }),
      live('table', 'Latest runs', 'md', { columns: ['execution_date', 'workflow', 'status', 'hours_saved'], limit: 6 }),
      w('note', 'Connect your automations', 'full', {
        text: 'This portal already has its own webhook. Open ••• → Data sources → “Automation runs” to copy the URL and token, then add an HTTP Request step at the end of your workflow that POSTs:\n- execution_date, workflow, status, hours_saved, cost_usd\nThe example runs are sample data — clear them from the same screen when you go live.',
      }),
    ],
  },
  {
    id: 'live-store',
    name: 'Live store',
    emoji: '🛍️',
    category: 'Live data',
    accent: 'blue',
    live: true,
    description: 'Orders and revenue streaming in, by region and channel.',
    source: { kind: 'demo', demo: 'store', name: 'Store (live demo)' },
    widgets: [
      live('stat', 'Revenue', 'sm', { field: 'revenue', agg: 'sum' }, { prefix: '$' }),
      live('stat', 'Orders', 'sm', { field: 'orders', agg: 'sum' }),
      live('stat', 'Last order batch', 'sm', { field: 'revenue', agg: 'latest' }, { prefix: '$' }),
      live('progress', 'Daily target', 'sm', { field: 'revenue', agg: 'sum' }, { target: 30000, prefix: '$', style: 'ring' }),
      live('line', 'Revenue as it happens', 'lg', { labelField: '_time', valueField: 'revenue', agg: 'none', limit: 30 }, { prefix: '$' }),
      live('donut', 'Revenue by region', 'sm', { labelField: 'region', valueField: 'revenue', agg: 'sum' }, { prefix: '$' }),
      live('bar', 'Orders by channel', 'md', { labelField: 'channel', valueField: 'orders', agg: 'sum' }),
      live('table', 'Latest orders', 'md', { columns: ['_time', 'region', 'channel', 'revenue'], limit: 6 }),
    ],
  },
  {
    id: 'api-health',
    name: 'API health monitor',
    emoji: '🩺',
    category: 'Live data',
    accent: 'aqua',
    live: true,
    description: 'Latency, traffic and errors, refreshed every few seconds.',
    source: { kind: 'demo', demo: 'api', name: 'API health (live demo)' },
    widgets: [
      live('stat', 'Latency', 'sm', { field: 'latency_ms', agg: 'latest' }, { suffix: ' ms' }),
      live('stat', 'Requests / interval', 'sm', { field: 'requests', agg: 'latest' }),
      live('stat', 'Errors', 'sm', { field: 'errors', agg: 'sum' }),
      live('donut', 'Health checks', 'sm', { labelField: 'status', agg: 'count' }),
      live('line', 'Latency (ms)', 'lg', { labelField: '_time', valueField: 'latency_ms', agg: 'none', limit: 40 }, { suffix: ' ms' }),
      live('bar', 'Traffic by endpoint', 'sm', { labelField: 'endpoint', valueField: 'requests', agg: 'sum' }),
      live('table', 'Recent checks', 'full', { columns: ['_time', 'endpoint', 'latency_ms', 'errors', 'status'], limit: 6 }),
    ],
  },
  {
    id: 'startup',
    name: 'Startup metrics',
    emoji: '🚀',
    category: 'Work',
    accent: 'blue',
    description: 'Revenue, growth and runway at a glance.',
    widgets: [
      w('stat', 'MRR', 'sm', { value: 48200, prefix: '$', delta: 12.4, caption: 'vs last month', trend: [31, 34, 37, 40, 43, 48.2] }),
      w('stat', 'Active users', 'sm', { value: 3120, delta: 6.1, caption: 'vs last month', trend: [2.4, 2.6, 2.7, 2.8, 2.9, 3.1] }),
      w('stat', 'Churn', 'sm', { value: 2.1, suffix: '%', delta: -0.4, caption: 'monthly', trend: [3.1, 2.9, 2.6, 2.5, 2.5, 2.1] }),
      w('progress', 'Runway', 'sm', { value: 14, target: 24, suffix: ' mo', style: 'ring' }),
      w('line', 'Revenue', 'lg', { points: pts(months, [31000, 34200, 37100, 40300, 43800, 48200]), prefix: '$' }),
      w('donut', 'Revenue by plan', 'sm', { points: pts(['Pro', 'Team', 'Starter'], [26000, 15400, 6800]), prefix: '$' }),
      w('bar', 'Signups this week', 'md', { points: pts(week, [42, 51, 47, 63, 58, 22, 18]) }),
      w('table', 'Biggest accounts', 'md', {
        rows: [['Customer', 'Plan', 'MRR'], ['Acme Co', 'Team', '$4,200'], ['Globex', 'Pro', '$2,900'], ['Umbrella', 'Pro', '$2,400'], ['Initech', 'Team', '$1,800']],
      }),
    ],
  },
  {
    id: 'sales',
    name: 'Sales pipeline',
    emoji: '📈',
    category: 'Work',
    accent: 'green',
    description: 'Deals, quota and the people closing them.',
    widgets: [
      w('progress', 'Quarterly quota', 'md', { value: 182000, target: 250000, prefix: '$', style: 'bar' }),
      w('stat', 'Open deals', 'sm', { value: 37, delta: 9, caption: 'this week' }),
      w('stat', 'Win rate', 'sm', { value: 28, suffix: '%', delta: 3.5, caption: 'last 90 days' }),
      w('bar', 'Pipeline by stage', 'md', { points: pts(['Lead', 'Qualified', 'Demo', 'Proposal', 'Won'], [120, 64, 38, 21, 12]) }),
      w('donut', 'Deals by source', 'md', { points: pts(['Inbound', 'Outbound', 'Referral', 'Events'], [44, 31, 17, 8]) }),
      w('table', 'Closing soon', 'full', {
        rows: [['Deal', 'Owner', 'Value', 'Close'], ['Northwind renewal', 'Ana', '$38,000', 'Fri'], ['Contoso expansion', 'Sam', '$22,500', 'Next week'], ['Fabrikam pilot', 'Lee', '$9,000', 'Next week']],
      }),
    ],
  },
  {
    id: 'project',
    name: 'Project launch',
    emoji: '🗂️',
    category: 'Work',
    accent: 'violet',
    description: 'Milestones, tasks and a countdown to ship day.',
    widgets: [
      w('countdown', 'Launch day', 'sm', { date: inDays(21) }),
      w('progress', 'Tasks done', 'sm', { value: 34, target: 52, style: 'ring' }),
      w('checklist', 'This week', 'md', { items: items(['Final design review', true], ['Write release notes', false], ['QA on mobile', false], ['Prep launch email', false]) }),
      w('bar', 'Tasks closed per week', 'md', { points: pts(['W1', 'W2', 'W3', 'W4', 'W5'], [6, 9, 7, 12, 10]) }),
      w('note', 'Risks', 'md', { text: '- Payments vendor sign-off pending\n- Need one more QA device' }),
      w('links', 'Project links', 'sm', { links: [{ label: 'Roadmap', url: 'https://example.com' }, { label: 'Design files', url: 'https://example.com' }] }),
    ],
  },
  {
    id: 'creator',
    name: 'Creator stats',
    emoji: '🎬',
    category: 'Work',
    accent: 'magenta',
    description: 'Followers, views and your content plan.',
    widgets: [
      w('stat', 'Followers', 'sm', { value: 24800, delta: 4.2, caption: 'this month', trend: [19, 20.5, 21.8, 22.6, 23.7, 24.8] }),
      w('stat', 'Avg. views', 'sm', { value: 9300, delta: -2.1, caption: 'per video' }),
      w('stat', 'Income', 'sm', { value: 3150, prefix: '$', delta: 18, caption: 'this month' }),
      w('progress', 'Road to 50k', 'sm', { value: 24800, target: 50000, style: 'ring' }),
      w('line', 'Views per week', 'lg', { points: pts(['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], [41000, 52000, 48000, 61000, 58000, 72000]) }),
      w('checklist', 'Content plan', 'sm', { items: items(['Script: studio tour', true], ['Film Q&A', false], ['Edit vlog #12', false]) }),
    ],
  },
  {
    id: 'habits',
    name: 'Daily life',
    emoji: '🌤️',
    category: 'Personal',
    accent: 'orange',
    description: 'Habits, water, mood and a clear head.',
    widgets: [
      w('heading', 'Today', 'full', { subtitle: 'Small things, every day.' }),
      w('checklist', 'Habits', 'sm', { items: items(['Meditate 10 min', true], ['Walk 8k steps', false], ['No phone after 10pm', false], ['Read', true]) }),
      w('counter', 'Glasses of water', 'sm', { value: 3, step: 1, goal: 8, suffix: '' }),
      w('clock', 'Now', 'sm', { timeZone: '' }),
      w('note', 'Grateful for', 'sm', { text: '- Sunny morning\n- Call with an old friend' }),
      w('bar', 'Sleep this week', 'md', { points: pts(week, [7.2, 6.5, 8.1, 7.4, 6.9, 8.8, 8.2]), suffix: 'h' }),
      w('line', 'Mood (1–10)', 'md', { points: pts(week, [6, 7, 5, 7, 8, 9, 8]) }),
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    category: 'Health',
    accent: 'red',
    description: 'Workouts, weight and personal records.',
    widgets: [
      w('stat', 'Weight', 'sm', { value: 74.2, suffix: ' kg', delta: -1.3, caption: 'this month', trend: [76.1, 75.8, 75.2, 74.9, 74.6, 74.2] }),
      w('progress', 'Workouts this month', 'sm', { value: 11, target: 16, style: 'ring' }),
      w('counter', 'Push-ups today', 'sm', { value: 40, step: 10, goal: 100 }),
      w('countdown', 'Half marathon', 'sm', { date: inDays(64) }),
      w('bar', 'Minutes active', 'lg', { points: pts(week, [45, 30, 60, 0, 50, 90, 20]), suffix: ' min' }),
      w('table', 'Personal records', 'sm', { rows: [['Lift', 'Best'], ['Squat', '110 kg'], ['Bench', '80 kg'], ['Deadlift', '140 kg'], ['5k', '23:41']] }),
    ],
  },
  {
    id: 'budget',
    name: 'Monthly budget',
    emoji: '💰',
    category: 'Money',
    accent: 'aqua',
    description: 'Income, spending and savings goals.',
    widgets: [
      w('stat', 'Income', 'sm', { value: 5200, prefix: '$', caption: 'this month' }),
      w('stat', 'Spent', 'sm', { value: 3480, prefix: '$', delta: -6, caption: 'vs last month' }),
      w('stat', 'Saved', 'sm', { value: 1720, prefix: '$', delta: 22, caption: 'vs last month' }),
      w('progress', 'Emergency fund', 'sm', { value: 6500, target: 10000, prefix: '$', style: 'ring' }),
      w('donut', 'Where it went', 'md', { points: pts(['Rent', 'Groceries', 'Transport', 'Eating out', 'Other'], [1600, 620, 240, 380, 640]), prefix: '$' }),
      w('line', 'Net worth', 'md', { points: pts(months, [21000, 22400, 22100, 23900, 25300, 27000]), prefix: '$' }),
      w('checklist', 'Bills', 'full', { items: items(['Rent', true], ['Electricity', true], ['Phone', false], ['Gym', false]) }),
    ],
  },
  {
    id: 'study',
    name: 'Study plan',
    emoji: '📚',
    category: 'Learning',
    accent: 'violet',
    description: 'Exams, study hours and what is next.',
    widgets: [
      w('countdown', 'Finals', 'sm', { date: inDays(38) }),
      w('progress', 'Syllabus covered', 'sm', { value: 62, target: 100, suffix: '%', style: 'ring' }),
      w('counter', 'Pomodoros today', 'sm', { value: 4, step: 1, goal: 8 }),
      w('stat', 'Study hours', 'sm', { value: 21, suffix: 'h', delta: 15, caption: 'this week' }),
      w('bar', 'Hours by subject', 'md', { points: pts(['Math', 'Physics', 'History', 'French'], [8, 6, 4, 3]), suffix: 'h' }),
      w('checklist', 'To revise', 'md', { items: items(['Integration by parts', true], ['Thermodynamics ch. 4', false], ['WW1 causes essay', false]) }),
    ],
  },
  {
    id: 'reading',
    name: 'Reading log',
    emoji: '📖',
    category: 'Learning',
    accent: 'orange',
    description: 'Books, pages and your yearly goal.',
    widgets: [
      w('progress', '2026 reading goal', 'md', { value: 17, target: 30, suffix: ' books', style: 'bar' }),
      w('stat', 'Pages this month', 'sm', { value: 846, delta: 12 }),
      w('counter', 'Pages today', 'sm', { value: 20, step: 10, goal: 40 }),
      w('table', 'Finished', 'md', { rows: [['Title', 'Author', 'Rating'], ['Piranesi', 'S. Clarke', '★★★★★'], ['Project Hail Mary', 'A. Weir', '★★★★☆'], ['Circe', 'M. Miller', '★★★★☆']] }),
      w('checklist', 'Up next', 'md', { items: items(['The Overstory', false], ['Klara and the Sun', false]) }),
    ],
  },
  {
    id: 'trip',
    name: 'Trip planner',
    emoji: '✈️',
    category: 'Events',
    accent: 'aqua',
    description: 'Countdown, budget, packing and bookings.',
    widgets: [
      w('countdown', 'Lisbon trip', 'sm', { date: inDays(45) }),
      w('progress', 'Trip budget used', 'sm', { value: 1450, target: 2500, prefix: '€', style: 'ring' }),
      w('clock', 'Lisbon time', 'sm', { timeZone: 'Europe/Lisbon' }),
      w('links', 'Bookings', 'sm', { links: [{ label: 'Flights', url: 'https://example.com' }, { label: 'Hotel', url: 'https://example.com' }] }),
      w('checklist', 'Packing list', 'md', { items: items(['Passport', true], ['Adapters', false], ['Sunscreen', false], ['Walking shoes', true]) }),
      w('note', 'Ideas', 'md', { text: '- Tram 28 early morning\n- Day trip to Sintra\n- Pastéis de Belém' }),
    ],
  },
  {
    id: 'event',
    name: 'Event planner',
    emoji: '🎉',
    category: 'Events',
    accent: 'magenta',
    description: 'Guests, vendors, budget and to-dos.',
    widgets: [
      w('countdown', 'The big day', 'sm', { date: inDays(120) }),
      w('stat', 'RSVPs', 'sm', { value: 86, suffix: ' / 120' }),
      w('progress', 'Budget used', 'md', { value: 14200, target: 22000, prefix: '$', style: 'bar' }),
      w('donut', 'Budget split', 'md', { points: pts(['Venue', 'Food', 'Music', 'Decor', 'Other'], [8000, 6500, 2500, 1800, 3200]), prefix: '$' }),
      w('checklist', 'To-do', 'md', { items: items(['Book photographer', true], ['Send invitations', true], ['Cake tasting', false], ['Seating plan', false]) }),
      w('table', 'Vendors', 'full', { rows: [['Vendor', 'Contact', 'Status'], ['Rosewood Hall', 'Maria', 'Paid deposit'], ['Fig & Olive', 'Tom', 'Menu pending'], ['DJ Nova', 'Kai', 'Confirmed']] }),
    ],
  },
  {
    id: 'home',
    name: 'Home & household',
    emoji: '🏡',
    category: 'Personal',
    accent: 'green',
    description: 'Chores, bills and family notes in one place.',
    widgets: [
      w('checklist', 'Chores this week', 'md', { items: items(['Vacuum', true], ['Water plants', false], ['Laundry', false], ['Take out recycling', true]) }),
      w('countdown', 'Car service', 'sm', { date: inDays(12) }),
      w('stat', 'Energy bill', 'sm', { value: 84, prefix: '$', delta: -11, caption: 'vs last month' }),
      w('bar', 'Electricity (kWh)', 'md', { points: pts(months, [410, 380, 330, 290, 270, 300]) }),
      w('note', 'Family board', 'md', { text: '- Dentist Thursday 4pm\n- Grandma visits on the 20th' }),
    ],
  },
];

export function dashboardFromTemplate(t: Template | null, name?: string): Dashboard {
  const now = Date.now();
  return {
    id: uid(),
    name: name ?? t?.name ?? 'Untitled',
    emoji: t?.emoji ?? '✨',
    accent: t?.accent ?? 'blue',
    widgets: (t?.widgets ?? []).map((wd) => ({ ...structuredClone(wd), id: uid() })),
    createdAt: now,
    updatedAt: now,
    fromTemplate: t?.id,
  };
}

/**
 * Install a template as an independent copy (blueprint §8.4). Live templates also get their own
 * new data source; nothing is shared with the template or other installs. If the data server is
 * unreachable, the dashboard is still created with sample values so the user isn't blocked.
 */
export async function installTemplate(t: Template | null, name?: string): Promise<{ dashboard: Dashboard; offline: boolean }> {
  const dashboard = dashboardFromTemplate(t, name);
  if (!t?.source) return { dashboard, offline: false };
  try {
    const src = await api.createSource({
      name: t.source.name,
      kind: t.source.kind,
      config: t.source.kind === 'demo' ? { demo: t.source.demo } : { mode: 'append' },
      seedDemo: t.source.kind === 'webhook' ? t.source.demo : undefined,
    });
    dashboard.widgets = dashboard.widgets.map((wd) =>
      wd.binding?.sourceId === '$source' ? { ...wd, binding: { ...wd.binding, sourceId: src.id } } : wd,
    );
    return { dashboard, offline: false };
  } catch {
    dashboard.widgets = dashboard.widgets.map((wd) =>
      wd.binding ? { ...wd, binding: undefined, sample: true, data: { ...structuredClone(getDef(wd.type).data), ...wd.data } } : wd,
    );
    return { dashboard, offline: true };
  }
}
