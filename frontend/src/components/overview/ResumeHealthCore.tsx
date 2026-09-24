import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Activity, Award, HelpCircle } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface ResumeHealthCoreProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
  onOpenScoreExplanation?: () => void;
}

interface HealthDimension {
  id: string;
  name: string;
  score: number;
  weight: number;
  color: string;
  description: string;
  targetTab: string;
}

export const ResumeHealthCore: React.FC<ResumeHealthCoreProps> = ({
  analysis,
  onNavigateTab,
  onOpenScoreExplanation,
}) => {
  const rawAny = analysis as any;
  const targetScore = analysis.overall_score ?? rawAny?.score?.overall ?? 75;
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [activeDimension, setActiveDimension] = useState<HealthDimension | null>(null);

  const cats = analysis.category_scores || {};
  const diagnostic = analysis.diagnostic;

  // 7 Data-Driven Dimensions
  const dimensions: HealthDimension[] = [
    {
      id: 'ats',
      name: 'ATS Readability',
      score: cats.ats ?? rawAny?.score?.atsCompatibility ?? 78,
      weight: 20,
      color: '#10B981',
      description: 'Section taxonomy, standard contact formatting, and parsable linear structure.',
      targetTab: 'ats-score',
    },
    {
      id: 'content',
      name: 'Content Depth',
      score: cats.content ?? Math.round(((cats.experience ?? 60) + (cats.skills ?? 60)) / 2),
      weight: 20,
      color: '#3B82F6',
      description: 'Comprehensive coverage of professional background and role deliverables.',
      targetTab: 'resume-analysis',
    },
    {
      id: 'experience',
      name: 'Experience Quality',
      score: cats.experience ?? rawAny?.score?.experience ?? 68,
      weight: 20,
      color: '#8B5CF6',
      description: 'Action-oriented bullet phrasing and clear engineering ownership.',
      targetTab: 'experience',
    },
    {
      id: 'skills',
      name: 'Technical Skills',
      score: cats.skills ?? rawAny?.score?.keywordRelevance ?? 74,
      weight: 15,
      color: '#E50920',
      description: 'Verified technical competencies and industry-standard keyword density.',
      targetTab: 'skills',
    },
    {
      id: 'education',
      name: 'Education Consistency',
      score: rawAny?.score?.education ?? 90,
      weight: 5,
      color: '#F59E0B',
      description: 'Accredited degree verification, institution hierarchy, and graduation timeline.',
      targetTab: 'education',
    },
    {
      id: 'impact',
      name: 'Measurable Impact',
      score: cats.impact ?? rawAny?.score?.achievements ?? 52,
      weight: 10,
      color: '#EC4899',
      description: 'Quantified deliverables (% improvements, scale metrics, and business outcomes).',
      targetTab: 'suggestions',
    },
    {
      id: 'formatting',
      name: 'Format & Layout',
      score: cats.formatting ?? rawAny?.score?.formatting ?? 82,
      weight: 10,
      color: '#06B6D4',
      description: 'Visual balance, consistent typography, bullet discipline, and single-column hygiene.',
      targetTab: 'ats-score',
    },
  ];

  // Animated Count-Up on Mount (600 - 1000ms)
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 900;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(ease * targetScore));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetScore]);

  const getVerdict = (val: number) => {
    if (val >= 80) return { label: 'STRONG ATS PROFILE', color: '#10B981' };
    if (val >= 65) return { label: 'GOOD FOUNDATION', color: '#F59E0B' };
    return { label: 'NEEDS OPTIMIZATION', color: '#E50920' };
  };

  const verdict = getVerdict(targetScore);
  const currentView = activeDimension || dimensions[0];

  return (
    <div
      className="card-dark"
      style={{
        background: '#0B0B0B',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229, 9, 32, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />

      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#E50920',
                boxShadow: '0 0 8px #E50920',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#8E8E8E',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Resume Intelligence Core
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
            Resume Health & Diagnostic Radar
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenScoreExplanation && (
            <button
              type="button"
              onClick={onOpenScoreExplanation}
              className="btn btn-secondary-dark"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <HelpCircle size={14} />
              <span>Score Methodology</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('optimizer')}
            className="btn btn-red"
            style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <span>Launch Resume Optimizer</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Core Center Display Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(280px, 1fr)',
          gap: '36px',
          alignItems: 'center',
        }}
        className="health-core-grid"
      >
        {/* Left: Concentric Multi-Ring Radial Visualization */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="300" height="300" viewBox="0 0 300 300" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background base tracks */}
            {dimensions.map((dim, idx) => {
              const radius = 55 + idx * 13;
              return (
                <circle
                  key={`bg-${dim.id}`}
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="6"
                />
              );
            })}

            {/* Active Data-driven Segment Arcs */}
            {dimensions.map((dim, idx) => {
              const radius = 55 + idx * 13;
              const circumference = 2 * Math.PI * radius;
              const strokeLength = (dim.score / 100) * circumference;
              const isSelected = activeDimension?.id === dim.id;

              return (
                <circle
                  key={`val-${dim.id}`}
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="transparent"
                  stroke={dim.color}
                  strokeWidth={isSelected ? '8' : '5.5'}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeLinecap="round"
                  style={{
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    opacity: activeDimension && !isSelected ? 0.35 : 0.95,
                    filter: isSelected ? `drop-shadow(0 0 8px ${dim.color})` : 'none',
                  }}
                  onMouseEnter={() => setActiveDimension(dim)}
                  onMouseLeave={() => setActiveDimension(null)}
                  onClick={() => onNavigateTab(dim.targetTab)}
                />
              );
            })}
          </svg>

          {/* Central Score Card */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#8E8E8E',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Resume Health
            </span>
            <div
              style={{
                fontSize: '3.4rem',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                marginTop: '2px',
              }}
            >
              {displayScore}
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: verdict.color,
                background: `${verdict.color}15`,
                border: `1px solid ${verdict.color}35`,
                padding: '2px 8px',
                borderRadius: '9999px',
                marginTop: '6px',
                letterSpacing: '0.04em',
              }}
            >
              {verdict.label}
            </span>
          </div>
        </div>

        {/* Right: Dimension Details & Interactive Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Highlight Card */}
          <div
            style={{
              background: '#121212',
              border: `1px solid ${currentView.color}45`,
              borderRadius: '14px',
              padding: '16px 20px',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: currentView.color,
                    boxShadow: `0 0 8px ${currentView.color}`,
                  }}
                />
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {currentView.name}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#8E8E8E',
                    background: '#1A1A1A',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {currentView.weight}% weight
                </span>
              </div>

              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: currentView.color }}>
                {currentView.score}%
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#B0B0B0', lineHeight: 1.5, margin: '0 0 10px' }}>
              {currentView.description}
            </p>

            <button
              type="button"
              onClick={() => onNavigateTab(currentView.targetTab)}
              style={{
                background: 'none',
                border: 'none',
                color: currentView.color,
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>Drill into {currentView.name}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Mini Dimension Bars List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dimensions.map((dim) => {
              const isSelected = activeDimension?.id === dim.id;
              return (
                <div
                  key={dim.id}
                  onClick={() => onNavigateTab(dim.targetTab)}
                  onMouseEnter={() => setActiveDimension(dim)}
                  onMouseLeave={() => setActiveDimension(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr 40px',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: isSelected ? '#FFFFFF' : '#9E9E9E', fontWeight: 600 }}>
                    {dim.name}
                  </span>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '5px', background: '#1A1A1A', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${dim.score}%`,
                        height: '100%',
                        background: dim.color,
                        borderRadius: '3px',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>
                    {dim.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
