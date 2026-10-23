import React from 'react';
import { WidgetProps } from '../../types/dashboard';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

interface StatusFeedWidgetProps {
  props: WidgetProps;
}

export const StatusFeedWidget: React.FC<StatusFeedWidgetProps> = ({ props }) => {
  const { title, subtitle, events = [] } = props;

  const getIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 size={13} color="#30D158" />;
      case 'warning':
        return <AlertTriangle size={13} color="#FF9F0A" />;
      case 'error':
        return <XCircle size={13} color="#FF453A" />;
      case 'info':
      default:
        return <Info size={13} color="#0A84FF" />;
    }
  };

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        {events.map((evt) => (
          <div
            key={evt.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '12px',
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ marginTop: 2, flexShrink: 0 }}>{getIcon(evt.level)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-primary)', lineHeight: 1.35 }}>{evt.message}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                {evt.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
