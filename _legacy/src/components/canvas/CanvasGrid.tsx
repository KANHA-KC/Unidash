import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetWrapper } from './WidgetWrapper';
import { Plus, Sparkles, Layout } from 'lucide-react';

export const CanvasGrid: React.FC = () => {
  const {
    dashboard,
    activeBreakpoint,
    activeView,
    setSelectedWidgetId,
    addWidget,
  } = useDashboard();

  const activePage =
    dashboard.pages.find((p) => p.id === dashboard.activePageId) || dashboard.pages[0];

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect if clicking canvas background
    if (e.target === e.currentTarget) {
      setSelectedWidgetId(null);
    }
  };

  return (
    <div
      className="canvas-area"
      onClick={handleCanvasClick}
      style={{
        paddingTop: activeBreakpoint === 'mobile' ? 16 : 24,
      }}
    >
      {/* Page Title & Breadcrumb header on canvas */}
      <div
        style={{
          width: '100%',
          maxWidth:
            activeBreakpoint === 'tablet'
              ? '900px'
              : activeBreakpoint === 'mobile'
              ? '440px'
              : '1400px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {activePage?.title || 'Dashboard'}
          </h2>
          {dashboard.description && (
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {dashboard.description}
            </p>
          )}
        </div>

        {activeView === 'editor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => addWidget('metric')}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={13} />
              Add Widget
            </button>
          </div>
        )}
      </div>

      {/* Grid of Components */}
      {activePage?.components.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: 'var(--glass-surface)',
            border: '1px dashed var(--glass-border)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '600px',
            margin: '40px auto',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(10, 132, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              color: 'var(--apple-blue)',
            }}
          >
            <Layout size={26} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: 6 }}>
            Blank Workspace
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', marginBottom: 20 }}>
            Start building your dashboard by selecting a widget from the palette or asking Apple Intelligence to compose one.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => addWidget('metric')}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              <Plus size={14} />
              Add Metric Card
            </button>
            <button
              onClick={() => addWidget('area-chart')}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Add Trend Chart
            </button>
          </div>
        </div>
      ) : (
        <div className={`dashboard-grid breakpoint-${activeBreakpoint}`}>
          {activePage?.components.map((comp) => (
            <WidgetWrapper key={comp.id} widget={comp} mode={activeView} />
          ))}
        </div>
      )}
    </div>
  );
};
