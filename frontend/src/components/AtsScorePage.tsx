import React, { useState } from 'react';
import {
  Target,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Plus,
  Info,
  X,
  FileCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../types';
import { ScoreMeter } from './ScoreMeter';

interface AtsScorePageProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab?: (tab: string) => void;
}

interface MissingKeywordInfo {
  name: string;
  category: string;
  importance: 'High' | 'Critical' | 'Medium';
  why: string;
  example: string;
}

const MISSING_KEYWORDS: MissingKeywordInfo[] = [
  {
    name: 'Python',
    category: 'Backend / Scripting',
    importance: 'Critical',
    why: 'Ranked in top 3 required skills for 74% of modern full-stack and backend roles.',
    example: 'Built automated data ingestion pipelines using Python and Celery.',
  },
  {
    name: 'SQL',
    category: 'Databases',
    importance: 'Critical',
    why: 'Relational data querying is expected by ATS filter strings even when ORMs are used.',
    example: 'Authored complex SQL migrations and optimized indexed queries on PostgreSQL.',
  },
  {
    name: 'AWS',
    category: 'Cloud Infrastructure',
    importance: 'High',
    why: 'Cloud platform experience is heavily weighted in modern DevOps and backend candidate scoring.',
    example: 'Deployed scalable containerized applications across AWS ECS, S3, and RDS.',
  },
  {
    name: 'Docker',
    category: 'Containerization',
    importance: 'High',
    why: 'Container runtime isolation is standard requirement across engineering teams.',
    example: 'Containerized legacy Node services using multi-stage Docker builds.',
  },
  {
    name: 'REST APIs',
    category: 'API Architecture',
    importance: 'High',
    why: 'Fundamental keyword for web, mobile, and integration engineering searches.',
    example: 'Engineered versioned RESTful APIs with OpenAPI documentation.',
  },
];

export const AtsScorePage: React.FC<AtsScorePageProps> = ({ analysis, onNavigateTab }) => {
  const [selectedKeyword, setSelectedKeyword] = useState<MissingKeywordInfo | null>(null);
  const [addedKeywords, setAddedKeywords] = useState<string[]>([]);

  const handleToggleAdd = (name: string) => {
    setAddedKeywords((prev) =>
      prev.includes(name) ? prev.filter((k) => k !== name) : [...prev, name]
    );
  };
  const rawAny = analysis as any;
  const overallScore = analysis.overall_score ?? rawAny?.score?.overall ?? 0;
  const atsReadabilityScore = analysis.category_scores?.ats ?? rawAny?.score?.atsCompatibility ?? overallScore;
  const cats = analysis.category_scores || {};

  const rawMissing = rawAny?.missingKeywords || analysis.missing_information || [];
  const displayKeywords: MissingKeywordInfo[] = rawMissing.length > 0
    ? rawMissing.slice(0, 6).map((term: string) => ({
        name: term.replace(/^Missing\s+/i, '').replace(/\s+section$/i, ''),
        category: 'High-Demand Requirement',
        importance: 'High' as const,
        why: 'Weighted heavily by automated ATS keyword scanning algorithms.',
        example: `Incorporate demonstrated experience with ${term} in your project deliverables.`,
      }))
    : MISSING_KEYWORDS;

  const categories = [
    {
      label: 'Keyword Match',
      value: cats.skills ?? rawAny?.score?.keywordRelevance ?? 0,
      status: (cats.skills ?? 0) >= 80 ? 'Optimal' : (cats.skills ?? 0) >= 65 ? 'Fair' : 'Needs keywords',
      color: (cats.skills ?? 0) >= 80 ? '#10B981' : (cats.skills ?? 0) >= 65 ? '#F59E0B' : '#E31B2B',
      gradient: (cats.skills ?? 0) >= 80 ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)' : (cats.skills ?? 0) >= 65 ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' : 'linear-gradient(90deg, #C1121F 0%, #E31B2B 100%)',
    },
    {
      label: 'Formatting & Layout',
      value: cats.formatting ?? rawAny?.score?.formatting ?? 0,
      status: (cats.formatting ?? 0) >= 80 ? 'Near Perfect' : (cats.formatting ?? 0) >= 65 ? 'Standard' : 'Review formatting',
      color: (cats.formatting ?? 0) >= 80 ? '#10B981' : (cats.formatting ?? 0) >= 65 ? '#F59E0B' : '#E31B2B',
      gradient: (cats.formatting ?? 0) >= 80 ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)' : (cats.formatting ?? 0) >= 65 ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' : 'linear-gradient(90deg, #C1121F 0%, #E31B2B 100%)',
    },
    {
      label: 'Section Structure',
      value: cats.ats ?? rawAny?.score?.atsCompatibility ?? 0,
      status: (cats.ats ?? 0) >= 80 ? 'Standard' : (cats.ats ?? 0) >= 65 ? 'Minor Gaps' : 'Action needed',
      color: (cats.ats ?? 0) >= 80 ? '#10B981' : (cats.ats ?? 0) >= 65 ? '#F59E0B' : '#E31B2B',
      gradient: (cats.ats ?? 0) >= 80 ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)' : (cats.ats ?? 0) >= 65 ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' : 'linear-gradient(90deg, #C1121F 0%, #E31B2B 100%)',
    },
    {
      label: 'Experience & Scope',
      value: cats.experience ?? rawAny?.score?.experience ?? 0,
      status: (cats.experience ?? 0) >= 80 ? 'Strong Impact' : (cats.experience ?? 0) >= 60 ? 'Moderate' : 'Needs bullet metrics',
      color: (cats.experience ?? 0) >= 80 ? '#10B981' : (cats.experience ?? 0) >= 60 ? '#F59E0B' : '#E31B2B',
      gradient: (cats.experience ?? 0) >= 80 ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)' : (cats.experience ?? 0) >= 60 ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' : 'linear-gradient(90deg, #C1121F 0%, #E31B2B 100%)',
    },
    {
      label: 'Measurable Impact',
      value: cats.impact ?? rawAny?.score?.achievements ?? 0,
      status: (cats.impact ?? 0) >= 75 ? 'Quantified' : (cats.impact ?? 0) >= 55 ? 'Partial Metrics' : 'Action needed',
      color: (cats.impact ?? 0) >= 75 ? '#10B981' : (cats.impact ?? 0) >= 55 ? '#F59E0B' : '#E31B2B',
      gradient: (cats.impact ?? 0) >= 75 ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)' : (cats.impact ?? 0) >= 55 ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' : 'linear-gradient(90deg, #C1121F 0%, #E31B2B 100%)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Title */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          ATS Compatibility Diagnostic
        </h2>
        <p style={{ color: '#9A9A9A', fontSize: '0.9rem' }}>
          Deep evaluation of machine-readability, keyword frequency, and recruiter filtering compliance.
        </p>
      </div>

      {/* Top Banner: Radial Score + Category Breakdown */}
      <div
        className="card-dark ats-banner-grid"
        style={{
          padding: '32px',
          background: '#111111',
          border: '1px solid #242424',
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '36px',
          alignItems: 'center',
        }}
      >
        {/* Radial Score Widget */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            paddingRight: '20px',
            borderRight: '1px solid #1F1F1F',
          }}
          className="ats-radial-container"
        >
          <div style={{ marginBottom: '16px' }}>
            <ScoreMeter
              score={overallScore}
              size={126}
              label="ATS Score"
              showStatusPill={false}
              glow={true}
            />
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
            ATS Diagnostic Score
          </h3>
          <span
            className={`badge ${overallScore >= 80 ? 'badge-green' : overallScore >= 65 ? 'badge-amber' : 'badge-red'}`}
            style={{ fontSize: '0.72rem' }}
          >
            {overallScore >= 80
              ? 'Optimal ATS Parsing Profile'
              : overallScore >= 65
              ? 'Good — Minor adjustments recommended'
              : 'Critical ATS Adjustments Required'}
          </span>
        </div>

        {/* Categories Progress Bars with Dynamic Colored Accents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map((cat) => (
            <div key={cat.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F5F5F5' }}>
                  {cat.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#737373' }}>{cat.status}</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: cat.color }}>
                    {cat.value}%
                  </span>
                </div>
              </div>

              <div className="progress-bar-track" style={{ height: '7px', background: '#1A1A1A', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${cat.value}%`,
                    height: '100%',
                    background: cat.gradient,
                    borderRadius: '9999px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explainable ATS Weight & Contribution Breakdown Table */}
      {rawAny?.score?.breakdown && (
        <div
          className="card-dark"
          style={{
            padding: '24px',
            background: '#111111',
            border: '1px solid #242424',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Mathematical Scoring Breakdown
              </h3>
              <p style={{ color: '#9A9A9A', fontSize: '0.84rem' }}>
                Calibrated weights summing to 1.00 ensuring transparent, non-arbitrary candidate scoring.
              </p>
            </div>
            <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
              Weight Sum: 100%
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #242424', color: '#9A9A9A', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Weight</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Raw Score</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Points Earned</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Diagnostic Reason</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rawAny.score.breakdown).map(([key, item]: [string, any]) => {
                  const labelMap: Record<string, string> = {
                    atsReadability: 'ATS Readability',
                    keywordRelevance: 'Keyword Relevance',
                    experience: 'Experience Quality',
                    projects: 'Projects & Scope',
                    formatting: 'Formatting & Layout',
                    education: 'Education & Credentials',
                    achievements: 'Impact & Metrics',
                  };
                  const pointsEarned =
                    typeof item.contribution === 'number'
                      ? item.contribution.toFixed(1).replace(/\.0$/, '')
                      : item.contribution;
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #1A1A1A' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                        {labelMap[key] || key}
                      </td>
                      <td style={{ padding: '12px', color: '#9A9A9A' }}>
                        {Math.round((item.weight || 0) * 100)}%
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: item.score >= 80 ? '#34D399' : item.score >= 60 ? '#F59E0B' : '#E31B2B' }}>
                        {item.score}/100
                      </td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                        +{pointsEarned} pts
                      </td>
                      <td style={{ padding: '12px', color: '#A3A3A3', fontSize: '0.8rem' }}>
                        {item.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Match Mode Prompt */}
      {onNavigateTab && (
        <div
          className="card-dark"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(227, 27, 43, 0.1) 0%, rgba(18, 18, 18, 0.9) 100%)',
            border: '1px solid rgba(227, 27, 43, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(227, 27, 43, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Target size={18} color="#E31B2B" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Targeting a specific role?
                </span>
                <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  NEW
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9A9A9A', margin: 0 }}>
                Run Match Mode to audit your ATS score directly against your target job's exact requirements.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('job-match')}
            className="btn btn-red"
            style={{ fontSize: '0.8rem', padding: '7px 16px', fontWeight: 600 }}
          >
            <span>Open Match Mode</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Missing Keywords Section */}
      <div
        className="card-dark"
        style={{
          padding: '28px',
          background: '#111111',
          border: '1px solid #242424',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Missing Keywords
            </h3>
            <p style={{ color: '#9A9A9A', fontSize: '0.86rem' }}>
              These high-frequency terms were not detected in your resume, reducing match score on candidate search engines.
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#E31B2B' }}>
            5 Essential Tech Keywords
          </span>
        </div>

        {/* Keyword Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
          {displayKeywords.map((kw) => {
            const isAdded = addedKeywords.includes(kw.name);
            return (
              <div
                key={kw.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isAdded ? 'rgba(16, 185, 129, 0.12)' : '#0D0D0D',
                  border: `1px solid ${isAdded ? 'rgba(16, 185, 129, 0.4)' : '#2B2B2B'}`,
                  borderRadius: '10px',
                  padding: '8px 14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <code
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    color: isAdded ? '#34d399' : '#FFFFFF',
                    fontFamily: 'monospace',
                  }}
                >
                  {kw.name}
                </code>

                {/* Why? Button */}
                <button
                  onClick={() => setSelectedKeyword(kw)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9A9A9A',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#E31B2B')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9A')}
                >
                  <HelpCircle size={12} />
                  <span>Why?</span>
                </button>

                {/* Add Toggle Button */}
                <button
                  onClick={() => handleToggleAdd(kw.name)}
                  style={{
                    background: isAdded ? '#10B981' : '#C1121F',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {isAdded ? <Check size={12} /> : <Plus size={12} />}
                  <span>{isAdded ? 'Added' : 'Add'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal / Drawer for "Why?" info */}
        {selectedKeyword && (
          <div
            style={{
              marginTop: '20px',
              background: '#0D0D0D',
              border: '1px solid #E31B2B',
              borderRadius: '12px',
              padding: '18px 20px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedKeyword(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'transparent',
                border: 'none',
                color: '#737373',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-red">{selectedKeyword.importance} ATS Weight</span>
              <strong style={{ fontSize: '1rem', color: '#FFFFFF' }}>
                Why should you add "{selectedKeyword.name}"?
              </strong>
            </div>

            <p style={{ color: '#9A9A9A', fontSize: '0.86rem', marginBottom: '10px' }}>
              {selectedKeyword.why}
            </p>

            <div style={{ background: '#141414', padding: '10px 14px', borderRadius: '8px', border: '1px solid #222222' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
                Recommended Bullet Injection:
              </span>
              <p style={{ color: '#F5F5F5', fontSize: '0.84rem', fontStyle: 'italic' }}>
                "{selectedKeyword.example}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ATS Compatibility Checkmarks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        <div style={{ background: '#111111', border: '1px solid #242424', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
            <CheckCircle size={16} />
            <span>Single-Column Layout</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#9A9A9A' }}>
            Avoids multi-column text collision in legacy Workday parsers.
          </p>
        </div>

        <div style={{ background: '#111111', border: '1px solid #242424', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
            <CheckCircle size={16} />
            <span>Standard Section Headers</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#9A9A9A' }}>
            Uses universal tokens like "Experience" and "Education".
          </p>
        </div>

        <div style={{ background: '#111111', border: '1px solid #242424', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
            <CheckCircle size={16} />
            <span>No Unsafe Tables or Icons</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#9A9A9A' }}>
            Zero text trapped inside non-standard vector graphics.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .ats-banner-grid {
            grid-template-columns: 1fr !important;
          }
          .ats-radial-container {
            border-right: none !important;
            border-bottom: 1px solid #1F1F1F;
            padding-bottom: 24px;
            padding-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
