import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Sliders, Database, Palette, X, Trash2, Copy, Sparkles, Moon, Sun } from 'lucide-react';

export const RightInspector: React.FC = () => {
  const {
    dashboard,
    updateDashboard,
    selectedWidgetId,
    setSelectedWidgetId,
    updateWidget,
    removeWidget,
    duplicateWidget,
    dataSources,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<'props' | 'data' | 'style'>('props');

  const activePage =
    dashboard.pages.find((p) => p.id === dashboard.activePageId) || dashboard.pages[0];
  const selectedWidget = activePage?.components.find((c) => c.id === selectedWidgetId);

  const colors = [
    { label: 'System Blue', hex: '#0A84FF' },
    { label: 'Cyber Mint', hex: '#30D158' },
    { label: 'Royal Purple', hex: '#BF5AF2' },
    { label: 'Sunset Rose', hex: '#FF375F' },
    { label: 'Warm Orange', hex: '#FF9F0A' },
    { label: 'Aqua Cyan', hex: '#64D2FF' },
  ];

  // If no widget is selected, show Dashboard Global Settings!
  if (!selectedWidget) {
    return (
      <div className="right-inspector" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Dashboard Settings
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>v{dashboard.version}</span>
        </div>

        {/* Dashboard Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            WORKSPACE NAME
          </label>
          <input
            type="text"
            value={dashboard.name}
            onChange={(e) => updateDashboard({ ...dashboard, name: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            DESCRIPTION
          </label>
          <textarea
            value={dashboard.description || ''}
            onChange={(e) => updateDashboard({ ...dashboard, description: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Theme mode toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            APPEARANCE MODE
          </label>
          <div className="apple-segmented-control" style={{ width: '100%' }}>
            <button
              onClick={() => {
                document.body.className = 'apple-theme-dark';
                updateDashboard({
                  ...dashboard,
                  theme: { ...dashboard.theme, mode: 'dark' },
                });
              }}
              className={`apple-segmented-item ${dashboard.theme.mode === 'dark' ? 'active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Moon size={12} />
              Dark Glass
            </button>
            <button
              onClick={() => {
                document.body.className = 'apple-theme-light';
                updateDashboard({
                  ...dashboard,
                  theme: { ...dashboard.theme, mode: 'light' },
                });
              }}
              className={`apple-segmented-item ${dashboard.theme.mode === 'light' ? 'active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Sun size={12} />
              Cupertino Light
            </button>
          </div>
        </div>

        {/* Global Accent Color */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            SYSTEM ACCENT COLOR
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() =>
                  updateDashboard({
                    ...dashboard,
                    theme: { ...dashboard.theme, accentColor: c.hex, name: c.label },
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background:
                    dashboard.theme.accentColor === c.hex
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    dashboard.theme.accentColor === c.hex ? c.hex : 'var(--glass-border)'
                  }`,
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.hex }} />
                <span style={{ fontSize: '10.5px' }}>{c.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(10, 132, 255, 0.08)',
            border: '1px solid rgba(10, 132, 255, 0.2)',
          }}
        >
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--apple-blue)' }}>
            Inspector Tip
          </span>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
            Click on any widget on the canvas to configure its properties, bind it to CSV/REST sources, or adjust sizing.
          </p>
        </div>
      </div>
    );
  }

  // WIDGET IS SELECTED
  return (
    <div className="right-inspector" style={{ padding: '16px 20px' }}>
      {/* Header with Title and Close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Widget Inspector
          </span>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            {selectedWidget.type}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => duplicateWidget(selectedWidget.id)}
            title="Duplicate"
            className="apple-clickable"
            style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => removeWidget(selectedWidget.id)}
            title="Delete"
            className="apple-clickable"
            style={{ padding: '4px 6px', color: '#FF453A' }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setSelectedWidgetId(null)}
            title="Deselect"
            className="apple-clickable"
            style={{ padding: '4px 6px', color: 'var(--text-tertiary)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Segmented Control for Tabs */}
      <div className="apple-segmented-control" style={{ width: '100%', marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('props')}
          className={`apple-segmented-item ${activeTab === 'props' ? 'active' : ''}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <Sliders size={12} />
          Props
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`apple-segmented-item ${activeTab === 'data' ? 'active' : ''}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <Database size={12} />
          Binding
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`apple-segmented-item ${activeTab === 'style' ? 'active' : ''}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <Palette size={12} />
          Style
        </button>
      </div>

      {/* TAB 1: PROPERTIES */}
      {activeTab === 'props' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>
              WIDGET TITLE
            </label>
            <input
              type="text"
              value={selectedWidget.props.title || ''}
              onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 10px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>
              SUBTITLE / DESCRIPTION
            </label>
            <input
              type="text"
              value={selectedWidget.props.subtitle || ''}
              onChange={(e) => updateWidget(selectedWidget.id, { subtitle: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 10px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
          </div>

          {/* Metric specific value */}
          {selectedWidget.type === 'metric' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                  DISPLAY VALUE
                </label>
                <input
                  type="text"
                  value={selectedWidget.props.value ?? ''}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      value: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value),
                    })
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                    PREFIX (e.g. $)
                  </label>
                  <input
                    type="text"
                    value={selectedWidget.props.prefix || ''}
                    onChange={(e) => updateWidget(selectedWidget.id, { prefix: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '7px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                    SUFFIX (e.g. %)
                  </label>
                  <input
                    type="text"
                    value={selectedWidget.props.suffix || ''}
                    onChange={(e) => updateWidget(selectedWidget.id, { suffix: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '7px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Note specific content */}
          {selectedWidget.type === 'note' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>
                MEMO CONTENT
              </label>
              <textarea
                value={selectedWidget.props.content || ''}
                onChange={(e) => updateWidget(selectedWidget.id, { content: e.target.value })}
                rows={5}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '7px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* Grid Layout Size Controls */}
          <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              GRID SPAN (12-COLUMNS)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Width (Cols)</span>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={selectedWidget.layout.w}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {}, { w: Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: 4,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Height (Units)</span>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={selectedWidget.layout.h}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {}, { h: Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    marginTop: 4,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA BINDING */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              CONNECTED DATA SOURCE
            </label>
            <select
              value={selectedWidget.binding?.sourceId || ''}
              onChange={(e) => {
                const sourceId = e.target.value;
                if (!sourceId) {
                  const copy = { ...selectedWidget };
                  delete copy.binding;
                  updateDashboard({
                    ...dashboard,
                    pages: dashboard.pages.map((p) => ({
                      ...p,
                      components: p.components.map((c) => (c.id === selectedWidget.id ? copy : c)),
                    })),
                  });
                } else {
                  updateDashboard({
                    ...dashboard,
                    pages: dashboard.pages.map((p) => ({
                      ...p,
                      components: p.components.map((c) =>
                        c.id === selectedWidget.id
                          ? { ...c, binding: { sourceId, field: 'mrr', format: 'currency' } }
                          : c
                      ),
                    })),
                  });
                }
              }}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 10px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#1c1d24' }}>None (Manual Data)</option>
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id} style={{ background: '#1c1d24' }}>
                  {ds.name} ({ds.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {selectedWidget.binding && (
            <div
              style={{
                background: 'rgba(10, 132, 255, 0.08)',
                border: '1px solid rgba(10, 132, 255, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--apple-blue)' }}>
                  Active Live Polling
                </span>
                <span style={{ fontSize: '10px', color: '#30D158' }}>● 5s Interval</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                This widget automatically re-evaluates its display value every time fresh data is fetched from the selected source.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STYLE */}
      {activeTab === 'style' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              ACCENT TINT
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => updateWidget(selectedWidget.id, { accentColor: c.hex })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background:
                      selectedWidget.props.accentColor === c.hex
                        ? 'rgba(255, 255, 255, 0.14)'
                        : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${
                      selectedWidget.props.accentColor === c.hex ? c.hex : 'var(--glass-border)'
                    }`,
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.hex }} />
                  <span style={{ fontSize: '10.5px' }}>{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
