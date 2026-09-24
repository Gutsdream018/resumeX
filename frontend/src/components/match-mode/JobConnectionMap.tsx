import React from 'react';
import { RequirementMatchItem } from './types';
import { Target, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface JobConnectionMapProps {
  requirements: RequirementMatchItem[];
  jobTitle?: string;
  onOptimizeSection?: (section: string, item: string) => void;
}

export const JobConnectionMap: React.FC<JobConnectionMapProps> = ({
  requirements,
  jobTitle = 'Target Job',
  onOptimizeSection,
}) => {
  if (!requirements || requirements.length === 0) return null;

  const displayReqs = requirements.slice(0, 6);

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
      <div style={{ marginBottom: '16px' }}>
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
          <Target size={18} color="#E50920" />
          <span>Job ↔ Resume Intelligence Connection Map</span>
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#8E8E8E', marginTop: '4px', margin: 0 }}>
          Visual mapping connecting target role qualifications directly to candidate citations and gap evidence.
        </p>
      </div>

      {/* Connection Nodes Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {displayReqs.map((req, idx) => {
          const isMatched = req.status === 'MATCHED';
          const isPartial = req.status === 'PARTIAL';
          const lineColor = isMatched ? '#10B981' : isPartial ? '#FACC15' : '#EF4444';

          return (
            <div
              key={req.id || idx}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1fr) auto minmax(220px, 1.4fr)',
                alignItems: 'center',
                gap: '12px',
                background: '#141414',
                border: '1px solid #222',
                borderRadius: '10px',
                padding: '10px 16px',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
            >
              {/* Left: Job Requirement */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {req.requirementText}
                </span>
              </div>

              {/* Middle: Connection Connector Line & Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '2px', background: lineColor }} />
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: `${lineColor}18`,
                    border: `1px solid ${lineColor}40`,
                    color: lineColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {req.status}
                </span>
                <div style={{ width: '24px', height: '2px', background: lineColor }} />
              </div>

              {/* Right: Resume Evidence Citation or Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    color: isMatched ? '#DDD' : isPartial ? '#EAB308' : '#888',
                    fontStyle: isMatched ? 'normal' : 'italic',
                    lineHeight: 1.4,
                  }}
                >
                  {req.evidenceQuote
                    ? `"${req.evidenceQuote.length > 55 ? req.evidenceQuote.substring(0, 55) + '...' : req.evidenceQuote}"`
                    : 'No supporting evidence found in resume'}
                </span>

                {!isMatched && onOptimizeSection && (
                  <button
                    type="button"
                    onClick={() => onOptimizeSection(req.suggestedSection || 'skills', req.requirementText)}
                    style={{
                      background: 'rgba(229, 9, 32, 0.15)',
                      border: '1px solid rgba(229, 9, 32, 0.4)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      color: '#FFF',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Optimize
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
