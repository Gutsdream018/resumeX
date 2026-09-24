import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Target, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';
import './ScoreTransitionCard.css';

interface ScoreTransitionCardProps {
  analysis: ResumeAnalysisResult;
  onNavigate: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ScoreTransitionCard: React.FC<ScoreTransitionCardProps> = ({
  analysis,
  onNavigate,
  className = '',
  style,
}) => {
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [isMidFlip, setIsMidFlip] = useState<boolean>(false);
  const [backdropActive, setBackdropActive] = useState<boolean>(false);
  const timerRef = useRef<any[]>([]);

  const rawAny = analysis as any;
  const score = analysis.overall_score ?? rawAny?.score?.overall ?? 78;
  const cats = analysis.category_scores || {};

  // Real breakdown scores
  const atsScore = cats.ats ?? rawAny?.score?.atsCompatibility ?? 82;
  const contentScore = cats.content ?? Math.round(((cats.experience ?? 70) + (cats.skills ?? 75)) / 2);
  const skillsScore = cats.skills ?? rawAny?.score?.keywordRelevance ?? 76;
  const experienceScore = cats.experience ?? rawAny?.score?.experience ?? 72;

  const getVerdict = (val: number) => {
    if (val >= 80) return { label: 'STRONG ATS PROFILE', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    if (val >= 65) return { label: 'GOOD FOUNDATION', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    return { label: 'NEEDS OPTIMIZATION', color: '#E50920', bg: 'rgba(229, 9, 32, 0.12)', border: 'rgba(229, 9, 32, 0.3)' };
  };

  const verdict = getVerdict(score);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleClick = () => {
    if (isFlipping) return; // Prevent double clicks

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsFlipping(true);
      const t = setTimeout(() => {
        onNavigate();
      }, 250);
      timerRef.current.push(t);
      return;
    }

    // Step 1: Start lift & backdrop dim
    setIsFlipping(true);
    setBackdropActive(true);

    // Step 2: At ~400ms (near 90-degree edge-on position), trigger dynamic edge flare
    const flareTimer = setTimeout(() => {
      setIsMidFlip(true);
    }, 420);

    // Step 3: Turn off edge flare after rotating past 100 degrees
    const flareOffTimer = setTimeout(() => {
      setIsMidFlip(false);
    }, 620);

    // Step 4: Finish flip (180deg) and trigger navigation transition into Score Analysis page
    const navTimer = setTimeout(() => {
      try {
        onNavigate();
      } catch (err) {
        console.error('Score navigation error:', err);
        // Error safety: return to original state
        setIsFlipping(false);
        setIsMidFlip(false);
        setBackdropActive(false);
      }
    }, 850);

    timerRef.current.push(flareTimer, flareOffTimer, navTimer);
  };

  return (
    <>
      {/* Background Dimming Scrim */}
      <div className={`score-flip-backdrop ${backdropActive ? 'is-active' : ''}`} />

      {/* 3D Flip Container */}
      <div
        className={`score-transition-container ${className}`}
        style={{
          ...style,
          zIndex: isFlipping ? 50 : 'auto',
        }}
      >
        <div
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label="View Detailed Score Analysis (Press to flip)"
          className={`score-transition-card-inner ${isFlipping ? 'is-flipping' : ''} ${isMidFlip ? 'is-mid-flip' : ''}`}
        >
          {/* Dynamic 90-degree Crimson Edge Flare */}
          <div className="score-flip-edge-flare" />

          {/* FRONT FACE: The ResumeX Score Card */}
          <div className="score-card-face score-card-front" style={{ padding: '24px 28px' }}>
            {/* Ambient Corner Aura */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229, 9, 32, 0.16) 0%, transparent 70%)',
                filter: 'blur(30px)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
              {/* Left Column: Label + Hero Score + Verdict */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {/* Score Circular Gauge */}
                <div style={{ position: 'relative', width: '92px', height: '92px', flexShrink: 0 }}>
                  <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="46"
                      cy="46"
                      r="38"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="7"
                    />
                    <circle
                      cx="46"
                      cy="46"
                      r="38"
                      fill="none"
                      stroke={verdict.color}
                      strokeWidth="7"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - score / 100)}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dashoffset 1s ease-out',
                        filter: `drop-shadow(0 0 8px ${verdict.color}60)`,
                      }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                      {score}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#71717A', fontWeight: 600 }}>
                      /100
                    </span>
                  </div>
                </div>

                {/* Score Details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#E50920',
                        boxShadow: '0 0 8px #E50920',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#A1A1AA',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Resume Score • ATS Health
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.02em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>Overall Profile Performance</span>
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: verdict.color,
                        background: verdict.bg,
                        border: `1px solid ${verdict.border}`,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {verdict.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#71717A' }}>
                      Fortune 500 ATS Calibration
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: 4-Dimension Metric Spark Pills */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '12px',
                  flex: 1,
                  maxWidth: '460px',
                }}
                className="score-card-dimensions-preview"
              >
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888888', marginBottom: '2px' }}>ATS Parse</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>{atsScore}%</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888888', marginBottom: '2px' }}>Content</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3B82F6' }}>{contentScore}%</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888888', marginBottom: '2px' }}>Skills</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#E50920' }}>{skillsScore}%</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#888888', marginBottom: '2px' }}>Experience</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#8B5CF6' }}>{experienceScore}%</div>
                </div>
              </div>

              {/* Right CTA Button / Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  className="btn btn-red"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(229, 9, 32, 0.3)',
                  }}
                >
                  <span>Explore Score Analysis</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
          </div>

          {/* BACK FACE: Transformation Surface into Score Analysis Page */}
          <div
            className="score-card-face score-card-back"
            style={{
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#E50920',
                    background: 'rgba(229, 9, 32, 0.15)',
                    border: '1px solid rgba(229, 9, 32, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Score Analysis
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Opening ATS Diagnostic Engine...
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.76rem', fontWeight: 600 }}>
                <Activity size={14} className="pulse-red-glow" />
                <span>Calibrating Full Report</span>
              </div>
            </div>

            {/* Middle: Score Summary & 4 Category Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '28px', alignItems: 'center', padding: '10px 0' }}>
              {/* Radial Center Ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {score}
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#888888', fontWeight: 600 }}>OVERALL ATS</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: verdict.color }}>{verdict.label}</div>
                </div>
              </div>

              {/* 4 Category Progress Tracks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: '#C4C4C4' }}>ATS Readability</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{atsScore}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${atsScore}%`, height: '100%', background: '#10B981', borderRadius: '2px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: '#C4C4C4' }}>Content Depth</span>
                    <span style={{ color: '#3B82F6', fontWeight: 700 }}>{contentScore}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${contentScore}%`, height: '100%', background: '#3B82F6', borderRadius: '2px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: '#C4C4C4' }}>Technical Skills</span>
                    <span style={{ color: '#E50920', fontWeight: 700 }}>{skillsScore}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${skillsScore}%`, height: '100%', background: '#E50920', borderRadius: '2px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: '#C4C4C4' }}>Experience Scope</span>
                    <span style={{ color: '#8B5CF6', fontWeight: 700 }}>{experienceScore}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${experienceScore}%`, height: '100%', background: '#8B5CF6', borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Expansion Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#888888' }}>
                Expanding into Full Diagnostic Audit Suite...
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E50920', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>Expanding Interface</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScoreTransitionCard;
