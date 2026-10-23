import React from 'react';
import { WidgetProps } from '../../types/dashboard';
import { Check, Flame } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface HabitsWidgetProps {
  id: string;
  props: WidgetProps;
}

export const HabitsWidget: React.FC<HabitsWidgetProps> = ({ id, props }) => {
  const { title, subtitle, items = [], accentColor = '#FF375F' } = props;
  const { toggleHabitItem } = useDashboard();

  const completedCount = items.filter((i) => i.done).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
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

        {/* Apple Fitness style completion pill */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(255, 55, 95, 0.15)',
            color: accentColor,
            border: `1px solid ${accentColor}40`,
          }}
        >
          {completedCount} / {items.length} ({progressPercent}%)
        </div>
      </div>

      {/* Progress Bar Line */}
      <div
        style={{
          width: '100%',
          height: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 2,
          marginBottom: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: 2,
            transition: 'width 0.4s var(--spring-critically-damped)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleHabitItem(id, item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: item.done ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = item.done ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Apple-style circular checkbox */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: item.done ? accentColor : 'transparent',
                  border: item.done ? `1px solid ${accentColor}` : '2px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                }}
              >
                {item.done && <Check size={12} color="#ffffff" strokeWidth={3} />}
              </div>

              <span
                style={{
                  fontSize: '12.5px',
                  color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  textDecoration: item.done ? 'line-through' : 'none',
                  transition: 'all 0.2s ease',
                  fontWeight: item.done ? 400 : 500,
                }}
              >
                {item.label}
              </span>
            </div>

            {/* Streak flame badge */}
            {item.streak !== undefined && item.streak > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#FF9F0A',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(255, 159, 10, 0.12)',
                }}
              >
                <Flame size={12} />
                {item.streak}d
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
