import React, { useState } from 'react';
import { WidgetProps } from '../../types/dashboard';
import { Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface TableWidgetProps {
  props: WidgetProps;
}

export const TableWidget: React.FC<TableWidgetProps> = ({ props }) => {
  const { title, subtitle, columns = [], rows = [] } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const { activeFilter, setActiveFilter } = useDashboard();

  const filteredRows = rows.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some(
      (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase();
    let bg = 'rgba(255, 255, 255, 0.1)';
    let color = 'var(--text-secondary)';
    let dotColor = '#8E8E93';

    if (s.includes('healthy') || s.includes('active') || s.includes('done')) {
      bg = 'rgba(48, 209, 88, 0.15)';
      color = '#30D158';
      dotColor = '#30D158';
    } else if (s.includes('review') || s.includes('progress') || s.includes('warn')) {
      bg = 'rgba(255, 159, 10, 0.15)';
      color = '#FF9F0A';
      dotColor = '#FF9F0A';
    } else if (s.includes('error') || s.includes('fail') || s.includes('churn')) {
      bg = 'rgba(255, 69, 58, 0.15)';
      color = '#FF453A';
      dotColor = '#FF453A';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 8px',
          borderRadius: 'var(--radius-pill)',
          background: bg,
          color,
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dotColor }} />
        {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 12,
        }}
      >
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

        {/* Quick Search inside Table */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <Search size={12} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Filter records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '11px',
              color: 'var(--text-primary)',
              width: '100px',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '8px 10px',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rIdx) => {
              const isSelected = activeFilter === Object.values(row)[0];
              return (
                <tr
                  key={rIdx}
                  onClick={() => {
                    const rowKey = Object.values(row)[0];
                    setActiveFilter(isSelected ? null : String(rowKey));
                  }}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {columns.map((col) => {
                    const val = row[col.key];
                    return (
                      <td key={col.key} style={{ padding: '9px 10px', color: 'var(--text-primary)' }}>
                        {col.type === 'status' ? (
                          getStatusBadge(val)
                        ) : col.type === 'number' ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{val}</span>
                        ) : (
                          val ?? '—'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
