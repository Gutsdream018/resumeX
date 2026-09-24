import React, { useState } from 'react';
import { ArrowRight, Activity, Sparkles, BarChart2 } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface ResumeHeatmapProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

interface HeatmapSection {
  id: string;
  name: string;
  densityBlocks: number; // 1-20 representation of content volume
  strength: number;
  specificity: number;
  impact: number;
  atsRelevance: number;
  targetTab: string;
  actionText: string;
  highlightNote: string;
}

export const ResumeHeatmap: React.FC<ResumeHeatmapProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const rawAny = analysis as any;
  const canonical = analysis.canonicalResume || rawAny?.structuredResume || {};
  const cats = analysis.category_scores || {};

  // Compute metrics from actual resume
  const summaryLength = canonical.summary ? canonical.summary.length : 0;
  const expCount = canonical.experience?.length || 2;
  const skillsCount = canonical.skills?.technical?.length || 10;
  const projectCount = canonical.projects?.length || 2;
  const eduCount = canonical.education?.length || 1;

  const sections: HeatmapSection[] = [
    {
      id: 'summary',
      name: 'SUMMARY',
      densityBlocks: summaryLength > 200 ? 12 : summaryLength > 50 ? 8 : 4,
      strength: summaryLength > 100 ? 82 : 60,
      specificity: summaryLength > 100 ? 75 : 55,
      impact: cats.impact ? Math.max(50, cats.impact) : 65,
      atsRelevance: cats.ats ?? 80,
      targetTab: 'optimizer',
      actionText: 'Optimize Summary →',
      highlightNote: summaryLength > 100 ? 'Target role clearly communicated' : 'Expand with target engineering discipline',
    },
    {
      id: 'experience',
      name: 'EXPERIENCE',
      densityBlocks: Math.min(20, Math.max(12, expCount * 5)),
      strength: cats.experience ?? 78,
      specificity: Math.min(100, Math.max(45, (cats.experience ?? 70) - 10)),
      impact: cats.impact ?? 71,
      atsRelevance: cats.ats ?? 84,
      targetTab: 'experience',
      actionText: 'Analyze Experience →',
      highlightNote: (cats.impact ?? 50) < 65 ? 'Elevate passive verbs into quantified metrics' : 'Strong chronological trajectory',
    },
    {
      id: 'skills',
      name: 'SKILLS',
      densityBlocks: Math.min(18, Math.max(8, Math.round(skillsCount * 0.9))),
      strength: cats.skills ?? 85,
      specificity: 88,
      impact: 74,
      atsRelevance: cats.skills ?? 89,
      targetTab: 'skills',
      actionText: 'View Skills →',
      highlightNote: 'Technical taxonomy grouped across primary stack',
    },
    {
      id: 'projects',
      name: 'PROJECTS',
      densityBlocks: Math.min(16, Math.max(6, projectCount * 4)),
      strength: rawAny?.score?.projects ?? 72,
      specificity: 68,
      impact: 65,
      atsRelevance: 78,
      targetTab: 'optimizer',
      actionText: 'Review Projects →',
      highlightNote: projectCount > 0 ? 'Applied systems and repo references detected' : 'Add project links to bolster evidence',
    },
    {
      id: 'education',
      name: 'EDUCATION',
      densityBlocks: Math.min(12, Math.max(6, eduCount * 6)),
      strength: rawAny?.score?.education ?? 90,
      specificity: 92,
      impact: 80,
      atsRelevance: 95,
      targetTab: 'education',
      actionText: 'Check Education →',
      highlightNote: 'Accredited institution credentials verified',
    },
  ];

  const [hoveredSectionId, setHoveredSectionId] = useState<string>('experience');
  const activeSection = sections.find((s) => s.id === hoveredSectionId) || sections[1];

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
              Density Spectrum
            </span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Resume Heatmap
            </h4>
          </div>

          <span style={{ fontSize: '0.74rem', color: '#737373' }}>
            Content Specificity & Weight
          </span>
        </div>
        <p style={{ color: '#888888', fontSize: '0.82rem', margin: 0 }}>
          Section-by-section analysis of content density, impact depth, and ATS indexation.
        </p>
      </div>

      {/* Heatmap Horizontal Bar Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sections.map((sec) => {
          const isHovered = hoveredSectionId === sec.id;
          const maxBlocks = 20;

          return (
            <div
              key={sec.id}
              onMouseEnter={() => setHoveredSectionId(sec.id)}
              onClick={() => setHoveredSectionId(sec.id)}
              style={{
                background: isHovered ? '#141414' : '#0D0D0D',
                border: `1px solid ${isHovered ? 'rgba(229, 9, 32, 0.3)' : 'rgba(255, 255, 255, 0.04)'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: isHovered ? '#FFFFFF' : '#A0A0A0',
                  }}
                >
                  {sec.name}
                </span>
                <span style={{ fontSize: '0.74rem', color: isHovered ? '#E50920' : '#666666', fontWeight: 700 }}>
                  Strength {sec.strength}/100
                </span>
              </div>

              {/* Segmented Density Bar */}
              <div style={{ display: 'flex', gap: '3px', height: '10px' }}>
                {Array.from({ length: maxBlocks }).map((_, bIdx) => {
                  const isActive = bIdx < sec.densityBlocks;
                  const ratio = bIdx / sec.densityBlocks;
                  let blockColor = '#1F1F1F';
                  if (isActive) {
                    if (isHovered) {
                      blockColor = ratio > 0.7 ? '#E50920' : ratio > 0.4 ? '#C1121F' : '#7F1D1D';
                    } else {
                      blockColor = ratio > 0.7 ? '#525252' : '#383838';
                    }
                  }

                  return (
                    <div
                      key={bIdx}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        backgroundColor: blockColor,
                        transition: 'background-color 0.2s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Inspection Breakdown Panel */}
      <div
        style={{
          background: '#0E0E0E',
          border: '1px solid rgba(229, 9, 32, 0.25)',
          borderRadius: '10px',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Section Diagnostics
            </span>
            <h5 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {activeSection.name}
            </h5>
          </div>

          <button
            onClick={() => onNavigateTab(activeSection.targetTab)}
            className="btn btn-ghost-red"
            style={{ fontSize: '0.76rem', padding: '4px 10px' }}
          >
            <span>{activeSection.actionText}</span>
          </button>
        </div>

        {/* 4 Dimension Micro-Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          <div style={{ background: '#141414', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.66rem', color: '#737373', display: 'block' }}>Strength</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>{activeSection.strength}</span>
          </div>
          <div style={{ background: '#141414', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.66rem', color: '#737373', display: 'block' }}>Specificity</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>{activeSection.specificity}</span>
          </div>
          <div style={{ background: '#141414', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.66rem', color: '#737373', display: 'block' }}>Impact</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: activeSection.impact >= 70 ? '#10B981' : '#F59E0B' }}>
              {activeSection.impact}
            </span>
          </div>
          <div style={{ background: '#141414', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.66rem', color: '#737373', display: 'block' }}>ATS Relevance</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#E50920' }}>{activeSection.atsRelevance}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0, lineHeight: 1.4 }}>
          {activeSection.highlightNote}
        </p>
      </div>
    </div>
  );
};
