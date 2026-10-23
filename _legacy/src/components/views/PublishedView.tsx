import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetWrapper } from '../canvas/WidgetWrapper';
import { Edit3, Monitor, Tablet, Smartphone, ShieldCheck, Share2 } from 'lucide-react';

interface PublishedViewProps {
  onOpenPublishModal: () => void;
}

export const PublishedView: React.FC<PublishedViewProps> = ({ onOpenPublishModal }) => {
  const {
    dashboard,
    setActiveView,
    activeBreakpoint,
    setActiveBreakpoint,
    isLiveSimulationActive,
  } = useDashboard();

  const activePage =
    dashboard.pages.find((p) => p.id === dashboard.activePageId) || dashboard.pages[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Floating Top Presentation Capsule */}
      <header
        style={{
          position: 'sticky',
          top: 14,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 20px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="apple-glass"
          style={{
            pointerEvents: 'auto',
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Status & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-status-pill">
              <span className="pulse-dot" />
              Live Published
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {dashboard.name}
            </span>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: 'var(--glass-border)' }} />

          {/* Breakpoint Switcher */}
          <div className="apple-segmented-control" style={{ padding: 2 }}>
            <button
              onClick={() => setActiveBreakpoint('desktop')}
              className={`apple-segmented-item ${activeBreakpoint === 'desktop' ? 'active' : ''}`}
              style={{ padding: '4px 8px' }}
              title="Desktop"
            >
              <Monitor size={12} />
            </button>
            <button
              onClick={() => setActiveBreakpoint('tablet')}
              className={`apple-segmented-item ${activeBreakpoint === 'tablet' ? 'active' : ''}`}
              style={{ padding: '4px 8px' }}
              title="Tablet"
            >
              <Tablet size={12} />
            </button>
            <button
              onClick={() => setActiveBreakpoint('mobile')}
              className={`apple-segmented-item ${activeBreakpoint === 'mobile' ? 'active' : ''}`}
              style={{ padding: '4px 8px' }}
              title="Mobile"
            >
              <Smartphone size={12} />
            </button>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: 'var(--glass-border)' }} />

          {/* Share & Edit actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onOpenPublishModal}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '11.5px' }}
            >
              <Share2 size={12} />
              Share
            </button>
            <button
              onClick={() => setActiveView('editor')}
              className="btn-primary"
              style={{ padding: '5px 14px', fontSize: '11.5px' }}
            >
              <Edit3 size={12} />
              Open Studio
            </button>
          </div>
        </div>
      </header>

      {/* Published View Canvas */}
      <main
        style={{
          flex: 1,
          padding: '40px 24px 80px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '1400px', marginBottom: 20 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: 4 }}>
            {activePage?.title || dashboard.name}
          </h1>
          {dashboard.description && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {dashboard.description}
            </p>
          )}
        </div>

        <div className={`dashboard-grid breakpoint-${activeBreakpoint}`}>
          {activePage?.components.map((comp) => (
            <WidgetWrapper key={comp.id} widget={comp} mode="published" />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        Powered by Unidash Universal Studio • Published via Secure SSL Edge
      </footer>
    </div>
  );
};
