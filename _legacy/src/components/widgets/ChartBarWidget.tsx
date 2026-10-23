import React, { useState } from 'react';
import { WidgetProps } from '../../types/dashboard';

interface ChartBarWidgetProps {
  props: WidgetProps;
}

export const ChartBarWidget: React.FC<ChartBarWidgetProps> = ({ props }) => {
  const { title, subtitle, chartData = [], accentColor = '#5E5CE6' } = props;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!chartData || chartData.length === 0) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No bar chart data</div>;
  }

  const maxVal = Math.max(...chartData.map((d) => d.value), 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </h4>
        {subtitle && (
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 10,
          paddingTop: 16,
          paddingBottom: 4,
          position: 'relative',
        }}
      >
        {chartData.map((item, index) => {
          const heightPercent = Math.max(8, (item.value / maxVal) * 100);
          const isHovered = hoverIndex === index;

          return (
            <div
              key={index}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Tooltip / value */}
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isHovered ? '#ffffff' : 'var(--text-tertiary)',
                  marginBottom: 6,
                  opacity: isHovered ? 1 : 0.7,
                  transition: 'all 0.15s ease',
                }}
              >
                {item.value}
              </div>

              {/* Bar pill with glass gradient */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${heightPercent}%`,
                  borderRadius: '6px 6px 4px 4px',
                  background: isHovered
                    ? `linear-gradient(180deg, #ffffff 0%, ${accentColor} 100%)`
                    : `linear-gradient(180deg, ${accentColor} 0%, rgba(255, 255, 255, 0.1) 100%)`,
                  boxShadow: isHovered ? `0 0 16px ${accentColor}` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              />

              {/* Label */}
              <div
                style={{
                  marginTop: 8,
                  fontSize: '10px',
                  fontWeight: isHovered ? 600 : 400,
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
