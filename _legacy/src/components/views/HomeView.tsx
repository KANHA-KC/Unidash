import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { curatedTemplates } from '../../data/templates';
import { executeAICommand } from '../../utils/aiEngine';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Layout,
  Clock,
  Star,
  Zap,
  TrendingUp,
  Activity,
  Heart,
  Briefcase,
  Layers,
} from 'lucide-react';

interface HomeViewProps {
  onOpenTemplatesModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenTemplatesModal }) => {
  const {
    dashboardsList,
    selectDashboard,
    createNewBlankDashboard,
    createFromTemplate,
    setActiveView,
    updateDashboard,
  } = useDashboard();

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setTimeout(() => {
      // Pick template 0 as base and apply prompt
      const baseDash = curatedTemplates[0].dashboard;
      const result = executeAICommand(aiPrompt, baseDash);
      if (result.success && result.updatedDashboard) {
        const newDash = {
          ...result.updatedDashboard,
          id: `dash-ai-${Date.now()}`,
          name: aiPrompt.length > 28 ? aiPrompt.substring(0, 28) + '...' : aiPrompt,
          slug: `ai-workspace-${Date.now().toString().slice(-4)}`,
        };
        updateDashboard(newDash);
        selectDashboard(newDash.id);
      }
      setIsGenerating(false);
      setActiveView('editor');
    }, 400);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <Heart size={14} color="#FF375F" />;
      case 'technical':
        return <Activity size={14} color="#30D158" />;
      case 'business':
      default:
        return <TrendingUp size={14} color="var(--apple-blue)" />;
    }
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '40px 24px 80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '1100px' }}>
        {/* Brand & Hero Title */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(10, 132, 255, 0.1)',
              border: '1px solid rgba(10, 132, 255, 0.25)',
              color: 'var(--apple-blue)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            <Sparkles size={13} />
            Universal Dashboard Studio • Anything can be a dashboard
          </div>

          <h1
            style={{
              fontSize: '44px',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            What do you want to build?
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            Turn ideas, live metrics, and workflows into elegant interactive workspaces using Apple Design principles.
          </p>
        </div>

        {/* Large Apple Intelligence Prompt Box */}
        <form
          onSubmit={handleAIGenerate}
          className="apple-glass"
          style={{
            padding: '8px 10px 8px 18px',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.6), 0 0 25px rgba(10, 132, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            marginBottom: 44,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0A84FF, #BF5AF2, #FF375F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} color="#ffffff" />
          </div>

          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Founder metrics with MRR, churn, and active enterprise customer accounts..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-text)',
            }}
          />

          <button
            type="submit"
            disabled={!aiPrompt.trim() || isGenerating}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              borderRadius: 'var(--radius-lg)',
              opacity: aiPrompt.trim() ? 1 : 0.6,
            }}
          >
            {isGenerating ? 'Synthesizing...' : 'Generate with AI'}
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Action Row: Start Fresh or Browse */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
          <div
            onClick={() => createNewBlankDashboard('New Custom Workspace')}
            className="apple-glass apple-glass-hover"
            style={{
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Blank Canvas</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Build from scratch with free grid layout
              </p>
            </div>
          </div>

          <div
            onClick={onOpenTemplatesModal}
            className="apple-glass apple-glass-hover"
            style={{
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(10, 132, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--apple-blue)',
              }}
            >
              <Layout size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Explore Templates</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Browse verified first-party designs
              </p>
            </div>
          </div>

          <div
            onClick={() => setActiveView('editor')}
            className="apple-glass apple-glass-hover"
            style={{
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(48, 209, 88, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#30D158',
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Current Studio</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Resume editing active workspace
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Recent Dashboards */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Your Dashboards & Workspaces</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {dashboardsList.length} saved workspaces
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {dashboardsList.map((dash) => {
              const totalWidgets = dash.pages.reduce((acc, p) => acc + p.components.length, 0);
              return (
                <div
                  key={dash.id}
                  onClick={() => selectDashboard(dash.id)}
                  className="apple-glass apple-glass-hover"
                  style={{
                    padding: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getCategoryIcon(dash.category)}
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                          {dash.category}
                        </span>
                      </div>
                      <span className="live-status-pill">
                        <span className="pulse-dot" />
                        Live
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {dash.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dash.description || 'Custom dashboard workspace'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 14,
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <span>{totalWidgets} components</span>
                    <span style={{ color: 'var(--apple-blue)', fontWeight: 600 }}>Open Studio →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Curated Template Showcase */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Curated Starters</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Production-grade starting points configured with realistic sample schemas
              </p>
            </div>
            <button
              onClick={onOpenTemplatesModal}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              View All in Gallery
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {curatedTemplates.slice(0, 4).map((tmpl) => (
              <div
                key={tmpl.id}
                className="apple-glass"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${tmpl.previewColor}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: tmpl.previewColor,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: `${tmpl.previewColor}18`,
                      }}
                    >
                      {tmpl.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#FFD60A' }}>
                      <Star size={12} fill="#FFD60A" />
                      <span>{tmpl.rating}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>({tmpl.downloads.toLocaleString()})</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {tmpl.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {tmpl.tagline}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--glass-border)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {tmpl.widgetCount} widgets • {tmpl.author}
                  </span>
                  <button
                    onClick={() => createFromTemplate(tmpl.id)}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px', background: tmpl.previewColor }}
                  >
                    Install & Edit
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
