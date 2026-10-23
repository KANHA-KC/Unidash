import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetType } from '../../types/dashboard';
import { curatedTemplates } from '../../data/templates';
import {
  LayoutGrid,
  Sparkles,
  Database,
  Layers,
  TrendingUp,
  BarChart2,
  PieChart,
  Table as TableIcon,
  CheckSquare,
  Activity,
  FileText,
  Gauge,
  Plus,
  Wifi,
  FileSpreadsheet,
} from 'lucide-react';

interface LeftSidebarProps {
  onOpenTemplatesModal: () => void;
  onOpenDataSourceModal: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onOpenTemplatesModal,
  onOpenDataSourceModal,
}) => {
  const { addWidget, createFromTemplate, dataSources, dashboard } = useDashboard();
  const [activeTab, setActiveTab] = useState<'widgets' | 'templates' | 'sources'>('widgets');

  const widgetCatalog: Array<{
    type: WidgetType;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'metric',
      label: 'Metric KPI',
      desc: 'High-signal stat with change %',
      icon: <TrendingUp size={16} color="var(--apple-blue)" />,
    },
    {
      type: 'area-chart',
      label: 'Area Trend',
      desc: 'Smooth volume trajectory line',
      icon: <Activity size={16} color="#64D2FF" />,
    },
    {
      type: 'bar-chart',
      label: 'Bar Chart',
      desc: 'Comparative column breakdown',
      icon: <BarChart2 size={16} color="#5E5CE6" />,
    },
    {
      type: 'donut-chart',
      label: 'Donut Ring',
      desc: 'Apple Activity style proportions',
      icon: <PieChart size={16} color="#30D158" />,
    },
    {
      type: 'table',
      label: 'Data Table',
      desc: 'Multi-column records with status',
      icon: <TableIcon size={16} color="#FF9F0A" />,
    },
    {
      type: 'habits',
      label: 'Habits & Checklist',
      desc: 'Daily rhythm and streak rings',
      icon: <CheckSquare size={16} color="#FF375F" />,
    },
    {
      type: 'gauge',
      label: 'Radial Gauge',
      desc: 'Circular SLA or goal progress',
      icon: <Gauge size={16} color="#30D158" />,
    },
    {
      type: 'status-feed',
      label: 'Status Feed',
      desc: 'Streaming event & audit log',
      icon: <Layers size={16} color="#BF5AF2" />,
    },
    {
      type: 'note',
      label: 'Executive Note',
      desc: 'Formatted memo & priorities',
      icon: <FileText size={16} color="var(--text-secondary)" />,
    },
  ];

  return (
    <div className="left-sidebar">
      {/* Top Segmented Tab Switcher */}
      <div style={{ padding: '14px 14px 10px 14px' }}>
        <div className="apple-segmented-control" style={{ width: '100%' }}>
          <button
            onClick={() => setActiveTab('widgets')}
            className={`apple-segmented-item ${activeTab === 'widgets' ? 'active' : ''}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <LayoutGrid size={11} />
            Widgets
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`apple-segmented-item ${activeTab === 'templates' ? 'active' : ''}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Sparkles size={11} />
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`apple-segmented-item ${activeTab === 'sources' ? 'active' : ''}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Database size={11} />
            Data
          </button>
        </div>
      </div>

      {/* TAB 1: WIDGETS PALETTE */}
      {activeTab === 'widgets' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px 12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', padding: '6px 4px 10px 4px' }}>
            CLICK TO INSERT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {widgetCatalog.map((item) => (
              <div
                key={item.type}
                onClick={() => addWidget(item.type)}
                className="apple-clickable"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-tertiary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
                <Plus size={13} color="var(--text-tertiary)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES DRAWER */}
      {activeTab === 'templates' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 10px 4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>
              FEATURED STARTERS
            </span>
            <button
              onClick={onOpenTemplatesModal}
              style={{ fontSize: '11px', color: 'var(--apple-blue)', fontWeight: 600 }}
            >
              See all
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {curatedTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => createFromTemplate(t.id)}
                className="apple-clickable"
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                  borderLeft: `3px solid ${t.previewColor}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginTop: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {t.tagline}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  <span>{t.widgetCount} widgets</span>
                  <span>★ {t.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DATA SOURCES */}
      {activeTab === 'sources' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 10px 4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>
              ACTIVE CONNECTORS
            </span>
            <button
              onClick={onOpenDataSourceModal}
              className="apple-clickable"
              style={{ color: 'var(--apple-blue)', fontSize: '11px', fontWeight: 600 }}
            >
              + Connect
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dataSources.map((ds) => (
              <div
                key={ds.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {ds.type === 'realtime' ? (
                      <Wifi size={13} color="#30D158" />
                    ) : ds.type === 'csv' ? (
                      <FileSpreadsheet size={13} color="#FF9F0A" />
                    ) : (
                      <Activity size={13} color="var(--apple-blue)" />
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ds.name}
                    </span>
                  </div>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#30D158',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span style={{ textTransform: 'uppercase' }}>{ds.type}</span>
                  <span>Sync: {ds.lastSync}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={onOpenDataSourceModal}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
            >
              <Plus size={13} />
              Add CSV or REST Source
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
