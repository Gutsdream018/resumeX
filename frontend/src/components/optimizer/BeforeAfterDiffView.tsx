import React from 'react';
import {
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface BeforeAfterDiffViewProps {
  originalResume: any;
  optimizedResume: any;
  baselineScore: number;
  optimizedScore: number;
}

export const BeforeAfterDiffView: React.FC<BeforeAfterDiffViewProps> = ({
  originalResume,
  optimizedResume,
  baselineScore,
  optimizedScore,
}) => {
  const delta = optimizedScore - baselineScore;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Score Comparison Banner */}
      <div
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={18} color="#E31B2B" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Before & After Optimization Audit
            </h3>
          </div>
          <p style={{ color: '#9A9A9A', fontSize: '0.84rem', margin: 0 }}>
            Side-by-side comparison of original candidate text against your evidence-grounded optimized resume.
          </p>
        </div>

        {/* Telemetry Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#141414', padding: '10px 16px', borderRadius: '10px', border: '1px solid #242424', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#737373', display: 'block' }}>ORIGINAL SCORE</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>{baselineScore}</strong>
          </div>

          <ArrowRight size={20} color="#737373" />

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'block', fontWeight: 700 }}>OPTIMIZED SCORE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'center' }}>
              <strong style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>{optimizedScore}</strong>
              {delta > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 800 }}>
                  +{delta}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Document Comparison Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
        className="compare-diff-grid"
      >
        {/* Left: Original Document */}
        <div
          className="card-dark"
          style={{
            background: '#0D0D0D',
            border: '1px solid #242424',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1E1E1E', paddingBottom: '12px', marginBottom: '16px' }}>
            <FileText size={16} color="#737373" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#A3A3A3', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Original Baseline Resume
            </h4>
          </div>

          {/* Contact */}
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
              {originalResume.contact?.name || 'Candidate Name'}
            </h5>
            <p style={{ fontSize: '0.78rem', color: '#737373', margin: 0 }}>
              {[originalResume.contact?.location, originalResume.contact?.email, originalResume.contact?.phone].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* Summary */}
          {originalResume.summary && (
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.74rem', color: '#737373', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Summary
              </span>
              <p style={{ fontSize: '0.82rem', color: '#888888', margin: 0, lineHeight: 1.45 }}>
                {originalResume.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#737373', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Experience
            </span>
            {(originalResume.experience || []).map((exp: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '0.84rem', color: '#D4D4D4' }}>{exp.title} • {exp.company}</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '16px', color: '#888888', fontSize: '0.8rem' }}>
                  {(exp.bullets || []).map((b: string, bIdx: number) => (
                    <li key={bIdx} style={{ marginBottom: '4px' }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Optimized Document */}
        <div
          className="card-dark"
          style={{
            background: '#0D0D0D',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E1E1E', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Optimized Resume (Verified Facts)
              </h4>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              Ready for ATS Screening
            </span>
          </div>

          {/* Contact */}
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
              {optimizedResume.contact?.name || 'Candidate Name'}
            </h5>
            <p style={{ fontSize: '0.78rem', color: '#10B981', margin: 0 }}>
              {[optimizedResume.contact?.location, optimizedResume.contact?.email, optimizedResume.contact?.phone, optimizedResume.contact?.linkedin].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* Summary */}
          {optimizedResume.summary && (
            <div style={{ marginBottom: '16px', background: 'rgba(16, 185, 129, 0.05)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
              <span style={{ fontSize: '0.74rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Summary
              </span>
              <p style={{ fontSize: '0.82rem', color: '#FFFFFF', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                {optimizedResume.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.74rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Experience
            </span>
            {(optimizedResume.experience || []).map((exp: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>{exp.title} • {exp.company}</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '16px', color: '#E0E0E0', fontSize: '0.82rem' }}>
                  {(exp.bullets || []).map((b: string, bIdx: number) => (
                    <li key={bIdx} style={{ marginBottom: '4px' }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Skills */}
          {optimizedResume.skills?.technical?.length > 0 && (
            <div>
              <span style={{ fontSize: '0.74rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Skills Matrix
              </span>
              <p style={{ fontSize: '0.8rem', color: '#D4D4D4', margin: 0 }}>
                {[...(optimizedResume.skills.technical || []), ...(optimizedResume.skills.tools || [])].join(' • ')}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .compare-diff-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
