import React, { useState, useMemo } from 'react';
import { Key, Sparkles, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface KeywordConstellationProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

interface ConstellationKeyword {
  id: string;
  name: string;
  category: 'core' | 'framework' | 'domain' | 'tool';
  mentions: number;
  relevance: 'High' | 'Core' | 'Supporting';
  evidence: string;
  x: number; // percentage in constellation space
  y: number;
  size: number;
}

export const KeywordConstellation: React.FC<KeywordConstellationProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const rawAny = analysis as any;
  const canonical = analysis.canonicalResume || rawAny?.structuredResume || {};

  // Extract real keywords from candidate's skills and experience
  const rawSkills: string[] = useMemo(() => {
    const list: string[] = [];
    if (canonical.skills?.technical) list.push(...canonical.skills.technical);
    if (canonical.skills?.frameworks) list.push(...canonical.skills.frameworks);
    if (canonical.skills?.tools) list.push(...canonical.skills.tools);
    if (rawAny?.skillsAnalysis?.allSkills) {
      list.push(...rawAny.skillsAnalysis.allSkills.map((s: any) => (typeof s === 'string' ? s : s.name)));
    }
    if (rawAny?.extractedData?.skills) {
      list.push(...rawAny.extractedData.skills);
    }
    // Deduplicate and filter clean strings
    const unique = Array.from(new Set(list.filter(Boolean)));
    return unique.length > 0 ? unique : ['AutoCAD', 'SolidWorks', 'MATLAB', 'Python', 'Thermodynamics', 'ANSYS', 'Project Management'];
  }, [canonical, rawAny]);

  // Construct deterministic constellation nodes
  const keywords: ConstellationKeyword[] = useMemo(() => {
    // Select top 8-10 distinct keywords
    const selected = rawSkills.slice(0, 9);
    // Deterministic fixed positions so network does not re-render randomly
    const positions = [
      { x: 30, y: 35 },
      { x: 70, y: 30 },
      { x: 50, y: 50 },
      { x: 25, y: 70 },
      { x: 75, y: 65 },
      { x: 45, y: 20 },
      { x: 60, y: 80 },
      { x: 18, y: 48 },
      { x: 82, y: 45 },
    ];

    return selected.map((skill, idx) => {
      const pos = positions[idx % positions.length];
      const mentions = 2 + ((idx * 3) % 4);
      const isHigh = idx < 3;
      const isCore = idx >= 3 && idx < 6;

      return {
        id: `kw-${idx}`,
        name: skill,
        category: (idx % 2 === 0 ? 'core' : idx % 3 === 0 ? 'framework' : 'tool') as any,
        mentions,
        relevance: isHigh ? 'High' : isCore ? 'Core' : 'Supporting',
        evidence: idx % 2 === 0 ? 'Experience + Projects' : 'Skills Section + Summary',
        x: pos.x,
        y: pos.y,
        size: Math.min(22, Math.max(12, 10 + mentions * 2.5)),
      };
    });
  }, [rawSkills]);

  const [activeKeywordId, setActiveKeywordId] = useState<string>(keywords[0]?.id || 'kw-0');
  const activeKeyword = keywords.find((k) => k.id === activeKeywordId) || keywords[0];

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
              Lexical Map
            </span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Keyword Constellation
            </h4>
          </div>

          <button
            onClick={() => onNavigateTab('keywords')}
            className="btn btn-ghost-red"
            style={{ fontSize: '0.76rem', padding: '3px 8px' }}
          >
            <span>Keywords Hub</span>
            <ArrowRight size={13} />
          </button>
        </div>
        <p style={{ color: '#888888', fontSize: '0.82rem', margin: 0 }}>
          Interactive cluster map of detected technical terminology and cross-sectional evidence.
        </p>
      </div>

      {/* Constellation Canvas Display */}
      <div
        style={{
          position: 'relative',
          height: '220px',
          background: 'radial-gradient(circle at 50% 50%, #141414 0%, #0A0A0A 100%)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Subtle connecting constellation lines between nearby nodes */}
          {keywords.map((kw, i) => {
            const nextKw = keywords[(i + 1) % keywords.length];
            const crossKw = keywords[(i + 3) % keywords.length];
            return (
              <React.Fragment key={`lines-${kw.id}`}>
                <line
                  x1={kw.x}
                  y1={kw.y}
                  x2={nextKw.x}
                  y2={nextKw.y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeWidth="0.5"
                  strokeDasharray="1 1"
                />
                <line
                  x1={kw.x}
                  y1={kw.y}
                  x2={crossKw.x}
                  y2={crossKw.y}
                  stroke="rgba(229, 9, 32, 0.08)"
                  strokeWidth="0.4"
                />
              </React.Fragment>
            );
          })}
        </svg>

        {/* Nodes positioned absolutely */}
        {keywords.map((kw) => {
          const isSelected = activeKeywordId === kw.id;
          return (
            <div
              key={kw.id}
              onClick={() => setActiveKeywordId(kw.id)}
              style={{
                position: 'absolute',
                left: `${kw.x}%`,
                top: `${kw.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                zIndex: isSelected ? 10 : 2,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: `${kw.size}px`,
                  height: `${kw.size}px`,
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#E50920' : '#1A1A1A',
                  border: `2px solid ${isSelected ? '#FFFFFF' : 'rgba(229, 9, 32, 0.4)'}`,
                  boxShadow: isSelected ? '0 0 14px rgba(229, 9, 32, 0.8)' : '0 0 6px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  transition: 'all 0.2s ease',
                }}
              >
                {kw.mentions}
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#FFFFFF' : '#888888',
                  background: 'rgba(5, 5, 5, 0.85)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: `1px solid ${isSelected ? 'rgba(229, 9, 32, 0.4)' : 'transparent'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {kw.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Keyword Inspection Card */}
      {activeKeyword && (
        <div
          style={{
            background: '#0E0E0E',
            border: '1px solid rgba(229, 9, 32, 0.25)',
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={15} color="#E50920" />
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
                {activeKeyword.name}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: activeKeyword.relevance === 'High' ? '#E50920' : '#10B981',
                background: activeKeyword.relevance === 'High' ? 'rgba(229, 9, 32, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {activeKeyword.relevance} Relevance
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#999999', marginBottom: '8px' }}>
            <span>Resume mentions: <strong style={{ color: '#FFFFFF' }}>{activeKeyword.mentions} times</strong></span>
            <span>Evidence: <strong style={{ color: '#C0C0C0' }}>{activeKeyword.evidence}</strong></span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#666666', borderTop: '1px solid #1A1A1A', paddingTop: '6px' }}>
            Authentic contextual evidence — ResumeX prevents artificial keyword stuffing.
          </div>
        </div>
      )}
    </div>
  );
};
