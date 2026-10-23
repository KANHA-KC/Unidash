import React from 'react';
import { WidgetProps } from '../../types/dashboard';
import { FileText } from 'lucide-react';

interface NoteWidgetProps {
  props: WidgetProps;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({ props }) => {
  const { title, subtitle, content = '' } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <FileText size={14} color="var(--apple-blue)" />
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </h4>
      </div>
      {subtitle && (
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 8 }}>
          {subtitle}
        </p>
      )}

      <div
        style={{
          flex: 1,
          fontSize: '12.5px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {content || 'Click inspect to add text note or markdown.'}
      </div>
    </div>
  );
};
