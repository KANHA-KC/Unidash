import React from 'react';
import { DashboardWidget, ViewMode } from '../../types/dashboard';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { useDashboard } from '../../context/DashboardContext';
import { Trash2, Copy, Sliders, Maximize2, Minimize2 } from 'lucide-react';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  mode: ViewMode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ widget, mode }) => {
  const {
    selectedWidgetId,
    setSelectedWidgetId,
    removeWidget,
    duplicateWidget,
    resizeWidget,
    activeBreakpoint,
  } = useDashboard();

  const isSelected = mode === 'editor' && selectedWidgetId === widget.id;

  // Responsive column spans
  let colSpan = widget.layout.w;
  if (activeBreakpoint === 'tablet') {
    colSpan = Math.min(12, Math.max(6, widget.layout.w));
  } else if (activeBreakpoint === 'mobile') {
    colSpan = 12;
  }

  const minHeight = Math.max(140, widget.layout.h * 65);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'editor') {
      setSelectedWidgetId(widget.id);
    }
  };

  const handleIncreaseWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeWidget(widget.id, Math.min(12, widget.layout.w + 1), widget.layout.h);
  };

  const handleDecreaseWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeWidget(widget.id, Math.max(2, widget.layout.w - 1), widget.layout.h);
  };

  const handleIncreaseHeight = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeWidget(widget.id, widget.layout.w, Math.min(8, widget.layout.h + 1));
  };

  const handleDecreaseHeight = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeWidget(widget.id, widget.layout.w, Math.max(2, widget.layout.h - 1));
  };

  return (
    <div
      onClick={handleSelect}
      className={`widget-card apple-glass ${isSelected ? 'selected' : ''}`}
      style={{
        gridColumn: `span ${colSpan}`,
        minHeight: `${minHeight}px`,
        position: 'relative',
        cursor: mode === 'editor' ? 'pointer' : 'default',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Floating Action Pill for selected widget in Editor */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            right: 14,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--apple-blue)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            animation: 'modalFadeIn 0.15s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Resizing Buttons */}
          <button
            title="Decrease Width"
            onClick={handleDecreaseWidth}
            style={{ padding: '2px 5px', color: 'var(--text-secondary)' }}
          >
            <Minimize2 size={11} />
          </button>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {widget.layout.w}×{widget.layout.h}
          </span>
          <button
            title="Increase Width"
            onClick={handleIncreaseWidth}
            style={{ padding: '2px 5px', color: 'var(--text-secondary)' }}
          >
            <Maximize2 size={11} />
          </button>

          <div style={{ width: 1, height: 12, backgroundColor: 'var(--glass-border)', margin: '0 2px' }} />

          <button
            title="Duplicate Widget"
            onClick={() => duplicateWidget(widget.id)}
            style={{ padding: '2px 5px', color: 'var(--text-secondary)' }}
          >
            <Copy size={11} />
          </button>
          <button
            title="Delete Widget"
            onClick={() => removeWidget(widget.id)}
            style={{ padding: '2px 5px', color: '#FF453A' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Render internal widget */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <WidgetRenderer widget={widget} />
      </div>
    </div>
  );
};
