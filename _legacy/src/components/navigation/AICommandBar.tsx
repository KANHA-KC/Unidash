import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { executeAICommand } from '../../utils/aiEngine';
import { Sparkles, ArrowUp, Zap } from 'lucide-react';

export const AICommandBar: React.FC = () => {
  const { dashboard, updateDashboard } = useDashboard();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const sampleChips = [
    'Add revenue breakdown chart',
    'Switch to Cyber Mint theme',
    'Add LTV metric card',
    'Generate Apple Fitness OS',
    'Add system alert banner',
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastMessage(null);

    // Simulate snappy Apple Intelligence pipeline execution (300ms)
    setTimeout(() => {
      const result = executeAICommand(prompt, dashboard);
      if (result.success && result.updatedDashboard) {
        updateDashboard(result.updatedDashboard);
        setLastMessage(result.message);
      }
      setIsProcessing(false);
      setPrompt('');

      // Auto-clear success message after 4s
      setTimeout(() => {
        setLastMessage(null);
      }, 4000);
    }, 320);
  };

  const handleChipClick = (chip: string) => {
    setPrompt(chip);
    setIsProcessing(true);
    setTimeout(() => {
      const result = executeAICommand(chip, dashboard);
      if (result.success && result.updatedDashboard) {
        updateDashboard(result.updatedDashboard);
        setLastMessage(result.message);
      }
      setIsProcessing(false);
      setPrompt('');
      setTimeout(() => setLastMessage(null), 4000);
    }, 280);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: '680px',
        zIndex: 80,
      }}
    >
      {/* Quick Suggestion Chips */}
      {!lastMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 8,
            overflowX: 'auto',
            paddingBottom: 2,
          }}
        >
          {sampleChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="apple-clickable"
              style={{
                background: 'rgba(20, 22, 30, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--glass-border-top)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <Zap size={10} color="var(--apple-blue)" style={{ marginRight: 4 }} />
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Main Apple Intelligence Command Capsule */}
      <form
        onSubmit={handleSubmit}
        className="ai-command-bar ai-pulse-glow"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(10, 132, 255, 0.25)',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0A84FF, #BF5AF2, #FF375F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(191, 90, 242, 0.5)',
          }}
        >
          <Sparkles size={14} color="#ffffff" />
        </div>

        <input
          type="text"
          className="ai-input"
          placeholder={
            isProcessing
              ? 'Apple Intelligence is crafting dashboard components...'
              : 'Ask Apple Intelligence to build, re-theme, or bind widgets...'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isProcessing}
        />

        <button
          type="submit"
          disabled={!prompt.trim() || isProcessing}
          className="btn-primary"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            padding: 0,
            flexShrink: 0,
            opacity: prompt.trim() ? 1 : 0.5,
          }}
        >
          <ArrowUp size={14} />
        </button>
      </form>

      {/* Feedback Toast Notification */}
      {lastMessage && (
        <div
          style={{
            marginTop: 8,
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'var(--text-primary)',
            background: 'rgba(20, 24, 34, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--apple-blue)',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 14px',
            display: 'inline-block',
            left: '50%',
            position: 'relative',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            animation: 'modalPopIn 0.2s ease',
          }}
        >
          ✨ {lastMessage}
        </div>
      )}
    </div>
  );
};
