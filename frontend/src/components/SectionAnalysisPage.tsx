import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../types';

interface SectionAnalysisPageProps {
  analysis: ResumeAnalysisResult;
  onNavigateSuggestions?: () => void;
}

interface SectionItem {
  id: string;
  name: string;
  score: number;
  status: 'Optimized' | 'Needs Improvement' | 'Critical Flaw' | 'Good';
  issue: string;
  recommendations: string[];
}

export const SectionAnalysisPage: React.FC<SectionAnalysisPageProps> = ({
  analysis,
  onNavigateSuggestions,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>('projects');

  const rawAny = analysis as any;
  const scoreObj = rawAny.score || {};
  const cats = analysis.category_scores || {};

  const getSectionStatus = (sc: number): SectionItem['status'] => {
    if (sc >= 88) return 'Optimized';
    if (sc >= 75) return 'Good';
    if (sc >= 60) return 'Needs Improvement';
    return 'Critical Flaw';
  };

  const expScore = scoreObj.experience ?? cats.experience ?? 75;
  const projScore = scoreObj.projects ?? 75;
  const skillsScore = scoreObj.keywordRelevance ?? cats.skills ?? 80;
  const eduScore = scoreObj.education ?? 85;
  const achScore = scoreObj.achievements ?? cats.impact ?? 70;
  const contactScore = scoreObj.atsCompatibility ?? cats.ats ?? 85;
  const formatScore = scoreObj.formatting ?? cats.formatting ?? 85;

  const sections: SectionItem[] = [
    {
      id: 'contact',
      name: 'Contact Information',
      score: contactScore,
      status: getSectionStatus(contactScore),
      issue: contactScore >= 80 ? 'Phone, email, and location verified.' : 'Missing essential contact information or links.',
      recommendations: [
        'Ensure LinkedIn profile matches dates listed on your resume exactly.',
        'Keep GitHub profile link active with updated pinned repositories.',
      ],
    },
    {
      id: 'summary',
      name: 'Professional Summary',
      score: cats.content ?? 78,
      status: getSectionStatus(cats.content ?? 78),
      issue: 'Could be condensed to 3 impactful lines focusing on core architectural strengths.',
      recommendations: [
        'Lead with your primary title and years of experience immediately.',
        'Highlight 2 standout achievements ($ savings, system scale) directly in line 2.',
      ],
    },
    {
      id: 'experience',
      name: 'Work Experience',
      score: expScore,
      status: getSectionStatus(expScore),
      issue: expScore >= 80 ? 'Strong role descriptions with active verbs.' : 'Several bullet points describe tasks rather than quantifiable business impact.',
      recommendations: [
        'Apply Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
        'Add quantitative metrics (user counts, latency reductions, team sizes) to each role.',
      ],
    },
    {
      id: 'projects',
      name: 'Projects',
      score: projScore,
      status: getSectionStatus(projScore),
      issue: projScore >= 80 ? 'Projects clearly outline technical stack and outcomes.' : 'Project descriptions benefit from quantifiable outcomes and production context.',
      recommendations: [
        'Specify active daily users, performance metrics, or test coverage benchmarks.',
        'Mention the complete cloud deployment pipeline (e.g. AWS, Docker, Vercel).',
        'Provide direct hyperlinks to live demos or public repositories.',
      ],
    },
    {
      id: 'skills',
      name: 'Skills & Technologies',
      score: skillsScore,
      status: getSectionStatus(skillsScore),
      issue: skillsScore >= 80 ? 'Broad technology coverage aligned with target roles.' : 'Add key modern cloud and container orchestration keywords.',
      recommendations: [
        'Group skills into logical categories (Languages, Frameworks, Cloud, Databases).',
        'Place highest-priority technologies for your target job first in the list.',
      ],
    },
    {
      id: 'education',
      name: 'Education',
      score: eduScore,
      status: getSectionStatus(eduScore),
      issue: eduScore >= 80 ? 'Cleanly formatted with degree and institution.' : 'Ensure complete degree name and graduation dates are visible.',
      recommendations: [
        'Omit GPA if graduating > 3 years ago; focus on industry impact instead.',
      ],
    },
    {
      id: 'certifications',
      name: 'Certifications',
      score: formatScore,
      status: getSectionStatus(formatScore),
      issue: 'Verify credential IDs and expiration dates are clearly listed.',
      recommendations: [
        'Add issuer name and verifiable credential URL.',
        'Prioritize active industry certifications (AWS Solutions Architect, CKA).',
      ],
    },
    {
      id: 'achievements',
      name: 'Achievements',
      score: achScore,
      status: getSectionStatus(achScore),
      issue: achScore >= 80 ? 'Measurable metrics and milestones captured.' : 'Achievements are buried within experience bullets instead of highlighted.',
      recommendations: [
        'Create a dedicated callout for hackathon wins, patents, or company excellence awards.',
      ],
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (status: SectionItem['status'], score: number) => {
    if (score >= 90) {
      return (
        <span className="badge badge-green">
          <CheckCircle2 size={12} /> {status}
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="badge badge-amber">
          <AlertTriangle size={12} /> {status}
        </span>
      );
    }
    return (
      <span className="badge badge-red">
        <AlertOctagon size={12} /> {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Resume Section Analysis
        </h2>
        <p style={{ color: '#9A9A9A', fontSize: '0.9rem' }}>
          Section-by-section breakdown evaluating completeness, scoring, issues, and targeted fixes.
        </p>
      </div>

      {/* Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((sec) => {
          const isExpanded = expandedId === sec.id;
          return (
            <div
              key={sec.id}
              className="card-dark"
              style={{
                background: '#111111',
                border: isExpanded ? '1px solid #383838' : '1px solid #242424',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Accordion Bar */}
              <div
                onClick={() => toggleExpand(sec.id)}
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: '#0D0D0D',
                      border: '1px solid #242424',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: sec.score >= 85 ? '#FFFFFF' : sec.score >= 75 ? '#F59E0B' : '#E31B2B',
                    }}
                  >
                    {sec.score}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                      {sec.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#737373' }}>
                        {sec.score} / 100
                      </span>
                      <span>•</span>
                      {getStatusBadge(sec.status, sec.score)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ color: '#737373' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0 24px 24px',
                    borderTop: '1px solid #1C1C1C',
                    paddingTop: '18px',
                    background: '#0D0D0D',
                  }}
                >
                  {/* Issue description */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                      Detected Status & Issues:
                    </span>
                    <p style={{ fontSize: '0.88rem', color: '#F5F5F5', lineHeight: 1.5 }}>
                      {sec.issue}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div style={{ marginBottom: '18px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Key Recommendations:
                    </span>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {sec.recommendations.map((rec, i) => (
                        <li key={i} style={{ fontSize: '0.84rem', color: '#B3B3B3', lineHeight: 1.45 }}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Link */}
                  {onNavigateSuggestions && (
                    <button
                      onClick={onNavigateSuggestions}
                      className="btn btn-ghost-red"
                      style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                    >
                      <span>View Recommendations in AI Rewriter</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
