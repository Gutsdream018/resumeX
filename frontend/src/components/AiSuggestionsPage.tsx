import React, { useState } from 'react';
import { Sparkles, Check, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ResumeAnalysisResult } from '../types';

interface AiSuggestionsPageProps {
  analysis: ResumeAnalysisResult;
}

interface SuggestionCardItem {
  id: string;
  title: string;
  section: string;
  current: string;
  recommendation: string;
  status: 'pending' | 'applied' | 'dismissed';
}

export const AiSuggestionsPage: React.FC<AiSuggestionsPageProps> = ({ analysis }) => {
  const rawAny = analysis as any;
  const initialItems: SuggestionCardItem[] = React.useMemo(() => {
    if (analysis.bullet_point_improvements && analysis.bullet_point_improvements.length > 0) {
      return analysis.bullet_point_improvements.map((b, idx) => ({
        id: `bp-${idx}`,
        title: b.problem || 'Quantify impact & decisive action verbs',
        section: 'Work Experience',
        current: b.original,
        recommendation: b.improved,
        status: 'pending' as const,
      }));
    }
    if (rawAny.detailedRecommendations && rawAny.detailedRecommendations.length > 0) {
      return rawAny.detailedRecommendations.map((r: any, idx: number) => ({
        id: `rec-${idx}`,
        title: r.issue || 'Resume optimization opportunity',
        section: r.section ? (r.section.charAt(0).toUpperCase() + r.section.slice(1)) : 'Work Experience',
        current: r.currentText || 'Original phrasing in resume',
        recommendation: r.suggestedText || r.explanation || 'Apply Google XYZ formula with measurable outcomes.',
        status: 'pending' as const,
      }));
    }
    return [
      {
        id: 's1',
        title: 'Strengthen your experience section',
        section: 'Work Experience',
        current: 'Worked on software project deliverables.',
        recommendation:
          'Engineered key microservice deliverables using modern cloud stack, improving delivery turnaround by [metric: X%].',
        status: 'pending' as const,
      },
    ];
  }, [analysis]);

  const [suggestions, setSuggestions] = useState<SuggestionCardItem[]>(initialItems);

  React.useEffect(() => {
    setSuggestions(initialItems);
  }, [initialItems]);

  const handleApply = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'applied' } : s))
    );
  };

  const handleDismiss = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'dismissed' } : s))
    );
  };

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;
  const appliedCount = suggestions.filter((s) => s.status === 'applied').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Recommended Revisions
          </h2>
          <p style={{ color: '#9A9A9A', fontSize: '0.88rem' }}>
            Actionable bullet point rewrites designed to maximize recruiter response rates and highlight quantifiable outcomes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-red">{pendingCount} Actionable</span>
          <span className="badge badge-green">{appliedCount} Applied</span>
        </div>
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {suggestions.map((item) => {
          if (item.status === 'dismissed') {
            return (
              <div
                key={item.id}
                style={{
                  background: '#0D0D0D',
                  border: '1px solid #1C1C1C',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.5,
                }}
              >
                <span style={{ fontSize: '0.84rem', color: '#737373', textDecoration: 'line-through' }}>
                  {item.title} (Dismissed)
                </span>
                <button
                  onClick={() => handleApply(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9A9A9A',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                  }}
                >
                  Undo Dismiss
                </button>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="card-dark"
              style={{
                padding: '24px',
                background: '#111111',
                border: item.status === 'applied' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #242424',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: item.status === 'applied' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(227, 27, 43, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={14} color={item.status === 'applied' ? '#10B981' : '#E31B2B'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {item.title}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#737373' }}>
                      Section: {item.section}
                    </span>
                  </div>
                </div>

                {item.status === 'applied' && (
                  <span className="badge badge-green">
                    <CheckCircle2 size={12} /> Applied to Document
                  </span>
                )}
              </div>

              {/* Current vs AI Recommendation Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr',
                  gap: '16px',
                  marginBottom: '20px',
                }}
                className="suggestion-comparison-grid"
              >
                {/* Current */}
                <div
                  style={{
                    background: '#0D0D0D',
                    border: '1px solid #222222',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                    Current:
                  </span>
                  <p style={{ color: '#FF99A1', fontSize: '0.86rem', lineHeight: 1.5, fontFamily: 'monospace' }}>
                    "{item.current}"
                  </p>
                </div>

                {/* Recommended Revision */}
                <div
                  style={{
                    background: 'rgba(227, 27, 43, 0.04)',
                    border: '1px solid rgba(227, 27, 43, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                    Recommended Revision:
                  </span>
                  <p style={{ color: '#FFFFFF', fontSize: '0.88rem', lineHeight: 1.5, fontWeight: 500 }}>
                    "{item.recommendation}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="btn btn-secondary-dark"
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  <X size={14} />
                  <span>Dismiss</span>
                </button>

                <button
                  onClick={() => handleApply(item.id)}
                  className="btn btn-red"
                  style={{
                    padding: '8px 20px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                  }}
                >
                  <Check size={14} />
                  <span>{item.status === 'applied' ? 'Re-Apply' : 'Apply Revision'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 820px) {
          .suggestion-comparison-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
