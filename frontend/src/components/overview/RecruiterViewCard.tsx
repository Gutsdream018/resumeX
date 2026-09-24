import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../../types';
import { Eye, ShieldAlert, CheckCircle2, ArrowRight, Clock, UserCheck } from 'lucide-react';

interface RecruiterViewCardProps {
  analysis: ResumeAnalysisResult;
  onOptimize?: () => void;
}

export const RecruiterViewCard: React.FC<RecruiterViewCardProps> = ({ analysis, onOptimize }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const rawAny = analysis as any;
  const roleSignal =
    rawAny?.extractedData?.experience?.[0]?.title ||
    analysis.canonicalResume?.experience?.[0]?.title ||
    rawAny?.summaryAnalysis?.detectedRole ||
    'Engineering & Technical Candidate';

  const strongSkills = [
    ...(rawAny?.skillsAnalysis?.technical?.slice(0, 3) || []),
    ...(analysis.canonicalResume?.skills?.technical?.slice(0, 3) || []),
    ...(rawAny?.extractedData?.skills?.slice(0, 3) || ['AutoCAD', 'CATIA', 'Engineering']),
  ].slice(0, 3);

  const potentialWeaknesses = [
    'Summary lacks explicit metrics (percentage improvements or throughput scale)',
    'Experience entries benefit from Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]")',
  ];

  return (
    <div
      className="card-dark"
      style={{
        background: '#0D0D0D',
        border: '1px solid #242424',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(229, 9, 32, 0.15)', border: '1px solid rgba(229, 9, 32, 0.3)' }}>
            <Eye size={18} color="#E50920" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Recruiter 6-Second First Impression Simulation
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#888888', margin: '2px 0 0' }}>
              Simulates cognitive scanning hierarchy and immediate standout signals during recruiter screening.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#CCC',
            fontSize: '0.74rem',
            cursor: 'pointer',
          }}
        >
          {isOpen ? 'Collapse Simulation' : 'Expand Details'}
        </button>
      </div>

      {/* Grid of First Impression Signals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {/* Role Signal */}
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '14px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            1. Role Signal Detected
          </span>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>
            {roleSignal}
          </div>
          <p style={{ fontSize: '0.74rem', color: '#999', margin: '4px 0 0' }}>
            Clear title anchoring candidate seniority and primary technical domain.
          </p>
        </div>

        {/* Strong Signals */}
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '14px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            2. Strong Immediate Signals
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {strongSkills.map((sk, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ADE80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                ✓ {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Potential Friction */}
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '14px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            3. Potential Friction Points
          </span>
          <p style={{ fontSize: '0.74rem', color: '#DDD', margin: '6px 0 0', lineHeight: 1.45 }}>
            {potentialWeaknesses[0]}
          </p>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isOpen && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid #222',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#BBB' }}>
            <Clock size={14} color="#E50920" />
            <span>
              <strong>Visual Hierarchy Assessment:</strong> Recruiter attention flows Top Summary → Technical Skills → Latest Role → Education.
            </span>
          </div>

          {onOptimize && (
            <button
              type="button"
              onClick={onOptimize}
              className="btn btn-red"
              style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.76rem', fontWeight: 700, marginTop: '4px' }}
            >
              <span>Polish in Resume Optimizer</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
