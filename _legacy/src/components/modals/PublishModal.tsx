import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import confetti from 'canvas-confetti';
import { X, Share2, Globe, Lock, Link as LinkIcon, Copy, Check, ExternalLink, Code } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose }) => {
  const { dashboard, updateDashboard, setActiveView } = useDashboard();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeShareMode, setActiveShareMode] = useState<'public' | 'link' | 'private'>(dashboard.visibility || 'public');

  if (!isOpen) return null;

  const publicUrl = `https://unidash.io/p/${dashboard.slug || 'workspace-2026'}`;
  const embedCode = `<iframe src="${publicUrl}?embed=true" width="100%" height="700" frameborder="0"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handlePublish = () => {
    updateDashboard({
      ...dashboard,
      visibility: activeShareMode,
    });

    // Burst Apple celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0A84FF', '#BF5AF2', '#30D158', '#FF375F', '#FFD60A'],
      });
    } catch (e) {}

    setTimeout(() => {
      onClose();
      setActiveView('published');
    }, 600);
  };

  return (
    <div className="apple-modal-overlay" onClick={onClose}>
      <div className="apple-modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
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
                background: 'linear-gradient(135deg, #0A84FF, #30D158)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Share2 size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Publish & Share Dashboard</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Create a high-performance, live-updating public or private link
              </p>
            </div>
          </div>
          <button onClick={onClose} className="apple-clickable" style={{ padding: '6px', color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Access Policy Segmented Control */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              VISIBILITY & PERMISSIONS
            </label>
            <div className="apple-segmented-control" style={{ width: '100%' }}>
              <button
                onClick={() => setActiveShareMode('public')}
                className={`apple-segmented-item ${activeShareMode === 'public' ? 'active' : ''}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Globe size={13} />
                Public (Any link)
              </button>
              <button
                onClick={() => setActiveShareMode('link')}
                className={`apple-segmented-item ${activeShareMode === 'link' ? 'active' : ''}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <LinkIcon size={13} />
                Restricted Link
              </button>
              <button
                onClick={() => setActiveShareMode('private')}
                className={`apple-segmented-item ${activeShareMode === 'private' ? 'active' : ''}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Lock size={13} />
                Private Only
              </button>
            </div>
          </div>

          {/* Published Share URL */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              LIVE DASHBOARD URL
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 6px 4px 12px',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {publicUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
              >
                {copiedLink ? <Check size={12} color="#30D158" /> : <Copy size={12} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Embed snippet */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              EMBED IFRAME CODE
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 6px 4px 12px',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {embedCode}
              </span>
              <button
                onClick={handleCopyEmbed}
                className="btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
              >
                {copiedEmbed ? <Check size={12} color="#30D158" /> : <Code size={12} />}
                {copiedEmbed ? 'Copied' : 'Embed'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            SSL & CDN edge caching enabled automatically
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button onClick={handlePublish} className="btn-primary" style={{ padding: '8px 20px' }}>
              Confirm & Open Live
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
