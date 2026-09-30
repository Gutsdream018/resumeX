import React from 'react';
import { CheckCircle2, X, Send } from 'lucide-react';

interface AppliedPromptModalProps {
  isOpen: boolean;
  jobTitle: string;
  company: string;
  onYesApplied: () => void;
  onNotYet: () => void;
}

export const AppliedPromptModal: React.FC<AppliedPromptModalProps> = ({
  isOpen,
  jobTitle,
  company,
  onYesApplied,
  onNotYet,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onNotYet}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: '#111111',
          border: '1px solid rgba(227, 27, 43, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(227, 27, 43, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="prompt-title"
        aria-describedby="prompt-desc"
      >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(227, 27, 43, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E31B2B',
              flexShrink: 0,
            }}
          >
            <Send size={18} />
          </div>
          <div>
            <h4 id="prompt-title" style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Did you submit your application?
            </h4>
            <p id="prompt-desc" style={{ fontSize: '0.78rem', color: '#9A9A9A', margin: '2px 0 0' }}>
              {jobTitle} &bull; <strong style={{ color: '#E0E0E0' }}>{company}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onNotYet}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#777',
            cursor: 'pointer',
            padding: '2px',
          }}
          aria-label="Dismiss prompt"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={onNotYet}
          className="btn btn-secondary-dark"
          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
        >
          Not yet
        </button>

        <button
          onClick={onYesApplied}
          className="btn btn-red"
          style={{
            fontSize: '0.8rem',
            padding: '6px 16px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>Yes, Applied!</span>
        </button>
      </div>
    </div>
  </div>
);
};
