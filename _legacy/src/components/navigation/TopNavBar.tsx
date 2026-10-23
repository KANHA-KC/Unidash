import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  Share2,
  Eye,
  Edit3,
  Home,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface TopNavBarProps {
  onOpenPublishModal: () => void;
  onOpenTemplatesModal: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onOpenPublishModal, onOpenTemplatesModal }) => {
  const {
    dashboard,
    updateDashboard,
    activeBreakpoint,
    setActiveBreakpoint,
    activeView,
    setActiveView,
    canUndo,
    canRedo,
    undo,
    redo,
    isLiveSimulationActive,
    toggleLiveSimulation,
    saveStatus,
  } = useDashboard();

  return (
    <header className="top-nav">
      {/* Left section: macOS Traffic lights & Brand/Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="traffic-lights">
          <div className="traffic-light red" />
          <div className="traffic-light yellow" />
          <div className="traffic-light green" />
        </div>

        {/* Home Button */}
        <button
          onClick={() => setActiveView(activeView === 'home' ? 'editor' : 'home')}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '12px' }}
          title="Return to Home Discovery Gallery"
        >
          <Home size={13} />
          {activeView === 'home' ? 'Studio' : 'Home'}
        </button>

        {/* Editable Dashboard Title */}
        <div className="dashboard-title-pill">
          <input
            type="text"
            className="dashboard-title-input"
            value={dashboard.name}
            onChange={(e) => updateDashboard({ ...dashboard, name: e.target.value })}
            title="Click to rename dashboard"
          />
        </div>

        {/* Save Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <CheckCircle2 size={12} color="#30D158" />
          <span>{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
        </div>
      </div>

      {/* Middle section: Responsive Device Switcher + Undo/Redo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="apple-clickable"
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              color: canUndo ? 'var(--text-primary)' : 'var(--text-quaternary)',
              cursor: canUndo ? 'pointer' : 'default',
            }}
            title="Undo (⌘Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="apple-clickable"
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              color: canRedo ? 'var(--text-primary)' : 'var(--text-quaternary)',
              cursor: canRedo ? 'pointer' : 'default',
            }}
            title="Redo (⇧⌘Z)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Responsive Breakpoint Segmented Control */}
        <div className="apple-segmented-control">
          <button
            onClick={() => setActiveBreakpoint('desktop')}
            className={`apple-segmented-item ${activeBreakpoint === 'desktop' ? 'active' : ''}`}
            title="Desktop 12-Column Grid"
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={() => setActiveBreakpoint('tablet')}
            className={`apple-segmented-item ${activeBreakpoint === 'tablet' ? 'active' : ''}`}
            title="Tablet 8-Column Grid"
          >
            <Tablet size={13} />
          </button>
          <button
            onClick={() => setActiveBreakpoint('mobile')}
            className={`apple-segmented-item ${activeBreakpoint === 'mobile' ? 'active' : ''}`}
            title="Mobile Single Column"
          >
            <Smartphone size={13} />
          </button>
        </div>

        {/* Live Simulation Pulse Toggle */}
        <button
          onClick={toggleLiveSimulation}
          className="apple-clickable"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 'var(--radius-pill)',
            background: isLiveSimulationActive ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isLiveSimulationActive ? 'rgba(48, 209, 88, 0.35)' : 'var(--glass-border)'}`,
            fontSize: '11px',
            fontWeight: 600,
            color: isLiveSimulationActive ? '#30D158' : 'var(--text-tertiary)',
          }}
          title="Toggle live telemetry simulation"
        >
          {isLiveSimulationActive ? <span className="pulse-dot" /> : <Zap size={11} />}
          <span>{isLiveSimulationActive ? 'Live Polling' : 'Paused'}</span>
        </button>
      </div>

      {/* Right section: View Mode & Publish */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Toggle Editor vs Preview */}
        <button
          onClick={() => setActiveView(activeView === 'editor' ? 'published' : 'editor')}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          {activeView === 'editor' ? (
            <>
              <Eye size={13} />
              Preview
            </>
          ) : (
            <>
              <Edit3 size={13} />
              Edit Studio
            </>
          )}
        </button>

        {/* Publish Action Button */}
        <button
          onClick={onOpenPublishModal}
          className="btn-primary"
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          <Share2 size={13} />
          Publish & Share
        </button>
      </div>
    </header>
  );
};
