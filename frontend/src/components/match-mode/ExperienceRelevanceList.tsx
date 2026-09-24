import React from 'react';
import { RelevantExperienceItem } from './types';
import { Briefcase, Award, ArrowUpRight, Sparkles } from 'lucide-react';

interface ExperienceRelevanceListProps {
  experiences: RelevantExperienceItem[];
  onOptimizeSection?: (section: string, keyword: string) => void;
}

export const ExperienceRelevanceList: React.FC<ExperienceRelevanceListProps> = ({
  experiences,
  onOptimizeSection,
}) => {
  if (!experiences || experiences.length === 0) return null;

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
          <Briefcase size={18} color="#E31B2B" />
          <span>Most Relevant Experience & Projects</span>
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#8E8E8E', marginTop: '4px', margin: 0 }}>
          Ranked purely by technical alignment to this target job description (not a candidate rating).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {experiences.map((exp, idx) => {
          const scoreColor =
            exp.relevanceScore >= 80 ? '#4ADE80' : exp.relevanceScore >= 60 ? '#FACC15' : '#A3A3A3';

          return (
            <div
              key={exp.id || idx}
              style={{
                background: '#161616',
                border: '1px solid #262626',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#444')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#262626')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#8E8E8E',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Rank #{idx + 1}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      border: `1px solid ${scoreColor}40`,
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: scoreColor }}>
                      {exp.relevanceScore}%
                    </span>
                    <span style={{ fontSize: '0.66rem', color: '#888' }}>Relevance</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                  {exp.title}
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#A1A1AA', marginBottom: '8px' }}>
                  {exp.companyOrContext}
                </div>

                <p style={{ fontSize: '0.78rem', color: '#D4D4D4', lineHeight: 1.45, margin: '0 0 10px' }}>
                  {exp.evidenceSummary}
                </p>

                {/* Matching keyword tags */}
                {exp.matchingKeywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {exp.matchingKeywords.map((kw, kIdx) => (
                      <span
                        key={kIdx}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          background: 'rgba(227, 27, 43, 0.12)',
                          color: '#FF7B88',
                          border: '1px solid rgba(227, 27, 43, 0.25)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                        }}
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {onOptimizeSection && (
                <button
                  type="button"
                  onClick={() => onOptimizeSection('experience', exp.title)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: '#E31B2B',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: '4px',
                  }}
                >
                  <span>Strengthen in Optimizer</span>
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
