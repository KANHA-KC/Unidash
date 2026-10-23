import React, { useState } from 'react';
import { WidgetProps } from '../../types/dashboard';

interface ChartAreaWidgetProps {
  props: WidgetProps;
}

export const ChartAreaWidget: React.FC<ChartAreaWidgetProps> = ({ props }) => {
  const { title, subtitle, chartData = [], accentColor = '#0A84FF' } = props;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!chartData || chartData.length === 0) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>No chart data available</div>;
  }

  // Dimensions
  const svgWidth = 500;
  const svgHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };

  const usableWidth = svgWidth - padding.left - padding.right;
  const usableHeight = svgHeight - padding.top - padding.bottom;

  // Max value calculation
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.value, d.secondary || 0)),
    100
  );

  // Generate coordinates
  const points = chartData.map((d, index) => {
    const x = padding.left + (index / (chartData.length - 1)) * usableWidth;
    const y = padding.top + usableHeight - (d.value / maxVal) * usableHeight;
    return { x, y, ...d };
  });

  const secondaryPoints = chartData.map((d, index) => {
    const val = d.secondary || 0;
    const x = padding.left + (index / (chartData.length - 1)) * usableWidth;
    const y = padding.top + usableHeight - (val / maxVal) * usableHeight;
    return { x, y, ...d };
  });

  // Smooth bezier curve generator
  const createSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const secondaryLinePath = createSmoothPath(secondaryPoints);

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + usableHeight} L ${points[0].x} ${padding.top + usableHeight} Z`;

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {title}
          </h4>
          {subtitle && (
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
        {activePoint && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: accentColor, fontFamily: 'var(--font-display)' }}>
              ${activePoint.value.toLocaleString()}
            </span>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              {activePoint.label}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 140 }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`area-grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.38" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle grid horizontal rules */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = padding.top + usableHeight * pct;
            return (
              <line
                key={idx}
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="var(--glass-border)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Secondary Line (if available) */}
          {chartData[0]?.secondary !== undefined && (
            <path
              d={secondaryLinePath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          {/* Area gradient underfill */}
          <path d={areaPath} fill={`url(#area-grad-${title.replace(/\s+/g, '')})`} />

          {/* Primary curve */}
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive points & hover line */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === i ? 5 : 3.5}
                fill={hoverIndex === i ? '#ffffff' : accentColor}
                stroke="var(--bg-primary)"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoverIndex(i)}
              />
              {/* Invisible wider hit target */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={16}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 8px 0 8px',
            fontSize: '10px',
            color: 'var(--text-tertiary)',
          }}
        >
          {chartData.map((d, i) => (
            <span
              key={i}
              style={{
                fontWeight: hoverIndex === i ? 600 : 400,
                color: hoverIndex === i ? 'var(--text-primary)' : 'inherit',
              }}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
