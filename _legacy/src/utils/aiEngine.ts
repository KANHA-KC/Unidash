import { Dashboard, DashboardWidget, WidgetType } from '../types/dashboard';

export interface AICommandResult {
  success: boolean;
  message: string;
  updatedDashboard?: Dashboard;
  suggestedAction?: string;
}

export function executeAICommand(prompt: string, currentDashboard: Dashboard): AICommandResult {
  const p = prompt.toLowerCase().trim();

  // Clone dashboard to remain purely immutable
  const updated: Dashboard = JSON.parse(JSON.stringify(currentDashboard));
  const activePage = updated.pages.find((page) => page.id === updated.activePageId) || updated.pages[0];

  // 1. Accent color / Theme changes
  if (p.includes('cyber mint') || p.includes('green') || p.includes('mint')) {
    updated.theme.accentColor = '#30D158';
    updated.theme.name = 'Cyber Mint';
    return {
      success: true,
      message: 'Applied Cyber Mint accent theme across all widgets and controls.',
      updatedDashboard: updated,
    };
  }

  if (p.includes('purple') || p.includes('royal')) {
    updated.theme.accentColor = '#BF5AF2';
    updated.theme.name = 'Royal Purple';
    return {
      success: true,
      message: 'Applied Royal Purple Cupertino theme.',
      updatedDashboard: updated,
    };
  }

  if (p.includes('sunset') || p.includes('rose') || p.includes('pink')) {
    updated.theme.accentColor = '#FF375F';
    updated.theme.name = 'Sunset Rose';
    return {
      success: true,
      message: 'Applied Sunset Rose palette.',
      updatedDashboard: updated,
    };
  }

  if (p.includes('light mode') || p.includes('light theme')) {
    updated.theme.mode = 'light';
    return {
      success: true,
      message: 'Switched workspace to Cupertino Light glass mode.',
      updatedDashboard: updated,
    };
  }

  if (p.includes('dark mode') || p.includes('dark theme')) {
    updated.theme.mode = 'dark';
    return {
      success: true,
      message: 'Switched workspace to Obsidian Dark glass mode.',
      updatedDashboard: updated,
    };
  }

  // 2. Add Chart / Component
  if (p.includes('chart') || p.includes('breakdown') || p.includes('trend')) {
    const maxY = activePage.components.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);
    const newWidget: DashboardWidget = {
      id: `widget-ai-${Date.now()}`,
      type: p.includes('bar') ? 'bar-chart' : p.includes('donut') ? 'donut-chart' : 'area-chart',
      layout: { x: 0, y: maxY, w: 6, h: 4 },
      props: {
        title: p.includes('revenue') ? 'Revenue by Region' : 'AI Inferred Metric Breakdown',
        subtitle: 'Generated via Apple Intelligence pipeline',
        accentColor: updated.theme.accentColor,
        chartData: [
          { label: 'North America', value: 45000 },
          { label: 'Europe', value: 32000 },
          { label: 'Asia Pacific', value: 24000 },
          { label: 'Latin America', value: 11000 },
        ],
      },
    };
    activePage.components.push(newWidget);
    return {
      success: true,
      message: `Created a new ${newWidget.type} with regional metrics.`,
      updatedDashboard: updated,
    };
  }

  // 3. Add Metric / Stat card
  if (p.includes('metric') || p.includes('stat') || p.includes('kpi') || p.includes('mrr') || p.includes('revenue')) {
    const maxY = activePage.components.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);
    const newWidget: DashboardWidget = {
      id: `widget-ai-${Date.now()}`,
      type: 'metric',
      layout: { x: 0, y: maxY, w: 4, h: 2 },
      props: {
        title: 'Customer Lifetime Value (LTV)',
        subtitle: 'Cohort weighted average',
        value: 4850,
        prefix: '$',
        change: 18.4,
        changePeriod: 'vs Q2 baseline',
        accentColor: updated.theme.accentColor,
      },
    };
    activePage.components.push(newWidget);
    return {
      success: true,
      message: 'Added Customer Lifetime Value (LTV) metric card.',
      updatedDashboard: updated,
    };
  }

  // 4. Add Notice / Note or Alert
  if (p.includes('alert') || p.includes('note') || p.includes('banner')) {
    const maxY = activePage.components.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);
    const newWidget: DashboardWidget = {
      id: `widget-ai-${Date.now()}`,
      type: 'note',
      layout: { x: 0, y: maxY, w: 12, h: 2 },
      props: {
        title: 'System Alert Notice',
        subtitle: 'Posted by SRE Automation',
        content: 'Scheduled database indexing and read-replica switchover will occur Sunday at 02:00 UTC. Zero downtime anticipated.',
      },
    };
    activePage.components.push(newWidget);
    return {
      success: true,
      message: 'Appended system announcement banner to dashboard.',
      updatedDashboard: updated,
    };
  }

  // 5. General prompt to generate a tailored dashboard
  if (p.includes('fitness') || p.includes('health') || p.includes('workout')) {
    updated.name = 'Apple Fitness & Vitals OS';
    updated.theme.accentColor = '#FF375F';
    activePage.components = [
      {
        id: 'w-cals',
        type: 'metric',
        layout: { x: 0, y: 0, w: 4, h: 2 },
        props: {
          title: 'Active Calories',
          subtitle: 'Daily target: 750 kcal',
          value: 620,
          suffix: ' kcal',
          change: 8.5,
          accentColor: '#FF375F',
        },
      },
      {
        id: 'w-hrv',
        type: 'gauge',
        layout: { x: 4, y: 0, w: 4, h: 2 },
        props: {
          title: 'Heart Rate Variability',
          subtitle: 'Recovery readiness',
          gaugeValue: 74,
          gaugeMin: 20,
          gaugeMax: 100,
          accentColor: '#30D158',
        },
      },
      {
        id: 'w-water',
        type: 'metric',
        layout: { x: 8, y: 0, w: 4, h: 2 },
        props: {
          title: 'Hydration Intake',
          subtitle: '3.0L goal',
          value: '2.4',
          suffix: ' L',
          change: 14.0,
          accentColor: '#64D2FF',
        },
      },
      {
        id: 'w-fitness-trend',
        type: 'area-chart',
        layout: { x: 0, y: 2, w: 8, h: 4 },
        props: {
          title: 'Weekly Caloric Expenditure & Heart Zones',
          subtitle: 'Zones 2, 3, and 4 minutes',
          accentColor: '#FF375F',
          chartData: [
            { label: 'Mon', value: 680, secondary: 520 },
            { label: 'Tue', value: 740, secondary: 590 },
            { label: 'Wed', value: 590, secondary: 480 },
            { label: 'Thu', value: 810, secondary: 650 },
            { label: 'Fri', value: 620, secondary: 500 },
          ],
        },
      },
      {
        id: 'w-workout-habits',
        type: 'habits',
        layout: { x: 8, y: 2, w: 4, h: 4 },
        props: {
          title: 'Daily Fitness Protocol',
          subtitle: 'Tap to check off',
          accentColor: '#FF375F',
          items: [
            { id: 'f1', label: 'Morning Mobility & Foam Roll', done: true, streak: 14 },
            { id: 'f2', label: 'Electrolytes & Cold Water', done: true, streak: 21 },
            { id: 'f3', label: 'Zone 2 Cardio (45 min)', done: true, streak: 5 },
            { id: 'f4', label: '10,000 Steps Goal', done: false, streak: 12 },
          ],
        },
      },
    ];
    return {
      success: true,
      message: 'Generated personalized Apple Fitness & Vitals dashboard.',
      updatedDashboard: updated,
    };
  }

  // Default fallback: smart inference
  const maxY = activePage.components.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);
  const newWidget: DashboardWidget = {
    id: `widget-ai-${Date.now()}`,
    type: 'metric',
    layout: { x: 0, y: maxY, w: 4, h: 2 },
    props: {
      title: prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt,
      subtitle: 'AI Synthesized Workspace Widget',
      value: 12480,
      prefix: '$',
      change: 9.4,
      accentColor: updated.theme.accentColor,
    },
  };
  activePage.components.push(newWidget);

  return {
    success: true,
    message: `Generated custom widget based on: "${prompt}".`,
    updatedDashboard: updated,
  };
}
