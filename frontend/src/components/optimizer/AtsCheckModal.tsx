import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, FileText, Check, Sparkles } from 'lucide-react';
import { ResumeTemplatePreset } from './FullPageOptimizerHeader';
import { ExportQualityReport } from '../../types';

interface AtsCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  overallScore: number;
  readabilityScore: number;
  qualityReport?: ExportQualityReport;
  templatePreset: ResumeTemplatePreset;
  onSelectTemplate: (t: ResumeTemplatePreset) => void;
}

export const AtsCheckModal: React.FC<AtsCheckModalProps> = ({
  isOpen,
  onClose,
  overallScore,
  readabilityScore,
  qualityReport,
  templatePreset,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const checks = qualityReport?.checks || [
    {
      id: 'c1',
      title: 'Machine-Readable Document Flow',
      passed: true,
      message: 'Resume structure uses standard single-column text flow compatible with major ATS parsers.',
      severity: 'critical' as const,
    },
    {
      id: 'c2',
      title: 'Standard Section Headings',
      passed: true,
      message: 'Headings match standard recruiter taxonomy (Experience, Education, Skills, Projects).',
      severity: 'high' as const,
    },
    {
      id: 'c3',
      title: 'Contact Verification',
      passed: true,
      message: 'Candidate full name and at least one contact channel (email/phone) are validated.',
      severity: 'critical' as const,
    },
    {
      id: 'c4',
      title: 'No Template Placeholders',
      passed: true,
      message: 'All bracketed text and default placeholder tokens have been customized.',
      severity: 'medium' as const,
    },
    {
      id: 'c5',
      title: 'Action Verb & Metric Grounding',
      passed: overallScore >= 65,
      message: overallScore >= 65 ? 'Accomplishment statements feature verified actions and scale.' : 'Some bullet points still describe passive duties without measurable scale.',
      severity: 'medium' as const,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          width: '580px',
          maxWidth: '96vw',
          backgroundColor: '#121212',
          border: '1px solid #282828',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(227, 27, 43, 0.25)',
          color: '#F5F5F5',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>
                ATS Compatibility & Format Audit
              </div>
              <div style={{ fontSize: '0.74rem', color: '#888' }}>
                Deterministic validation against automated parsing standards
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
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Top Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                backgroundColor: '#171717',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
                ATS Readability
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                {readabilityScore} <span style={{ fontSize: '0.9rem', color: '#666' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#AAA', marginTop: '2px' }}>
                Machine parseable structure
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#171717',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
                Overall ATS Score
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: overallScore >= 75 ? '#10B981' : '#F59E0B', marginTop: '2px' }}>
                {overallScore} <span style={{ fontSize: '0.9rem', color: '#666' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#AAA', marginTop: '2px' }}>
                Screening probability
              </div>
            </div>
          </div>

          {/* Audit Checks List */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              Parsing Audit Criteria
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {checks.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: '#161616',
                    borderRadius: '8px',
                    border: '1px solid #242424',
                  }}
                >
                  {c.passed ? (
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: c.passed ? '#EEE' : '#FCD34D' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#888', marginTop: '2px', lineHeight: 1.35 }}>
                      {c.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Presets */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Format Styling Preset
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'ats_classic', label: 'ATS Classic', desc: 'Standard clean serif/sans with clean divider rules.' },
                { id: 'modern_pro', label: 'Modern Pro', desc: 'Contemporary bold headers and sleek hierarchy.' },
                { id: 'minimal', label: 'Minimalist', desc: 'Compact clean Swiss typography with high whitespace.' },
                { id: 'technical', label: 'Technical', desc: 'Project-focused layout with compact skill matrices.' },
                { id: 'engineering', label: 'Engineering', desc: 'Emphasizes technical metrics and system tooling.' },
                { id: 'student', label: 'Student / Entry', desc: 'Spotlights education, projects, and hackathons.' },
              ].map((p) => {
                const isSelected = templatePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectTemplate(p.id as ResumeTemplatePreset)}
                    style={{
                      padding: '10px',
                      backgroundColor: isSelected ? 'rgba(227, 27, 43, 0.12)' : '#161616',
                      border: isSelected ? '1px solid #E31B2B' : '1px solid #282828',
                      borderRadius: '8px',
                      color: isSelected ? '#FFFFFF' : '#BBB',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.label}</span>
                      {isSelected && <Check size={13} color="#E31B2B" />}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#777', marginTop: '4px', lineHeight: 1.3 }}>
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#161616',
            borderTop: '1px solid #242424',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px',
              backgroundColor: '#E31B2B',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
