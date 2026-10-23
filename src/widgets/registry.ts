import type { LucideIcon } from 'lucide-react';
import {
  ChartColumn,
  ChartPie,
  ChartSpline,
  CircleGauge,
  Clock,
  Hash,
  Heading,
  Hourglass,
  Image,
  Link2,
  ListChecks,
  CirclePlus,
  StickyNote,
  Table2,
} from 'lucide-react';
import type { WidgetSize, WidgetType } from '../types';

export type Field = (
  | { key: string; label: string; kind: 'text' | 'textarea' | 'date' | 'url'; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: 'number'; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: 'points' | 'items' | 'links' | 'csv' | 'numbers'; hint?: string }
) & {
  /** Hand-entered data that a connected source replaces; hidden while the widget is bound. */
  manual?: boolean;
};

export interface WidgetDef {
  type: WidgetType;
  name: string;
  description: string;
  group: 'Numbers' | 'Charts' | 'Tracking' | 'Content';
  icon: LucideIcon;
  size: WidgetSize;
  title: string;
  data: Record<string, any>;
  fields: Field[];
}

const prefixSuffix: Field[] = [
  { key: 'prefix', label: 'Before number', kind: 'text', placeholder: 'e.g. $' },
  { key: 'suffix', label: 'After number', kind: 'text', placeholder: 'e.g. kg, %' },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const WIDGETS: WidgetDef[] = [
  {
    type: 'stat',
    name: 'Number',
    description: 'One key figure with its change',
    group: 'Numbers',
    icon: Hash,
    size: 'sm',
    title: 'Revenue',
    data: { value: 12400, prefix: '$', suffix: '', delta: 8.2, caption: 'vs last month', trend: [8, 9, 9.5, 10, 11, 12.4] },
    fields: [
      { key: 'value', label: 'Value', kind: 'number', manual: true },
      ...prefixSuffix,
      { key: 'delta', label: 'Change (%)', kind: 'number', placeholder: 'Leave empty to hide', manual: true },
      { key: 'caption', label: 'Caption', kind: 'text', placeholder: 'vs last month' },
      { key: 'trend', label: 'Trend line', kind: 'numbers', hint: 'Comma-separated numbers, oldest first', manual: true },
    ],
  },
  {
    type: 'progress',
    name: 'Goal',
    description: 'Progress toward a target',
    group: 'Numbers',
    icon: CircleGauge,
    size: 'sm',
    title: 'Savings goal',
    data: { value: 6500, target: 10000, prefix: '$', suffix: '', style: 'ring' },
    fields: [
      { key: 'value', label: 'Current', kind: 'number', manual: true },
      { key: 'target', label: 'Target', kind: 'number' },
      ...prefixSuffix,
      { key: 'style', label: 'Style', kind: 'select', options: [{ value: 'ring', label: 'Ring' }, { value: 'bar', label: 'Bar' }] },
    ],
  },
  {
    type: 'counter',
    name: 'Counter',
    description: 'Tap to count anything',
    group: 'Tracking',
    icon: CirclePlus,
    size: 'sm',
    title: 'Glasses of water',
    data: { value: 3, step: 1, goal: 8, suffix: '' },
    fields: [
      { key: 'value', label: 'Current count', kind: 'number' },
      { key: 'step', label: 'Step per tap', kind: 'number' },
      { key: 'goal', label: 'Daily goal', kind: 'number', placeholder: 'Optional' },
      { key: 'suffix', label: 'Unit', kind: 'text', placeholder: 'e.g. cups' },
    ],
  },
  {
    type: 'line',
    name: 'Line chart',
    description: 'How something changes over time',
    group: 'Charts',
    icon: ChartSpline,
    size: 'md',
    title: 'Monthly visitors',
    data: { points: months.map((label, i) => ({ label, value: [820, 940, 910, 1180, 1320, 1510][i] })), prefix: '', suffix: '' },
    fields: [{ key: 'points', label: 'Data', kind: 'points', manual: true }, ...prefixSuffix],
  },
  {
    type: 'bar',
    name: 'Bar chart',
    description: 'Compare values side by side',
    group: 'Charts',
    icon: ChartColumn,
    size: 'md',
    title: 'Sales by month',
    data: { points: months.map((label, i) => ({ label, value: [32, 41, 38, 52, 47, 61][i] })), prefix: '', suffix: '' },
    fields: [{ key: 'points', label: 'Data', kind: 'points', manual: true }, ...prefixSuffix],
  },
  {
    type: 'donut',
    name: 'Breakdown',
    description: 'Parts of a whole',
    group: 'Charts',
    icon: ChartPie,
    size: 'md',
    title: 'Spending',
    data: {
      points: [
        { label: 'Housing', value: 1200 },
        { label: 'Food', value: 450 },
        { label: 'Transport', value: 180 },
        { label: 'Fun', value: 220 },
      ],
      prefix: '$',
      suffix: '',
    },
    fields: [{ key: 'points', label: 'Slices', kind: 'points', hint: 'Up to 6 slices read best', manual: true }, ...prefixSuffix],
  },
  {
    type: 'checklist',
    name: 'Checklist',
    description: 'To-dos, habits, packing lists',
    group: 'Tracking',
    icon: ListChecks,
    size: 'sm',
    title: 'Today',
    data: {
      items: [
        { id: 'a', text: 'Morning walk', done: true },
        { id: 'b', text: 'Read 20 pages', done: false },
        { id: 'c', text: 'Inbox zero', done: false },
      ],
    },
    fields: [{ key: 'items', label: 'Items', kind: 'items' }],
  },
  {
    type: 'table',
    name: 'Table',
    description: 'Rows and columns of anything',
    group: 'Content',
    icon: Table2,
    size: 'md',
    title: 'Top customers',
    data: {
      rows: [
        ['Name', 'Plan', 'MRR'],
        ['Acme Co', 'Pro', '$1,200'],
        ['Globex', 'Team', '$860'],
        ['Initech', 'Pro', '$640'],
      ],
    },
    fields: [{ key: 'rows', label: 'Data', kind: 'csv', hint: 'First line is the header. Paste from a spreadsheet works too.', manual: true }],
  },
  {
    type: 'note',
    name: 'Note',
    description: 'Free text, ideas, reminders',
    group: 'Content',
    icon: StickyNote,
    size: 'sm',
    title: 'Notes',
    data: { text: 'Write anything here.\n\n- Lines starting with a dash become bullets' },
    fields: [{ key: 'text', label: 'Text', kind: 'textarea' }],
  },
  {
    type: 'countdown',
    name: 'Countdown',
    description: 'Days until a date',
    group: 'Tracking',
    icon: Hourglass,
    size: 'sm',
    title: 'Launch day',
    data: { date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10) },
    fields: [{ key: 'date', label: 'Date', kind: 'date' }],
  },
  {
    type: 'clock',
    name: 'Clock',
    description: 'Time and date, any city',
    group: 'Content',
    icon: Clock,
    size: 'sm',
    title: 'Local time',
    data: { timeZone: '' },
    fields: [{ key: 'timeZone', label: 'Time zone', kind: 'text', placeholder: 'e.g. Europe/London — empty for local' }],
  },
  {
    type: 'links',
    name: 'Links',
    description: 'Shortcuts to sites and tools',
    group: 'Content',
    icon: Link2,
    size: 'sm',
    title: 'Quick links',
    data: { links: [{ label: 'Calendar', url: 'https://calendar.google.com' }, { label: 'Docs', url: 'https://docs.google.com' }] },
    fields: [{ key: 'links', label: 'Links', kind: 'links' }],
  },
  {
    type: 'image',
    name: 'Image',
    description: 'A photo, logo or mood board',
    group: 'Content',
    icon: Image,
    size: 'sm',
    title: 'Image',
    data: { url: '', caption: '' },
    fields: [
      { key: 'url', label: 'Image', kind: 'url', placeholder: 'Paste a link or upload below' },
      { key: 'caption', label: 'Caption', kind: 'text' },
    ],
  },
  {
    type: 'heading',
    name: 'Section',
    description: 'A heading to group widgets',
    group: 'Content',
    icon: Heading,
    size: 'full',
    title: 'New section',
    data: { subtitle: '' },
    fields: [{ key: 'subtitle', label: 'Subtitle', kind: 'text' }],
  },
];

export const getDef = (type: WidgetType) => WIDGETS.find((w) => w.type === type)!;

export const SIZES: { value: WidgetSize; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'full', label: 'Full' },
];
