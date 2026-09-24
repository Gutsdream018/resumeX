import React, { useState } from 'react';
import { Sparkles, Check, X, Edit3, ShieldAlert, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { MissingInformationPrompt } from '../../types';
import { factGuidedRewriteApi } from '../../services/api';

export interface InlineSuggestionData {
  bulletId?: string;
  section: string;
  originalText: string;
  suggestedRevision: string;
  explanation: string;
  recruiterTip?: string;
  verifiedFacts?: string[];
  missingPrompt?: MissingInformationPrompt;
}

interface InlineAiSuggestionPopoverProps {
  data: InlineSuggestionData;
  position: { top: number; left: number };
  onApply: (newText: string, verifiedFacts?: string[]) => void;
  onEditManually: (text: string) => void;
  onDismiss: () => void;
}

export const InlineAiSuggestionPopover: React.FC<InlineAiSuggestionPopoverProps> = ({
  data,
  position,
  onApply,
  onEditManually,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<'suggestion' | 'missing_facts'>(
    data.missingPrompt && data.missingPrompt.detectedMissing.length > 0 ? 'missing_facts' : 'suggestion'
  );
  const [userFacts, setUserFacts] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(data.suggestedRevision);
  const [currentFacts, setCurrentFacts] = useState<string[]>(data.verifiedFacts || []);
  const [customEditText, setCustomEditText] = useState(data.suggestedRevision);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleFieldChange = (key: string, value: string) => {
    setUserFacts((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateWithFacts = async () => {
    setIsGenerating(true);
    try {
      const res = await factGuidedRewriteApi({
        originalText: data.originalText,
        section: data.section,
        userFacts,
      });

      if (res && res.suggestedRevision) {
        setCurrentSuggestion(res.suggestedRevision);
        setCustomEditText(res.suggestedRevision);
        setCurrentFacts(res.verifiedFacts || []);
        setActiveTab('suggestion');
      }
    } catch (err) {
      console.error('Fact-guided rewrite failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(12px)',
        zIndex: 9999,
        width: '420px',
        maxWidth: '92vw',
        backgroundColor: '#121212',
        border: '1px solid #2E2E2E',
        borderRadius: '10px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(227, 27, 43, 0.25)',
        color: '#F5F5F5',
        fontSize: '0.84rem',
        overflow: 'hidden',
        animation: 'popoverFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#181818',
          borderBottom: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '5px',
              backgroundColor: 'rgba(227, 27, 43, 0.15)',
              border: '1px solid rgba(227, 27, 43, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E31B2B',
            }}
          >
            <Sparkles size={12} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#FFFFFF' }}>
            ResumeX Optimization
          </span>
        </div>

        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
          }}
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      {/* Mode Navigation if missing dimensions detected */}
      {data.missingPrompt && data.missingPrompt.detectedMissing.length > 0 && (
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #262626',
            backgroundColor: '#141414',
          }}
        >
          <button
            onClick={() => setActiveTab('suggestion')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'suggestion' ? '2px solid #E31B2B' : '2px solid transparent',
              color: activeTab === 'suggestion' ? '#FFFFFF' : '#888',
              fontWeight: activeTab === 'suggestion' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Suggested Fix
          </button>
          <button
            onClick={() => setActiveTab('missing_facts')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'missing_facts' ? '2px solid #E31B2B' : '2px solid transparent',
              color: activeTab === 'missing_facts' ? '#FFFFFF' : '#888',
              fontWeight: activeTab === 'missing_facts' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Supply Missing Facts</span>
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: 'rgba(227, 27, 43, 0.25)',
                color: '#FF6B6B',
                padding: '1px 5px',
                borderRadius: '8px',
                fontWeight: 700,
              }}
            >
              {data.missingPrompt.detectedMissing.length}
            </span>
          </button>
        </div>
      )}

      {/* Body Content */}
      <div style={{ padding: '14px', maxHeight: '360px', overflowY: 'auto' }}>
        {activeTab === 'missing_facts' && data.missingPrompt ? (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '6px',
                padding: '8px 10px',
                marginBottom: '12px',
                fontSize: '0.76rem',
                color: '#FCD34D',
                lineHeight: 1.4,
              }}
            >
              <strong>Missing Evidence Detected:</strong> {data.missingPrompt.detectedMissing.join(', ')}.
              Supply your real achievements below to synthesize a verified Google X-Y-Z formula bullet.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.missingPrompt.fields.map((f) => (
                <div key={f.key}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      color: '#AAA',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={userFacts[f.key] || ''}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: '#1B1B1B',
                      border: '1px solid #333',
                      borderRadius: '5px',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {f.hint && (
                    <span style={{ fontSize: '0.68rem', color: '#666', marginTop: '2px', display: 'block' }}>
                      {f.hint}
                    </span>
                  )}
                </div>
              ))}

              <button
                onClick={handleGenerateWithFacts}
                disabled={isGenerating || Object.values(userFacts).every((v) => !v.trim())}
                style={{
                  marginTop: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#E31B2B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isGenerating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                <span>{isGenerating ? 'Synthesizing Verified Bullet...' : 'Generate Grounded Bullet'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Original vs Proposed */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>
                Original
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: '#181818',
                  borderRadius: '6px',
                  color: '#AAA',
                  fontSize: '0.78rem',
                  lineHeight: 1.4,
                  borderLeft: '2px solid #555',
                }}
              >
                {data.originalText}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '3px',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                  ResumeX Optimized
                </div>
                {!isCustomizing && (
                  <button
                    onClick={() => setIsCustomizing(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#AAA',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <Edit3 size={11} />
                    <span>Tweak</span>
                  </button>
                )}
              </div>

              {isCustomizing ? (
                <div>
                  <textarea
                    value={customEditText}
                    onChange={(e) => setCustomEditText(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1E1E1E',
                      border: '1px solid #E31B2B',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      lineHeight: 1.45,
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        setCustomEditText(currentSuggestion);
                        setIsCustomizing(false);
                      }}
                      style={{
                        padding: '3px 8px',
                        background: '#222',
                        border: '1px solid #444',
                        color: '#AAA',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setCurrentSuggestion(customEditText);
                        setIsCustomizing(false);
                      }}
                      style={{
                        padding: '3px 8px',
                        background: '#E31B2B',
                        border: 'none',
                        color: '#FFF',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Save Tweak
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '9px 11px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '6px',
                    color: '#E6F4EA',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    borderLeft: '3px solid #10B981',
                    fontWeight: 500,
                  }}
                >
                  {currentSuggestion}
                </div>
              )}
            </div>

            {/* Why this helps */}
            {data.explanation && (
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#AAA',
                  lineHeight: 1.4,
                  marginBottom: '10px',
                  backgroundColor: '#171717',
                  padding: '7px 9px',
                  borderRadius: '5px',
                }}
              >
                <strong style={{ color: '#CCC' }}>Impact:</strong> {data.explanation}
              </div>
            )}

            {/* Verified Facts badge list */}
            {currentFacts.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 600, marginBottom: '4px' }}>
                  VERIFIED FACTS ANCHORED:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {currentFacts.map((fact, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.68rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: '#DDD',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #333',
                      }}
                    >
                      ✓ {fact}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#161616',
          borderTop: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <button
          onClick={() => onEditManually(currentSuggestion)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#222',
            border: '1px solid #3A3A3A',
            borderRadius: '6px',
            color: '#DDD',
            fontSize: '0.76rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Edit3 size={13} />
          <span>Edit in Doc</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
          <button
            onClick={() => onApply(currentSuggestion, currentFacts)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#10B981',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Check size={14} />
            <span>Apply Fix</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popoverFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(12px); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
