import React from 'react';
import { WidgetProps } from '../../types/dashboard';

interface GaugeWidgetProps {
  props: WidgetProps;
}

export const GaugeWidget: React.FC<GaugeWidgetProps> = ({ props }) => {
  const {
    title,
    subtitle,
    gaugeValue = 90,
    gaugeMin = 0,
    gaugeMax = 100,
    gaugeTarget,
    accentColor = '#30D158',
  } = props;

  const percentage = Math.min(
    100,
    Math.max(0, ((gaugeValue - gaugeMin) / (gaugeMax - gaugeMin)) * 100)
  );

  // Semi-circle arc geometry
  const radius = 64;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Use 180 degrees (half circle)
  const strokeDashoffset = circumference - (percentage / 100) * (circumference / 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
        <div style={{ position: 'relative', width: 140, height: 75, overflow: 'hidden' }}>
          <svg height={140} width={140} style={{ transform: 'rotate(-180deg)', overflow: 'visible' }}>
            <circle
              stroke="rgba(255, 255, 255, 0.08)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={70}
              cy={70}
            />
            <circle
              stroke={accentColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference / 2} ${circumference}`}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={70}
              cy={70}
            />
          </svg>
        </div>

        <div style={{ textAlign: 'center', marginTop: -20 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            {gaugeValue}
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>%</span>
          </span>
          {gaugeTarget && (
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              Target SLA: {gaugeTarget}%
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)' }}>
        <span>{gaugeMin}%</span>
        <span>Optimal</span>
        <span>{gaugeMax}%</span>
      </div>
    </div>
  );
};
