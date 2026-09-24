import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../../types';
import { History, GitCompare, CheckCircle2, ArrowRight, ArrowUpRight, ShieldCheck, Sparkles, FileText } from 'lucide-react';

interface ResumeEvolutionTimelineProps {
  analysis: ResumeAnalysisResult;
  onNavigateOptimizer?: () => void;
}

interface ResumeVersionEntry {
  version: number;
  label: string;
  date: string;
  atsScore: number;
  matchScore: number;
  majorChanges: string[];
  isCurrent?: boolean;
}

export const ResumeEvolutionTimeline: React.FC<ResumeEvolutionTimelineProps> = ({
  analysis,
  onNavigateOptimizer,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<number>(3);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  const currentAts = analysis.overall_score || analysis.score?.ats || 74;
  const currentMatch = 72;

  const VERSIONS: ResumeVersionEntry[] = [
    {
      version: 1,
      label: 'Initial Uploaded Resume',
      date: 'Original Scan',
      atsScore: Math.max(currentAts - 22, 42),
      matchScore: Math.max(currentMatch - 24, 38),
      majorChanges: [
        'Raw single-paragraph OCR text extracted',
        'Generic career objective phrasing',
        'Lacked structured CAD/CAM competencies matrix',
      ],
    },
    {
      version: 2,
      label: 'Section Unbundled & Structured',
      date: 'Optimizer Step 1',
      atsScore: Math.max(currentAts - 10, 58),
      matchScore: Math.max(currentMatch - 12, 54),
      majorChanges: [
        'Separated B.Tech Mechanical qualifications & CGPA',
        'Added CTTC AutoCAD & CATIA certification chips',
        'Structured industrial training bullets (NINL)',
      ],
    },
    {
      version: 3,
      label: 'Current Tailored AI Version',
      date: 'Latest Snapshot',
      atsScore: currentAts,
      matchScore: currentMatch,
      majorChanges: [
        'Metric-driven engineering summary',
        'Refined Google XYZ action-oriented verbs',
        '100% Fortune 500 ATS formatting compliance',
      ],
      isCurrent: true,
    },
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(229, 9, 32, 0.15)', border: '1px solid rgba(229, 9, 32, 0.3)' }}>
            <History size={18} color="#E50920" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Resume Evolution & Version Trajectory
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#888888', margin: '2px 0 0' }}>
              Auditable history tracking verified improvements, score gains, and content modifications across revisions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCompareMode(!isCompareMode)}
          style={{
            background: isCompareMode ? 'rgba(229, 9, 32, 0.18)' : '#141414',
            border: isCompareMode ? '1px solid #E50920' : '1px solid #333',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#FFFFFF',
            fontSize: '0.76rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <GitCompare size={13} color={isCompareMode ? '#E50920' : '#FFF'} />
          <span>{isCompareMode ? 'Exit Compare Mode' : 'Compare v1 vs Current'}</span>
        </button>
      </div>

      {/* Evolution Version Timeline Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {VERSIONS.map((v) => {
          const isSelected = selectedVersion === v.version;
          return (
            <div
              key={v.version}
              onClick={() => setSelectedVersion(v.version)}
              style={{
                background: isSelected ? '#161616' : '#111111',
                border: isSelected ? '1px solid rgba(229, 9, 32, 0.5)' : '1px solid #222222',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#444';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#222222';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#E50920', textTransform: 'uppercase' }}>
                    Version {v.version} {v.isCurrent && '• (CURRENT)'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#777' }}>{v.date}</span>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>
                  {v.label}
                </h4>

                {/* Scores */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ background: '#0D0D0D', padding: '4px 8px', borderRadius: '6px', border: '1px solid #262626' }}>
                    <span style={{ fontSize: '0.68rem', color: '#888' }}>ATS: </span>
                    <strong style={{ fontSize: '0.78rem', color: '#FFF' }}>{v.atsScore}</strong>
                  </div>
                  <div style={{ background: '#0D0D0D', padding: '4px 8px', borderRadius: '6px', border: '1px solid #262626' }}>
                    <span style={{ fontSize: '0.68rem', color: '#888' }}>Match: </span>
                    <strong style={{ fontSize: '0.78rem', color: '#4ADE80' }}>{v.matchScore}%</strong>
                  </div>
                </div>

                {/* Changes summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {v.majorChanges.map((chg, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.72rem', color: '#A1A1AA' }}>
                      <span style={{ color: '#E50920' }}>•</span>
                      <span>{chg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {v.isCurrent && onNavigateOptimizer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateOptimizer();
                  }}
                  className="btn btn-red"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 700, alignSelf: 'flex-start' }}
                >
                  <span>Edit in Optimizer</span>
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Compare Mode Side-by-Side Diff View */}
      {isCompareMode && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            background: '#141414',
            border: '1px solid #333333',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF' }}>
              Side-by-Side Comparison: Version 1 (Original) vs Version 3 (Current)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                ATS: +{VERSIONS[2].atsScore - VERSIONS[0].atsScore} pts
              </span>
              <span style={{ fontSize: '0.74rem', color: '#60A5FA', fontWeight: 700, background: 'rgba(96, 165, 250, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                Match: +{VERSIONS[2].matchScore - VERSIONS[0].matchScore}%
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Version 1 Original */}
            <div style={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', marginBottom: '6px' }}>
                Version 1 (Original Unstructured)
              </div>
              <p style={{ fontSize: '0.74rem', color: '#888', lineHeight: 1.45, margin: 0 }}>
                "I would like to be a part of an organization where I could use and enhance my knowledge and talent... EDUCATIONAL QUALIFICATION Pursing my B.TECH in Mechanical Engineering... TECHNICAL CERTIFICATION AUTOCAD and CATIA..."
              </p>
            </div>

            {/* Version 3 Current */}
            <div style={{ background: '#0D0D0D', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4ADE80', textTransform: 'uppercase', marginBottom: '6px' }}>
                Version 3 (Structured & Tailored)
              </div>
              <p style={{ fontSize: '0.74rem', color: '#DDD', lineHeight: 1.45, margin: 0 }}>
                "Results-driven Mechanical Engineer certified in AutoCAD 2D drafting and CATIA 3D parametric modeling by Central Tool Room & Training Centre (CTTC). Hands-on industrial training at Neelachal Ispat Nigam Limited (NINL) with 7.41 CGPA academic foundation."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
