import React from 'react';
import { WidgetProps, DataBinding } from '../../types/dashboard';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface MetricWidgetProps {
  props: WidgetProps;
  binding?: DataBinding;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({ props, binding }) => {
  const { title, subtitle, value, change, changePeriod, prefix, suffix, accentColor } = props;

  const isPositive = (change || 0) >= 0;

  // Format numeric values
  const formattedValue =
    typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {title}
          </span>
          {binding && (
            <span
              title={`Bound to ${binding.sourceId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '10px',
                color: accentColor || 'var(--apple-blue)',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <Activity size={10} />
              LIVE
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ margin: '8px 0' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {prefix && <span style={{ opacity: 0.7, marginRight: 2 }}>{prefix}</span>}
          {formattedValue}
          {suffix && <span style={{ fontSize: '16px', fontWeight: 500, opacity: 0.7, marginLeft: 3 }}>{suffix}</span>}
        </div>
      </div>

      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', marginTop: 4 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 'var(--radius-pill)',
              background: isPositive ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)',
              color: isPositive ? '#30D158' : '#FF453A',
            }}
          >
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change)}%
          </span>
          {changePeriod && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
              {changePeriod}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
