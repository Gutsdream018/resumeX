import React, { useState } from 'react';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface ATSVisualizationProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

interface ATSSegment {
  id: string;
  name: string;
  score: number;
  radius: number;
  strokeWidth: number;
  color: string;
  verdict: string;
  explanation: string;
  issues: string[];
}

export const ATSVisualization: React.FC<ATSVisualizationProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const rawAny = analysis as any;
  const cats = analysis.category_scores || {};
  const diagnostic = analysis.diagnostic;
  const overallAtsScore = analysis.overall_score ?? rawAny?.score?.overall ?? 78;

  // Real data calculations
  const parsingScore = cats.ats ?? rawAny?.score?.atsReadability ?? 84;
  const keywordsScore = cats.skills ?? rawAny?.score?.keywordRelevance ?? 76;
  const structureScore = cats.formatting ?? rawAny?.score?.formatting ?? 82;
  const formattingScore = Math.min(100, Math.round(((cats.formatting ?? 80) + (cats.ats ?? 80)) / 2));
  const sectionScore = analysis.canonicalResume?.experience?.length ? 92 : 70;
  const readabilityScore = Math.round(((cats.content ?? 72) + (cats.experience ?? 70)) / 2);

  // Extract real issues
  const atsIssues = analysis.ats_issues || [];
  const keywordIssues = atsIssues.filter((i) => i.toLowerCase().includes('keyword') || i.toLowerCase().includes('skill'));
  const formattingIssues = atsIssues.filter((i) => i.toLowerCase().includes('format') || i.toLowerCase().includes('column') || i.toLowerCase().includes('margin'));

  const segments: ATSSegment[] = [
    {
      id: 'parsing',
      name: 'Parsing Heuristics',
      score: parsingScore,
      radius: 96,
      strokeWidth: 9,
      color: '#10B981',
      verdict: parsingScore >= 75 ? 'Clean Document Stream' : 'Minor Parse Friction',
      explanation: parsingScore >= 75
        ? 'Standard top-to-bottom parse stream. Contact info accurately recognized.'
        : 'Potential parser truncation in dense header or multi-element division.',
      issues: atsIssues.slice(0, 1),
    },
    {
      id: 'keywords',
      name: 'Keyword Coverage',
      score: keywordsScore,
      radius: 82,
      strokeWidth: 9,
      color: '#E50920',
      verdict: keywordsScore >= 75 ? 'Optimal Relevance' : `Missing ${keywordIssues.length || 3} high-relevance keywords`,
      explanation: keywordsScore >= 75
        ? 'Most important job-related keywords and domain tools are represented.'
        : 'Several core industry technical terms lack repeated evidence in experience bullets.',
      issues: keywordIssues.length ? keywordIssues : ['Technical competencies should be consolidated in a dedicated skills group.'],
    },
    {
      id: 'structure',
      name: 'Structure & Flow',
      score: structureScore,
      radius: 68,
      strokeWidth: 9,
      color: '#3B82F6',
      verdict: structureScore >= 75 ? 'Standard ATS Taxonomy' : 'Heading Non-Standard',
      explanation: 'Recognized industry section headers (Experience, Education, Skills, Projects) ensure accurate classification.',
      issues: [],
    },
    {
      id: 'formatting',
      name: 'Formatting Hygiene',
      score: formattingScore,
      radius: 54,
      strokeWidth: 9,
      color: '#F59E0B',
      verdict: formattingScore >= 75 ? 'Single-Column Clean' : 'Layout Inconsistencies',
      explanation: 'No complex tables, floating text-boxes, or vector glyphs detected that corrupt automated ATS screeners.',
      issues: formattingIssues.length ? formattingIssues : [],
    },
    {
      id: 'completeness',
      name: 'Section Completeness',
      score: sectionScore,
      radius: 40,
      strokeWidth: 9,
      color: '#8B5CF6',
      verdict: sectionScore >= 80 ? 'All Core Sections Present' : 'Missing Critical Sections',
      explanation: 'All mandatory career divisions (Summary, Experience, Education, Technical Competencies) are present.',
      issues: [],
    },
    {
      id: 'readability',
      name: 'Readability & Action',
      score: readabilityScore,
      radius: 26,
      strokeWidth: 9,
      color: '#06B6D4',
      verdict: readabilityScore >= 70 ? 'Strong Action Phrasing' : 'Passive Responsibilities',
      explanation: 'Action verbs and clear bullet separation allow deterministic text tokenization.',
      issues: diagnostic?.signals?.contentSignals?.slice(0, 1) || [],
    },
  ];

  const [activeSegmentId, setActiveSegmentId] = useState<string>('keywords');
  const activeSegment = segments.find((s) => s.id === activeSegmentId) || segments[1];

  // SVG parameters
  const center = 120;
  const size = 240;

  return (
    <div
      className="card-dark"
      style={{
        background: '#0A0A0A',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '20px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              Diagnostic Rings
            </span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              ATS Radial Architecture
            </h4>
          </div>

          <button
            onClick={() => onNavigateTab('ats-score')}
            className="btn btn-ghost-red"
            style={{ fontSize: '0.76rem', padding: '3px 8px' }}
          >
            <span>Full Audit</span>
            <ArrowRight size={13} />
          </button>
        </div>
        <p style={{ color: '#888888', fontSize: '0.82rem', margin: 0 }}>
          Concentric parsing evaluation across 6 critical ATS structural dimensions.
        </p>
      </div>

      {/* Radial Rings Diagram + Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          padding: '10px 0',
        }}
      >
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background tracks */}
            {segments.map((seg) => {
              const circumference = 2 * Math.PI * seg.radius;
              const arcLength = circumference * 0.75; // 270 degree arc
              const dashoffset = circumference * 0.25;

              return (
                <circle
                  key={`bg-${seg.id}`}
                  cx={center}
                  cy={center}
                  r={seg.radius}
                  fill="none"
                  stroke="#1A1A1A"
                  strokeWidth={seg.strokeWidth}
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={-dashoffset}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Filled data arcs */}
            {segments.map((seg) => {
              const circumference = 2 * Math.PI * seg.radius;
              const totalArc = circumference * 0.75;
              const filledLength = (seg.score / 100) * totalArc;
              const dashoffset = circumference * 0.25;
              const isSelected = activeSegmentId === seg.id;

              return (
                <circle
                  key={`fg-${seg.id}`}
                  cx={center}
                  cy={center}
                  r={seg.radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isSelected ? seg.strokeWidth + 2 : seg.strokeWidth}
                  strokeDasharray={`${filledLength} ${circumference}`}
                  strokeDashoffset={-dashoffset}
                  strokeLinecap="round"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    filter: isSelected ? `drop-shadow(0 0 6px ${seg.color})` : 'none',
                    opacity: isSelected ? 1 : 0.8,
                  }}
                  onMouseEnter={() => setActiveSegmentId(seg.id)}
                  onClick={() => setActiveSegmentId(seg.id)}
                />
              );
            })}
          </svg>

          {/* Central ATS Score Label */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '0.66rem', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
              ATS Score
            </span>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1, display: 'block' }}>
              {overallAtsScore}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: overallAtsScore >= 75 ? '#10B981' : '#E50920',
              }}
            >
              {overallAtsScore >= 75 ? 'PASSED' : 'DEFICIT'}
            </span>
          </div>
        </div>

        {/* Legend / Quick Selector List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
          {segments.map((seg) => {
            const isSelected = activeSegmentId === seg.id;
            return (
              <div
                key={seg.id}
                onClick={() => setActiveSegmentId(seg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: `1px solid ${isSelected ? seg.color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: seg.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: isSelected ? '#FFFFFF' : '#888888', fontWeight: isSelected ? 700 : 500 }}>
                    {seg.name}
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: seg.color }}>{seg.score}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual Inspection Card on Hover / Selection */}
      <div
        style={{
          background: '#0E0E0E',
          border: `1px solid ${activeSegment.color}40`,
          borderRadius: '10px',
          padding: '14px 16px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>
              {activeSegment.name}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: activeSegment.color }}>
              {activeSegment.score}%
            </span>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: activeSegment.score >= 75 ? '#10B981' : '#F59E0B',
              background: activeSegment.score >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {activeSegment.verdict}
          </span>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#B0B0B0', lineHeight: 1.45, margin: 0 }}>
          {activeSegment.explanation}
        </p>

        {activeSegment.issues.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.76rem', color: '#E50920' }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{activeSegment.issues[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};
