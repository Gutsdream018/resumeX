import React from 'react';
import { RecommendationItem } from './types';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

interface OptimizationQueueProps {
  recommendations: RecommendationItem[];
  onOptimizeSection?: (section: string, detail: string) => void;
}

export const OptimizationQueue: React.FC<OptimizationQueueProps> = ({
  recommendations,
  onOptimizeSection,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div
      className="card-dark"
      style={{
        background: '#111111',
        border: '1px solid #242424',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <Sparkles size={18} color="#E31B2B" />
            <span>Top Improvements for This Job</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8E8E8E', marginTop: '4px', margin: 0 }}>
            Prioritized actions to close requirement gaps in Resume Optimizer without inventing facts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#737373' }}>
          <ShieldCheck size={14} color="#4ADE80" />
          <span>Fact-Safe Verification Active</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommendations.map((rec, idx) => (
          <div
            key={rec.id || idx}
            style={{
              background: '#161616',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(227, 27, 43, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#262626')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '75%' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(227, 27, 43, 0.15)',
                  border: '1px solid rgba(227, 27, 43, 0.35)',
                  color: '#FF4D5E',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {idx + 1}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    {rec.title}
                  </h4>
                  {rec.targetSection && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: '#222',
                        color: '#A1A1AA',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {rec.targetSection}
                    </span>
                  )}
                  {rec.impactScore > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#4ADE80',
                        background: 'rgba(34, 197, 94, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      +{rec.impactScore} pts potential
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#B3B3B3', margin: 0, lineHeight: 1.45 }}>
                  {rec.suggestedAction || rec.description}
                </p>
              </div>
            </div>

            {onOptimizeSection && (
              <button
                type="button"
                onClick={() => onOptimizeSection(rec.targetSection || 'skills', rec.missingElement || rec.title)}
                className="btn btn-red"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Optimize</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
