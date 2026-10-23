import React, { useState } from 'react';
import { curatedTemplates } from '../../data/templates';
import { useDashboard } from '../../context/DashboardContext';
import { X, Search, Sparkles, Star, Download, ArrowRight } from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({ isOpen, onClose }) => {
  const { createFromTemplate } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'business' | 'personal' | 'technical'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = curatedTemplates.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInstall = (templateId: string) => {
    createFromTemplate(templateId);
    onClose();
  };

  return (
    <div className="apple-modal-overlay" onClick={onClose}>
      <div className="apple-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Curated Template Gallery</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Handcrafted first-party starter workspaces with real data bindings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-clickable"
            style={{ padding: '6px', color: 'var(--text-tertiary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div
          style={{
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Categories */}
          <div className="apple-segmented-control">
            {(['all', 'business', 'personal', 'technical'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`apple-segmented-item ${selectedCategory === cat ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)',
              width: '240px',
            }}
          >
            <Search size={14} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            flex: 1,
          }}
        >
          {filtered.map((t) => (
            <div
              key={t.id}
              className="apple-glass"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${t.previewColor}`,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: t.previewColor,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: `${t.previewColor}18`,
                    }}
                  >
                    {t.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#FFD60A' }}>
                    <Star size={12} fill="#FFD60A" />
                    <span>{t.rating}</span>
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>
                      ({t.downloads.toLocaleString()})
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {t.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
                  {t.description}
                </p>

                {/* Connector pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {t.requiredConnectors.map((conn, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-tertiary)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      {conn}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 12,
                  borderTop: '1px solid var(--glass-border)',
                }}
              >
                <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                  {t.widgetCount} widgets included
                </span>
                <button
                  onClick={() => handleInstall(t.id)}
                  className="btn-primary"
                  style={{
                    fontSize: '12px',
                    padding: '6px 14px',
                    background: t.previewColor,
                  }}
                >
                  Use Template
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
