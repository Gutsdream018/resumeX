import React from 'react';
import {
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  GraduationCap,
  Award,
  Trophy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { SectionHealthScore } from '../../types';

interface OptimizerSectionNavProps {
  sectionHealth: SectionHealthScore[];
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  summary: <FileText size={15} />,
  experience: <Briefcase size={15} />,
  projects: <Layers size={15} />,
  skills: <Sparkles size={15} />,
  education: <GraduationCap size={15} />,
  certifications: <Award size={15} />,
  achievements: <Trophy size={15} />,
};

export const OptimizerSectionNav: React.FC<OptimizerSectionNavProps> = ({
  sectionHealth,
  activeSection,
  onSelectSection,
}) => {
  const defaultSections: SectionHealthScore[] = [
    { section: 'summary', name: 'Professional Summary', score: 65, issueCount: 1, status: 'needs_improvement' },
    { section: 'experience', name: 'Work Experience', score: 55, issueCount: 3, status: 'needs_improvement' },
    { section: 'projects', name: 'Technical Projects', score: 45, issueCount: 2, status: 'needs_improvement' },
    { section: 'skills', name: 'Technical Skills', score: 50, issueCount: 2, status: 'needs_improvement' },
    { section: 'education', name: 'Education', score: 80, issueCount: 0, status: 'optimal' },
    { section: 'certifications', name: 'Certifications', score: 70, issueCount: 0, status: 'optimal' },
    { section: 'achievements', name: 'Key Achievements', score: 40, issueCount: 1, status: 'needs_improvement' },
  ];

  const sectionsToRender = sectionHealth.length > 0 ? sectionHealth : defaultSections;

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#E31B2B';
  };

  return (
    <div
      style={{
        background: '#0D0D0D',
        border: '1px solid #242424',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ padding: '0 8px 8px', borderBottom: '1px solid #1E1E1E', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Resume Sections
        </span>
      </div>

      {sectionsToRender.map((sec) => {
        const isSelected = activeSection === sec.section;
        const icon = SECTION_ICONS[sec.section] || <FileText size={15} />;
        return (
          <button
            key={sec.section}
            onClick={() => onSelectSection(sec.section)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              background: isSelected ? '#1A1A1A' : 'transparent',
              border: `1px solid ${isSelected ? '#E31B2B' : 'transparent'}`,
              color: isSelected ? '#FFFFFF' : '#A3A3A3',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: isSelected ? 700 : 500,
              transition: 'all 0.15s ease',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = '#141414';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#A3A3A3';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: isSelected ? '#E31B2B' : '#737373' }}>{icon}</span>
              <span>{sec.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {sec.issueCount > 0 ? (
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#FF99A1',
                    background: 'rgba(227, 27, 43, 0.12)',
                    border: '1px solid rgba(227, 27, 43, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}
                >
                  {sec.issueCount} {sec.issueCount === 1 ? 'issue' : 'issues'}
                </span>
              ) : (
                <Check size={13} color="#10B981" />
              )}
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: getScoreColor(sec.score), minWidth: '22px', textAlign: 'right' }}>
                {sec.score}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
