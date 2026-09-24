import React from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { MissingInformationPrompt } from '../../types';

export interface ImprovementItem {
  id: string;
  section: string;
  title: string;
  originalText: string;
  suggestedRevision: string;
  explanation: string;
  impactScore?: number;
  verifiedFacts?: string[];
  missingPrompt?: MissingInformationPrompt;
  applied?: boolean;
}

interface ImprovementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  improvements: ImprovementItem[];
  onApplyImprovement: (item: ImprovementItem) => void;
  onSelectImprovementToFocus: (item: ImprovementItem) => void;
}

export const ImprovementDrawer: React.FC<ImprovementDrawerProps> = ({
  isOpen,
  onClose,
  improvements,
  onApplyImprovement,
  onSelectImprovementToFocus,
}) => {
  if (!isOpen) return null;

  const pendingCount = improvements.filter((i) => !i.applied).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99998,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '460px',
          maxWidth: '92vw',
          height: '100%',
          backgroundColor: '#121212',
          borderLeft: '1px solid #282828',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
          color: '#F5F5F5',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#181818',
            borderBottom: '1px solid #262626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(227, 27, 43, 0.15)',
                border: '1px solid rgba(227, 27, 43, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E31B2B',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#FFFFFF' }}>
                High-Impact Improvements
              </div>
              <div style={{ fontSize: '0.74rem', color: '#888' }}>
                {pendingCount > 0 ? `${pendingCount} optimizations ready to review` : 'All recommendations applied!'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {improvements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
              <ShieldCheck size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, color: '#DDD', fontSize: '0.92rem' }}>
                Resume is Highly Optimized
              </div>
              <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>
                No critical structural or bullet improvements found.
              </div>
            </div>
          ) : (
            improvements.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  backgroundColor: '#161616',
                  border: item.applied ? '1px solid #222' : '1px solid #2E2E2E',
                  borderRadius: '8px',
                  padding: '14px',
                  opacity: item.applied ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: item.applied ? '#10B981' : '#E31B2B',
                      backgroundColor: item.applied ? 'rgba(16, 185, 129, 0.1)' : 'rgba(227, 27, 43, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {item.section}
                  </span>

                  {item.applied && (
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Applied
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#FFF', marginBottom: '6px' }}>
                  {item.title}
                </div>

                {/* Original snippet */}
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: '#888',
                    backgroundColor: '#111',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    borderLeft: '2px solid #444',
                  }}
                >
                  <span style={{ color: '#555' }}>Original: </span>
                  {item.originalText}
                </div>

                {/* Proposed fix */}
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#E6F4EA',
                    backgroundColor: 'rgba(16, 185, 129, 0.06)',
                    padding: '8px 10px',
                    borderRadius: '5px',
                    marginBottom: '8px',
                    borderLeft: '3px solid #10B981',
                    lineHeight: 1.4,
                  }}
                >
                  {item.suggestedRevision}
                </div>

                {/* Rationale */}
                <div style={{ fontSize: '0.72rem', color: '#AAA', marginBottom: '10px', lineHeight: 1.35 }}>
                  {item.explanation}
                </div>

                {/* Actions */}
                {!item.applied && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        onSelectImprovementToFocus(item);
                        onClose();
                      }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#222',
                        border: '1px solid #333',
                        borderRadius: '5px',
                        color: '#DDD',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Jump to Bullet</span>
                      <ChevronRight size={13} />
                    </button>
                    <button
                      onClick={() => onApplyImprovement(item)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#10B981',
                        border: 'none',
                        borderRadius: '5px',
                        color: '#FFF',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={13} />
                      <span>Apply Fix</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
