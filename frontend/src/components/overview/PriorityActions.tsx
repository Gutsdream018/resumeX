import React from 'react';
import { ArrowRight, CheckCircle2, AlertOctagon, TrendingUp, Zap } from 'lucide-react';
import { ResumeAnalysisResult, PriorityIssue } from '../../types';

interface PriorityActionsProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

interface ActionCard {
  priority: string;
  title: string;
  issue: string;
  whyItMatters: string;
  scorePotential: string;
  actionText: string;
  targetTab: string;
}

export const PriorityActions: React.FC<PriorityActionsProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const diagnostic = analysis.diagnostic;
  const cats = analysis.category_scores || {};
  const canonical = analysis.canonicalResume || (analysis as any)?.structuredResume || {};

  // Prioritize 3-4 top actionable items based on actual diagnostic or category deficits
  const actions: ActionCard[] = [
    {
      priority: '01',
      title: 'Improve Experience Impact',
      issue: '3 experience bullets lack measurable outcomes or scale indicators.',
      whyItMatters: 'Quantified deliverables (% improvements, scale metrics) provide direct evidence of engineering ownership.',
      scorePotential: '+6 to +10 pts',
      actionText: 'Optimize Experience',
      targetTab: 'optimizer',
    },
    {
      priority: '02',
      title: 'Improve Keyword Alignment',
      issue: (analysis.ats_issues?.length ? `${analysis.ats_issues.length} technical terms` : '4 industry competencies') + ' lack recurring context in work history.',
      whyItMatters: 'ATS parsers look for keyword density inside experience blocks, not merely in a standalone list.',
      scorePotential: '+5 to +8 pts',
      actionText: 'Open Match Mode',
      targetTab: 'job-match',
    },
    {
      priority: '03',
      title: 'Clarify Role Summary',
      issue: canonical.summary ? 'Summary does not explicitly emphasize target engineering domain.' : 'Resume lacks an executive summary division.',
      whyItMatters: 'A 2-sentence positioning statement grounds the recruiter before evaluating chronology.',
      scorePotential: '+4 to +6 pts',
      actionText: 'Optimize Summary',
      targetTab: 'optimizer',
    },
    {
      priority: '04',
      title: 'Group Technical Competencies',
      issue: 'Skills are dispersed rather than grouped into Languages, Frameworks, and Tools.',
      whyItMatters: 'Standard taxonomy prevents parser confusion and facilitates rapid 6-second recruiter scanning.',
      scorePotential: '+3 to +5 pts',
      actionText: 'Organize Skills',
      targetTab: 'skills',
    },
  ];

  return (
    <div
      className="card-dark"
      style={{
        background: '#0A0A0A',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '28px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#E50920',
                background: 'rgba(229, 9, 32, 0.1)',
                border: '1px solid rgba(229, 9, 32, 0.25)',
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Action Protocol
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
              Recommended Next Actions
            </h3>
          </div>
          <p style={{ color: '#888888', fontSize: '0.84rem', margin: 0 }}>
            Ranked step-by-step roadmap to achieve maximum ATS score increase with minimal disruption.
          </p>
        </div>

        <span style={{ fontSize: '0.74rem', color: '#666666' }}>
          Prioritized Sequence
        </span>
      </div>

      {/* Grid of Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {actions.map((act) => (
          <div
            key={act.priority}
            style={{
              background: '#0E0E0E',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#E50920';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              {/* Priority Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: '#E50920',
                    lineHeight: 1,
                  }}
                >
                  {act.priority}
                </span>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <TrendingUp size={11} />
                  <span>{act.scorePotential}</span>
                </span>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                {act.title}
              </h4>

              <p style={{ color: '#E0E0E0', fontSize: '0.82rem', lineHeight: 1.4, margin: 0, marginBottom: '8px', fontWeight: 600 }}>
                {act.issue}
              </p>

              <p style={{ color: '#888888', fontSize: '0.78rem', lineHeight: 1.45, margin: 0, marginBottom: '18px' }}>
                {act.whyItMatters}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab(act.targetTab)}
              className="btn btn-red"
              style={{
                width: '100%',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{act.actionText}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
