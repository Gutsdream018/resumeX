import React from 'react';
import { X, GitCompare, RotateCcw, ArrowRight, Check } from 'lucide-react';
import { VersionSnapshot } from './VersionHistoryModal';
import { CanonicalResume } from '../../types';

interface ResumeCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseVersion: VersionSnapshot;
  currentVersion: VersionSnapshot;
  onRestoreBaseVersion: (ver: VersionSnapshot) => void;
}

export const ResumeCompareModal: React.FC<ResumeCompareModalProps> = ({
  isOpen,
  onClose,
  baseVersion,
  currentVersion,
  onRestoreBaseVersion,
}) => {
  if (!isOpen) return null;

  const scoreDelta = currentVersion.atsScore - baseVersion.atsScore;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '1100px',
          maxWidth: '96vw',
          height: '80vh',
          backgroundColor: '#121212',
          border: '1px solid #282828',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(227, 27, 43, 0.25)',
          color: '#F5F5F5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(227, 27, 43, 0.15)',
                border: '1px solid rgba(227, 27, 43, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E31B2B',
              }}
            >
              <GitCompare size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>
                Version Comparison
              </div>
              <div style={{ fontSize: '0.74rem', color: '#888' }}>
                Compare earlier revision against current working version
              </div>
            </div>
          </div>

          {/* Center Score Comparison */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: '#1E1E1E',
                borderRadius: '6px',
                border: '1px solid #333',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: '#888' }}>Base: </span>
              <strong>{baseVersion.atsScore}/100</strong>
            </div>
            <ArrowRight size={14} color="#888" />
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: '#1E1E1E',
                borderRadius: '6px',
                border: '1px solid #333',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: '#888' }}>Current: </span>
              <strong style={{ color: currentVersion.atsScore >= 75 ? '#10B981' : '#F59E0B' }}>
                {currentVersion.atsScore}/100
              </strong>
            </div>
            {scoreDelta !== 0 && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: scoreDelta > 0 ? '#10B981' : '#EF4444',
                  backgroundColor: scoreDelta > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
            )}
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

        {/* Modal Body: Side-by-Side View */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0, overflowY: 'auto' }}>
          {/* Left: Base Version */}
          <div style={{ padding: '20px', borderRight: '1px solid #222', backgroundColor: '#0D0D0D', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                  Left Version (Baseline)
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFF' }}>
                  {baseVersion.label}
                </div>
              </div>
              <button
                onClick={() => {
                  onRestoreBaseVersion(baseVersion);
                  onClose();
                }}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#DDD',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={11} />
                <span>Restore This</span>
              </button>
            </div>

            {/* Base Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
              {/* Summary */}
              {baseVersion.resume.summary && (
                <div style={{ backgroundColor: '#141414', padding: '10px', borderRadius: '6px', border: '1px solid #242424' }}>
                  <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                    Summary
                  </div>
                  <div style={{ color: '#AAA', lineHeight: 1.4 }}>
                    {baseVersion.resume.summary}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(baseVersion.resume.experience || []).map((exp, i) => (
                <div key={i} style={{ backgroundColor: '#141414', padding: '10px', borderRadius: '6px', border: '1px solid #242424' }}>
                  <div style={{ fontWeight: 700, color: '#DDD' }}>
                    {exp.title} • {exp.company}
                  </div>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#888' }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ marginBottom: '2px' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Current Version */}
          <div style={{ padding: '20px', backgroundColor: '#101010', overflowY: 'auto' }}>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase', fontWeight: 700 }}>
                Right Version (Current)
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFF' }}>
                {currentVersion.label}
              </div>
            </div>

            {/* Current Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
              {/* Summary */}
              {currentVersion.resume.summary && (
                <div style={{ backgroundColor: '#161616', padding: '10px', borderRadius: '6px', border: '1px solid #2E2E2E' }}>
                  <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                    Summary
                  </div>
                  <div style={{ color: '#E0E0E0', lineHeight: 1.4 }}>
                    {currentVersion.resume.summary}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(currentVersion.resume.experience || []).map((exp, i) => (
                <div key={i} style={{ backgroundColor: '#161616', padding: '10px', borderRadius: '6px', border: '1px solid #2E2E2E' }}>
                  <div style={{ fontWeight: 700, color: '#FFF' }}>
                    {exp.title} • {exp.company}
                  </div>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#BBB' }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ marginBottom: '2px' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 22px',
            backgroundColor: '#161616',
            borderTop: '1px solid #242424',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#E31B2B',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
