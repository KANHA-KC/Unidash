import React, { useState } from 'react';
import { WidgetProps } from '../../types/dashboard';

interface ChartDonutWidgetProps {
  props: WidgetProps;
}

export const ChartDonutWidget: React.FC<ChartDonutWidgetProps> = ({ props }) => {
  const { title, subtitle, chartData = [], accentColor = '#30D158' } = props;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!chartData || chartData.length === 0) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No donut chart data</div>;
  }

  const defaultColors = [
    accentColor,
    '#0A84FF',
    '#BF5AF2',
    '#FF9F0A',
    '#FF375F',
    '#64D2FF',
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0) || 100;

  // SVG parameters
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  const segments = chartData.map((item, index) => {
    const percentage = item.value / total;
    const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += percentage;

    return {
      ...item,
      color: defaultColors[index % defaultColors.length],
      strokeDasharray,
      strokeDashoffset,
      percentage: Math.round(percentage * 100),
    };
  });

  const activeSegment = hoverIndex !== null ? segments[hoverIndex] : segments[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 10 }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </h4>
        {subtitle && (
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, gap: 12 }}>
        {/* Donut Ring with interactive center text */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hoverIndex === i ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                  cursor: 'pointer',
                  opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.45,
                }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}
          </svg>

          {/* Center Stat */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: activeSegment?.color || 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {activeSegment?.percentage}%
            </span>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                maxWidth: '70px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeSegment?.label}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                cursor: 'pointer',
                opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.5,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: seg.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {seg.label}
                </span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: 6 }}>
                {seg.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
