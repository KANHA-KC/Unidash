import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Dashboard,
  DashboardWidget,
  DataSource,
  WidgetType,
  ViewMode,
  Breakpoint,
  WidgetProps,
  WidgetLayout,
} from '../types/dashboard';
import { curatedTemplates } from '../data/templates';
import { initialDataSources } from '../data/mockData';
import { simulateMetricFluctuation } from '../utils/csvParser';

interface DashboardContextType {
  dashboard: Dashboard;
  dashboardsList: Dashboard[];
  activeView: ViewMode;
  activeBreakpoint: Breakpoint;
  selectedWidgetId: string | null;
  isLiveSimulationActive: boolean;
  dataSources: DataSource[];
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  activeFilter: string | null;
  // Actions
  selectDashboard: (id: string) => void;
  updateDashboard: (newDash: Dashboard, recordHistory?: boolean) => void;
  createFromTemplate: (templateId: string) => void;
  createNewBlankDashboard: (name?: string) => void;
  deleteDashboard: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, props: Partial<WidgetProps>, layout?: Partial<WidgetLayout>) => void;
  duplicateWidget: (id: string) => void;
  moveWidget: (id: string, newX: number, newY: number) => void;
  resizeWidget: (id: string, newW: number, newH: number) => void;
  toggleHabitItem: (widgetId: string, itemId: string) => void;
  undo: () => void;
  redo: () => void;
  setActiveView: (view: ViewMode) => void;
  setActiveBreakpoint: (bp: Breakpoint) => void;
  setSelectedWidgetId: (id: string | null) => void;
  toggleLiveSimulation: () => void;
  addDataSource: (ds: DataSource) => void;
  setActiveFilter: (filter: string | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const STORAGE_KEY_ACTIVE = 'unidash_active_dashboard_v1';
const STORAGE_KEY_LIST = 'unidash_dashboards_list_v1';
const STORAGE_KEY_SOURCES = 'unidash_datasources_v1';

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with curated startup command center
  const defaultDashboard = curatedTemplates[0].dashboard;

  const [dashboardsList, setDashboardsList] = useState<Dashboard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIST);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved dashboards', e);
    }
    return curatedTemplates.map((t) => t.dashboard);
  });

  const [dashboard, setDashboard] = useState<Dashboard>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse active dashboard', e);
    }
    return defaultDashboard;
  });

  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOURCES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialDataSources;
  });

  const [activeView, setActiveView] = useState<ViewMode>('editor');
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isLiveSimulationActive, setIsLiveSimulationActive] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<Dashboard[]>([]);
  const [redoStack, setRedoStack] = useState<Dashboard[]>([]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(dashboard));
      setSaveStatus('saved');
    } catch (e) {
      console.error('Save failed', e);
    }
  }, [dashboard]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(dashboardsList));
    } catch (e) {}
  }, [dashboardsList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(dataSources));
    } catch (e) {}
  }, [dataSources]);

  // Push to history
  const recordHistory = useCallback(
    (current: Dashboard) => {
      setUndoStack((prev) => [...prev.slice(-25), JSON.parse(JSON.stringify(current))]);
      setRedoStack([]);
    },
    []
  );

  const updateDashboard = useCallback(
    (newDash: Dashboard, shouldRecordHistory = true) => {
      if (shouldRecordHistory) {
        recordHistory(dashboard);
      }
      setSaveStatus('saving');
      const updated = {
        ...newDash,
        updatedAt: new Date().toISOString(),
      };
      setDashboard(updated);
      setDashboardsList((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
    },
    [dashboard, recordHistory]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(dashboard))]);
    setUndoStack(newUndo);
    setDashboard(previous);
  }, [undoStack, dashboard]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(dashboard))]);
    setRedoStack(newRedo);
    setDashboard(next);
  }, [redoStack, dashboard]);

  const selectDashboard = useCallback(
    (id: string) => {
      const found = dashboardsList.find((d) => d.id === id);
      if (found) {
        recordHistory(dashboard);
        setDashboard(found);
        setSelectedWidgetId(null);
        setActiveView('editor');
      }
    },
    [dashboardsList, dashboard, recordHistory]
  );

  const createFromTemplate = useCallback(
    (templateId: string) => {
      const tmpl = curatedTemplates.find((t) => t.id === templateId);
      if (!tmpl) return;

      const newId = `dash-${Date.now()}`;
      const newDash: Dashboard = {
        ...JSON.parse(JSON.stringify(tmpl.dashboard)),
        id: newId,
        name: `${tmpl.name} (Copy)`,
        slug: `${tmpl.dashboard.slug}-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDashboardsList((prev) => [newDash, ...prev]);
      setDashboard(newDash);
      setSelectedWidgetId(null);
      setActiveView('editor');
    },
    []
  );

  const createNewBlankDashboard = useCallback((name = 'Untitled Workspace') => {
    const newId = `dash-${Date.now()}`;
    const newDash: Dashboard = {
      id: newId,
      name,
      description: 'Custom created dashboard workspace',
      category: 'custom',
      visibility: 'private',
      slug: `workspace-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      theme: {
        id: 'theme-default-blue',
        name: 'Obsidian Blue',
        mode: 'dark',
        accentColor: '#0A84FF',
        glassBlur: 28,
        borderRadius: 18,
      },
      activePageId: 'page-1',
      pages: [
        {
          id: 'page-1',
          title: 'Overview',
          components: [],
        },
      ],
    };
    setDashboardsList((prev) => [newDash, ...prev]);
    setDashboard(newDash);
    setSelectedWidgetId(null);
    setActiveView('editor');
  }, []);

  const deleteDashboard = useCallback(
    (id: string) => {
      setDashboardsList((prev) => {
        const remaining = prev.filter((d) => d.id !== id);
        if (remaining.length > 0 && dashboard.id === id) {
          setDashboard(remaining[0]);
        }
        return remaining;
      });
    },
    [dashboard.id]
  );

  const addWidget = useCallback(
    (type: WidgetType) => {
      const activePage = dashboard.pages.find((p) => p.id === dashboard.activePageId) || dashboard.pages[0];
      const maxY = activePage.components.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);

      let initialProps: WidgetProps;
      let initialLayout: WidgetLayout;

      switch (type) {
        case 'metric':
          initialLayout = { x: 0, y: maxY, w: 4, h: 2 };
          initialProps = {
            title: 'New Metric Indicator',
            subtitle: 'Real-time telemetry value',
            value: 12450,
            prefix: '$',
            change: 8.5,
            changePeriod: 'vs prior period',
            accentColor: dashboard.theme.accentColor,
          };
          break;
        case 'area-chart':
          initialLayout = { x: 0, y: maxY, w: 8, h: 4 };
          initialProps = {
            title: 'Metric Velocity Sparkline',
            subtitle: 'Dynamic area volume',
            accentColor: dashboard.theme.accentColor,
            chartData: [
              { label: 'W1', value: 340, secondary: 220 },
              { label: 'W2', value: 420, secondary: 280 },
              { label: 'W3', value: 510, secondary: 340 },
              { label: 'W4', value: 480, secondary: 310 },
              { label: 'W5', value: 620, secondary: 410 },
            ],
          };
          break;
        case 'bar-chart':
          initialLayout = { x: 0, y: maxY, w: 6, h: 4 };
          initialProps = {
            title: 'Comparative Breakdown',
            subtitle: 'Category distribution',
            accentColor: dashboard.theme.accentColor,
            chartData: [
              { label: 'Tier A', value: 68 },
              { label: 'Tier B', value: 42 },
              { label: 'Tier C', value: 89 },
              { label: 'Tier D', value: 55 },
            ],
          };
          break;
        case 'donut-chart':
          initialLayout = { x: 0, y: maxY, w: 4, h: 3 };
          initialProps = {
            title: 'Portfolio Share',
            subtitle: 'Ratio segmentation',
            accentColor: dashboard.theme.accentColor,
            chartData: [
              { label: 'Primary', value: 45 },
              { label: 'Secondary', value: 30 },
              { label: 'Other', value: 25 },
            ],
          };
          break;
        case 'table':
          initialLayout = { x: 0, y: maxY, w: 12, h: 4 };
          initialProps = {
            title: 'Live Data Records',
            subtitle: 'Multi-column dataset view',
            columns: [
              { key: 'item', label: 'Item Name' },
              { key: 'category', label: 'Category' },
              { key: 'amount', label: 'Amount', type: 'number' },
              { key: 'status', label: 'Status', type: 'status' },
            ],
            rows: [
              { item: 'Vector Cloud Cluster', category: 'Infrastructure', amount: '$4,200', status: 'Healthy' },
              { item: 'Edge Cache Node 04', category: 'CDN', amount: '$1,800', status: 'Healthy' },
              { item: 'Auth Gateway Replica', category: 'Security', amount: '$2,400', status: 'Reviewing' },
            ],
          };
          break;
        case 'habits':
          initialLayout = { x: 0, y: maxY, w: 6, h: 4 };
          initialProps = {
            title: 'Protocol & Daily Rhythm',
            subtitle: 'Interactive completion tracking',
            accentColor: dashboard.theme.accentColor,
            items: [
              { id: '1', label: 'Review core business KPIs', done: true, streak: 8 },
              { id: '2', label: 'Customer interview sprint', done: false, streak: 3 },
              { id: '3', label: 'Zero inbox & communications', done: false, streak: 15 },
            ],
          };
          break;
        case 'gauge':
          initialLayout = { x: 0, y: maxY, w: 4, h: 2 };
          initialProps = {
            title: 'Target Completion Rate',
            subtitle: 'Current pacing vs monthly quota',
            gaugeValue: 88,
            gaugeMin: 0,
            gaugeMax: 100,
            gaugeTarget: 80,
            accentColor: dashboard.theme.accentColor,
          };
          break;
        case 'status-feed':
          initialLayout = { x: 0, y: maxY, w: 6, h: 4 };
          initialProps = {
            title: 'Operational Event Feed',
            subtitle: 'Live automated activity log',
            events: [
              { id: 'e1', timestamp: '1m ago', message: 'System auto-rebalance successfully verified', level: 'info' },
              { id: 'e2', timestamp: '5m ago', message: 'API batch ingestion request finished', level: 'success' },
            ],
          };
          break;
        case 'note':
        default:
          initialLayout = { x: 0, y: maxY, w: 6, h: 3 };
          initialProps = {
            title: 'Executive Notes',
            subtitle: 'Markdown supported memo',
            content: 'Document key priorities, meeting takeaways, or system architecture notes here.',
          };
          break;
      }

      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        type,
        layout: initialLayout,
        props: initialProps,
      };

      recordHistory(dashboard);

      const updatedDashboard = {
        ...dashboard,
        pages: dashboard.pages.map((p) =>
          p.id === activePage.id
            ? { ...p, components: [...p.components, newWidget] }
            : p
        ),
      };

      updateDashboard(updatedDashboard, false);
      setSelectedWidgetId(newWidget.id);
    },
    [dashboard, recordHistory, updateDashboard]
  );

  const removeWidget = useCallback(
    (id: string) => {
      recordHistory(dashboard);
      const updated = {
        ...dashboard,
        pages: dashboard.pages.map((p) => ({
          ...p,
          components: p.components.filter((c) => c.id !== id),
        })),
      };
      updateDashboard(updated, false);
      if (selectedWidgetId === id) setSelectedWidgetId(null);
    },
    [dashboard, recordHistory, selectedWidgetId, updateDashboard]
  );

  const duplicateWidget = useCallback(
    (id: string) => {
      const activePage = dashboard.pages.find((p) => p.id === dashboard.activePageId) || dashboard.pages[0];
      const target = activePage.components.find((c) => c.id === id);
      if (!target) return;

      recordHistory(dashboard);
      const duplicate: DashboardWidget = {
        ...JSON.parse(JSON.stringify(target)),
        id: `widget-${Date.now()}`,
        layout: {
          ...target.layout,
          y: target.layout.y + target.layout.h,
        },
      };

      const updated = {
        ...dashboard,
        pages: dashboard.pages.map((p) =>
          p.id === activePage.id ? { ...p, components: [...p.components, duplicate] } : p
        ),
      };
      updateDashboard(updated, false);
      setSelectedWidgetId(duplicate.id);
    },
    [dashboard, recordHistory, updateDashboard]
  );

  const updateWidget = useCallback(
    (id: string, props: Partial<WidgetProps>, layout?: Partial<WidgetLayout>) => {
      const updated = {
        ...dashboard,
        pages: dashboard.pages.map((p) => ({
          ...p,
          components: p.components.map((c) => {
            if (c.id !== id) return c;
            return {
              ...c,
              props: { ...c.props, ...props },
              layout: layout ? { ...c.layout, ...layout } : c.layout,
            };
          }),
        })),
      };
      updateDashboard(updated, false);
    },
    [dashboard, updateDashboard]
  );

  const moveWidget = useCallback(
    (id: string, newX: number, newY: number) => {
      updateWidget(id, {}, { x: Math.max(0, Math.min(11, newX)), y: Math.max(0, newY) });
    },
    [updateWidget]
  );

  const resizeWidget = useCallback(
    (id: string, newW: number, newH: number) => {
      updateWidget(id, {}, { w: Math.max(2, Math.min(12, newW)), h: Math.max(2, Math.min(10, newH)) });
    },
    [updateWidget]
  );

  const toggleHabitItem = useCallback(
    (widgetId: string, itemId: string) => {
      const activePage = dashboard.pages.find((p) => p.id === dashboard.activePageId) || dashboard.pages[0];
      const widget = activePage.components.find((c) => c.id === widgetId);
      if (!widget || !widget.props.items) return;

      const updatedItems = widget.props.items.map((item) => {
        if (item.id === itemId) {
          const nextDone = !item.done;
          return {
            ...item,
            done: nextDone,
            streak: nextDone ? (item.streak || 0) + 1 : Math.max(0, (item.streak || 1) - 1),
          };
        }
        return item;
      });

      updateWidget(widgetId, { items: updatedItems });
    },
    [dashboard, updateWidget]
  );

  const toggleLiveSimulation = useCallback(() => {
    setIsLiveSimulationActive((prev) => !prev);
  }, []);

  const addDataSource = useCallback((ds: DataSource) => {
    setDataSources((prev) => [ds, ...prev]);
  }, []);

  // Periodic simulated live ticker (fluctuates metrics gently to demonstrate "Living Result" in PRD)
  useEffect(() => {
    if (!isLiveSimulationActive) return;

    const interval = setInterval(() => {
      setDashboard((prevDash) => {
        let changed = false;
        const newPages = prevDash.pages.map((page) => ({
          ...page,
          components: page.components.map((comp) => {
            if (comp.type === 'metric' && typeof comp.props.value === 'number') {
              const updatedVal = simulateMetricFluctuation(comp.props.value);
              if (updatedVal !== comp.props.value) {
                changed = true;
                return {
                  ...comp,
                  props: { ...comp.props, value: updatedVal },
                };
              }
            }
            return comp;
          }),
        }));

        if (!changed) return prevDash;
        return {
          ...prevDash,
          pages: newPages,
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveSimulationActive]);

  return (
    <DashboardContext.Provider
      value={{
        dashboard,
        dashboardsList,
        activeView,
        activeBreakpoint,
        selectedWidgetId,
        isLiveSimulationActive,
        dataSources,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        saveStatus,
        activeFilter,
        selectDashboard,
        updateDashboard,
        createFromTemplate,
        createNewBlankDashboard,
        deleteDashboard,
        addWidget,
        removeWidget,
        updateWidget,
        duplicateWidget,
        moveWidget,
        resizeWidget,
        toggleHabitItem,
        undo,
        redo,
        setActiveView,
        setActiveBreakpoint,
        setSelectedWidgetId,
        toggleLiveSimulation,
        addDataSource,
        setActiveFilter,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
