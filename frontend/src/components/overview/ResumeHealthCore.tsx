import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowRight, HelpCircle, Sparkles, TrendingUp, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';
import {
  SCORE_CATEGORIES_CONFIG,
  resolveCategoryScores,
  ResolvedCategoryScore,
  getScoreBand,
  getRubricVersion,
  computePotentialScore,
  calculateRingGeometry,
} from '../../config/scoreCategories';

// Expose tunable timing constants at top of file (Phase 2 requirement)
export const RING_MS = 1000;
export const RING_STAGGER_MS = 120;
export const COUNT_MS = 1200;

interface ResumeHealthCoreProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
  onOpenScoreExplanation?: () => void;
}

export const ResumeHealthCore: React.FC<ResumeHealthCoreProps> = ({
  analysis,
  onNavigateTab,
  onOpenScoreExplanation,
}) => {
  const categories = useMemo(() => resolveCategoryScores(analysis), [analysis]);
  const currentOverallScore = Math.max(0, Math.min(100, Math.round(analysis.overall_score || 75)));

  // Target & Previous Score tracking for smooth score change transitions
  const prevScoreRef = useRef<number>(currentOverallScore);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);

  // Interaction: active focused/hovered category
  const [hoveredCategory, setHoveredCategory] = useState<ResolvedCategoryScore | null>(null);

  // Animation & Life sequence states
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [sheenActive, setSheenActive] = useState<boolean>(false);
  const [bandPillVisible, setBandPillVisible] = useState<boolean>(false);
  const [isIdleActive, setIsIdleActive] = useState<boolean>(true);

  // Parallax cursor offset on radar
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Container refs for visibility & intersection observer
  const containerRef = useRef<HTMLDivElement | null>(null);
  const radarRef = useRef<SVGSVGElement | null>(null);

  // Potential score calculation
  const potential = useMemo(
    () => computePotentialScore(currentOverallScore, analysis),
    [currentOverallScore, analysis]
  );
  const rubricVersion = useMemo(() => getRubricVersion(analysis), [analysis]);

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Center display values: defaults to overall score or crossfades to active category (150ms transition)
  const centerValue = hoveredCategory ? hoveredCategory.score : displayScore;
  const centerLabel = hoveredCategory ? hoveredCategory.label : 'OVERALL';
  const centerBand = getScoreBand(hoveredCategory ? hoveredCategory.score : currentOverallScore);

  // 1. Load Sequence & Count-Up (driven by requestAnimationFrame, tabular-nums)
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayScore(currentOverallScore);
      setHasLoaded(true);
      setBandPillVisible(true);
      return;
    }

    const startVal = hasLoaded ? prevScoreRef.current : 0;
    const endVal = currentOverallScore;
    const isScoreChange = hasLoaded && startVal !== endVal;

    if (isScoreChange) {
      setScoreDelta(endVal - startVal);
      const timer = setTimeout(() => setScoreDelta(null), 3000);
      prevScoreRef.current = endVal;
    }

    let startTimestamp: number | null = null;
    const duration = isScoreChange ? 800 : COUNT_MS;

    const animateCount = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic-bezier(0.22, 1, 0.36, 1) approximation
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayScore(endVal);
        if (!hasLoaded) {
          setHasLoaded(true);
          // Band pill fades in after count finishes
          setTimeout(() => setBandPillVisible(true), 150);
          // Soft sheen sweeps across radar at ~1.5s
          setTimeout(() => {
            setSheenActive(true);
            setTimeout(() => setSheenActive(false), 800);
          }, 300);
        }
      }
    };

    const frameId = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(frameId);
  }, [currentOverallScore, prefersReducedMotion]);

  // 2. Idle Life Pause on Visibility Change & Off-Screen (IntersectionObserver)
  useEffect(() => {
    const handleVisibility = () => {
      setIsIdleActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let observer: IntersectionObserver | null = null;
    if (containerRef.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setIsIdleActive(entry.isIntersecting && document.visibilityState === 'visible');
        },
        { threshold: 0.15 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
    };
  }, []);

  // 3. Parallax handling over radar
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (prefersReducedMotion || !radarRef.current) return;
      const rect = radarRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setParallax({ x: x * 6, y: y * 6 }); // 2-4px max offset per ring
    },
    [prefersReducedMotion]
  );

  const handleMouseLeaveRadar = useCallback(() => {
    setParallax({ x: 0, y: 0 });
    setHoveredCategory(null);
  }, []);

  // Build aria summary for accessibility (Phase 2 requirement)
  const ariaLabel = useMemo(() => {
    const catSummaries = categories.map((c) => `${c.label}: ${c.score} percent`).join(', ');
    return `Resume Health Radar: Overall score ${currentOverallScore} out of 100. Category breakdown: ${catSummaries}.`;
  }, [categories, currentOverallScore]);

  // Radar geometry: center at (170, 170), viewBox="0 0 340 340"
  const radarDimensions = useMemo(() => {
    const count = categories.length; // 6
    return categories.map((cat, idx) => {
      const ringIndex = count - 1 - idx;
      const geo = calculateRingGeometry(cat.score, ringIndex, count, 72, 12);
      const staggerDelay = idx * RING_STAGGER_MS;

      const angleDeg = (Math.max(0, Math.min(100, cat.score)) / 100) * 360;
      const rad = ((angleDeg - 90) * Math.PI) / 180;
      const tipX = 170 + geo.radius * Math.cos(rad);
      const tipY = 170 + geo.radius * Math.sin(rad);

      return {
        cat,
        geo,
        staggerDelay,
        tipX,
        tipY,
        ringIndex,
      };
    });
  }, [categories]);

  // Overall outer track potential arc (Phase 4a)
  const potentialRing = useMemo(() => {
    const radius = 146; // Outer ghost track
    const circumference = 2 * Math.PI * radius;
    const strokeLength = (potential.potentialScore / 100) * circumference;
    const baseLength = (currentOverallScore / 100) * circumference;
    return {
      radius,
      circumference,
      strokeLength,
      baseLength,
      dashOffset: circumference - strokeLength,
      gainDashOffset: circumference - (strokeLength - baseLength),
    };
  }, [potential.potentialScore, currentOverallScore]);

  return (
    <div
      ref={containerRef}
      className="card-dark resume-health-core"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#0B0B0B',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Idle slow breathing glow behind radar (Phase 2 requirement: opacity 0.5 to 0.8, 6s loop) */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: '-60px',
          left: '-60px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          filter: 'blur(60px)',
          background: 'radial-gradient(circle, rgba(229, 9, 32, 0.18) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)',
          opacity: isIdleActive && !prefersReducedMotion ? (sheenActive ? 0.95 : 0.65) : 0.4,
          animation: isIdleActive && !prefersReducedMotion ? 'breatheGlow 6s ease-in-out infinite alternate' : 'none',
          transition: 'opacity 1s ease',
        }}
      />

      {/* Top Header & Methodology Link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#E50920',
                boxShadow: '0 0 8px #E50920',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888888' }}>
              Diagnostic Score Engine
            </span>
            <span style={{ color: '#444444' }}>&bull;</span>
            <button
              type="button"
              onClick={onOpenScoreExplanation}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#999999',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {rubricVersion}
            </button>
          </div>
          <h2 style={{ fontSize: '1.28rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>
            Resume Health & Diagnostic Radar
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenScoreExplanation && (
            <button
              type="button"
              onClick={onOpenScoreExplanation}
              className="btn btn-secondary-dark"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #282828',
                background: '#151515',
                color: '#C0C0C0',
                cursor: 'pointer',
              }}
            >
              <HelpCircle size={13} />
              <span>Score Methodology</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('optimizer')}
            className="btn btn-red"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(229, 9, 32, 0.35)',
              cursor: 'pointer',
            }}
          >
            <span>Launch Optimizer</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Radar & Legend | Right Bars & Details (Stacks below 900px) */}
      <div className="radar-content-grid">
        {/* LEFT COLUMN: Radial Radar + Center Score + Label Above + Pill Below + Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Label ABOVE Radar (Phase 1 requirement: center has strictly score, label moves above) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9E9E9E' }}>
              Resume Health Radar
            </span>
            {potential.potentialGain > 0 && (
              <span
                style={{
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#10B981',
                }}
              >
                +{potential.potentialGain} pts potential
              </span>
            )}
          </div>

          {/* SVG Radar Container with subtle Parallax */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '340px',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Soft sheen sweep overlay (Phase 2 requirement) */}
            <div
              aria-hidden="true"
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, transparent 20%, rgba(255, 255, 255, 0.15) 50%, transparent 80%)',
                maskImage: 'radial-gradient(circle, black 65%, transparent 72%)',
                WebkitMaskImage: 'radial-gradient(circle, black 65%, transparent 72%)',
                opacity: sheenActive ? 1 : 0,
                transition: 'opacity 0.7s ease',
              }}
            />

            <svg
              ref={radarRef}
              role="img"
              aria-label={ariaLabel}
              viewBox="0 0 340 340"
              style={{
                width: '100%',
                height: '100%',
                userSelect: 'none',
                transform: `perspective(600px) rotateX(${parallax.y * -0.5}deg) rotateY(${parallax.x * 0.5}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeaveRadar}
            >
              <defs>
                {/* Glow Filter for active hover ring */}
                <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="tip-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Faint gauge tick marks on outer track, rotating slowly 60s per turn (Phase 2 requirement) */}
              <g
                style={{
                  transformOrigin: '170px 170px',
                  animation: isIdleActive && !prefersReducedMotion ? 'rotateTicks 60s linear infinite' : 'none',
                  opacity: isIdleActive ? 0.35 : 0.15,
                  transition: 'opacity 0.5s ease',
                }}
              >
                {Array.from({ length: 48 }).map((_, tIdx) => {
                  const angle = (tIdx / 48) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 170 + 154 * Math.cos(rad);
                  const y1 = 170 + 154 * Math.sin(rad);
                  const x2 = 170 + 158 * Math.cos(rad);
                  const y2 = 170 + 158 * Math.sin(rad);
                  return (
                    <line
                      key={`tick-${tIdx}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth={tIdx % 4 === 0 ? '1.5' : '0.8'}
                    />
                  );
                })}
              </g>

              {/* Outer Ghost Arc for Potential Score (Phase 4a requirement) */}
              <circle
                cx="170"
                cy="170"
                r={potentialRing.radius}
                fill="none"
                stroke="rgba(16, 185, 129, 0.18)"
                strokeWidth="2"
                strokeDasharray="4 4"
                transform="rotate(-90 170 170)"
              />
              {potential.potentialGain > 0 && (
                <circle
                  cx="170"
                  cy="170"
                  r={potentialRing.radius}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeDasharray={`${potentialRing.strokeLength} ${potentialRing.circumference}`}
                  strokeDashoffset={hasLoaded ? 0 : potentialRing.circumference}
                  strokeLinecap="round"
                  transform="rotate(-90 170 170)"
                  style={{
                    transition: prefersReducedMotion ? 'none' : 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    opacity: 0.65,
                  }}
                />
              )}

              {/* Background Concentric Circular Base Tracks */}
              {radarDimensions.map(({ cat, geo, ringIndex }) => (
                <circle
                  key={`bg-track-${cat.id}`}
                  cx="170"
                  cy="170"
                  r={geo.radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="4"
                  style={{
                    transform: `translate(${parallax.x * (ringIndex * 0.4)}px, ${parallax.y * (ringIndex * 0.4)}px)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                />
              ))}

              {/* Data-Driven Concentric Rings Sweeping 0 -> Value (Phase 2 Load Sequence) */}
              {radarDimensions.map(({ cat, geo, staggerDelay, tipX, tipY, ringIndex }) => {
                const isHovered = hoveredCategory?.id === cat.id;
                const isDimmed = hoveredCategory !== null && !isHovered;
                const ringStrokeWidth = isHovered ? 7.5 : 4.5;

                // Parallax per-layer offset (Phase 3 requirement: 2-4px depth)
                const layerOffset = {
                  x: parallax.x * (ringIndex * 0.4),
                  y: parallax.y * (ringIndex * 0.4),
                };

                return (
                  <g
                    key={`ring-group-${cat.id}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${cat.label}: ${cat.score}%. Click to view details.`}
                    style={{
                      cursor: 'pointer',
                      outline: 'none',
                      transform: `translate(${layerOffset.x}px, ${layerOffset.y}px)`,
                      transition: 'transform 0.15s ease-out, opacity 0.25s ease',
                      opacity: isDimmed ? 0.35 : 1,
                    }}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onFocus={() => setHoveredCategory(cat)}
                    onBlur={() => setHoveredCategory(null)}
                    onClick={() => onNavigateTab(cat.targetTab)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onNavigateTab(cat.targetTab);
                      }
                    }}
                  >
                    {/* Active Ring Stroke */}
                    <circle
                      cx="170"
                      cy="170"
                      r={geo.radius}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth={ringStrokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={geo.strokeDasharray}
                      strokeDashoffset={
                        hasLoaded || prefersReducedMotion ? geo.strokeDashoffset : geo.circumference
                      }
                      transform="rotate(-90 170 170)"
                      filter={isHovered ? 'url(#radar-glow)' : 'none'}
                      style={{
                        transition: prefersReducedMotion
                          ? 'stroke-width 0.2s ease'
                          : `stroke-dashoffset ${RING_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${staggerDelay}ms, stroke-width 0.2s ease`,
                      }}
                    />

                    {/* Glowing End-Cap Dot Riding Stroke Tip (Phase 2 requirement) */}
                    {(hasLoaded || prefersReducedMotion) && cat.score > 2 && (
                      <circle
                        cx={tipX}
                        cy={tipY}
                        r={isHovered ? 4.5 : 3.2}
                        fill="#FFFFFF"
                        stroke={cat.color}
                        strokeWidth="2"
                        filter="url(#tip-glow)"
                        style={{
                          pointerEvents: 'none',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* CENTER OF RADAR: ONLY Score Number & "/100" (Phase 1 requirement: nothing overlaps a ring line) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '136px',
                height: '136px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                transition: 'opacity 0.15s ease',
              }}
            >
              {/* Category label crossfade on hover */}
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: hoveredCategory ? hoveredCategory.color : '#8E8E8E',
                  transition: 'color 0.15s ease',
                  marginBottom: '2px',
                }}
              >
                {centerLabel}
              </span>

              {/* Large Score Number with tabular-nums so it doesn't jitter */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', lineHeight: 1 }}>
                <span
                  className="radar-center-score"
                  style={{
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: '#FFFFFF',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {centerValue}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#888888', marginLeft: '2px' }}>
                  /100
                </span>
              </div>

              {/* Weight indicator or subtle status */}
              <span style={{ marginTop: '4px', fontSize: '0.66rem', fontWeight: 600, color: '#666666' }}>
                {hoveredCategory ? `${hoveredCategory.weight}% wt` : `${categories.length} dimensions`}
              </span>
            </div>

            {/* Floating Delta Badge when score changes (Phase 2 requirement) */}
            {scoreDelta !== null && (
              <div
                aria-hidden="true"
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  background: scoreDelta >= 0 ? '#10B981' : '#E50920',
                  color: '#FFFFFF',
                }}
              >
                <span>{scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}</span>
              </div>
            )}
          </div>

          {/* Pill BELOW Radar (Phase 1 requirement: "GOOD FOUNDATION" pill moved below) */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: centerBand.color,
                backgroundColor: centerBand.bgColor,
                border: `1px solid ${centerBand.borderColor}`,
                opacity: bandPillVisible || prefersReducedMotion ? 1 : 0,
                transform: bandPillVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(6px)',
                transition: 'all 0.5s ease',
              }}
            >
              {centerBand.label}
            </div>

            {/* Linked Legend next to/under radar: dot + name + score (Phase 1 & 3 requirements) */}
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px 12px',
                maxWidth: '360px',
              }}
            >
              {categories.map((cat) => {
                const isHovered = hoveredCategory?.id === cat.id;
                const isDimmed = hoveredCategory !== null && !isHovered;
                return (
                  <button
                    key={`legend-${cat.id}`}
                    type="button"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onFocus={() => setHoveredCategory(cat)}
                    onBlur={() => setHoveredCategory(null)}
                    onClick={() => onNavigateTab(cat.targetTab)}
                    className="radar-legend-item"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: isDimmed ? 0.35 : 1,
                      transition: 'opacity 0.15s ease, background 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: cat.color,
                        boxShadow: isHovered ? `0 0 6px ${cat.color}` : 'none',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: isHovered ? '#FFFFFF' : '#B0B0B0', fontWeight: isHovered ? 700 : 500 }}>
                      {cat.label}
                    </span>
                    <span style={{ color: '#888888', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {cat.score}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bars + Category Breakdown with Weight & Hover Tooltip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Active Highlight Card / Tooltip Info (Phase 3 requirement: weight + real reason) */}
          <div
            style={{
              borderRadius: '12px',
              border: `1px solid ${hoveredCategory ? `${hoveredCategory.color}60` : 'rgba(255, 255, 255, 0.08)'}`,
              background: hoveredCategory ? 'rgba(24, 24, 24, 0.95)' : '#141414',
              padding: '16px 18px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: (hoveredCategory || categories[0]).color,
                    boxShadow: `0 0 8px ${(hoveredCategory || categories[0]).color}`,
                  }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {(hoveredCategory || categories[0]).label}
                </span>
                <span
                  style={{
                    borderRadius: '4px',
                    backgroundColor: '#202020',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#B0B0B0',
                  }}
                >
                  {(hoveredCategory || categories[0]).weight}% weight
                </span>
              </div>

              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: (hoveredCategory || categories[0]).color }}>
                  {(hoveredCategory || categories[0]).score}%
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5, color: '#A0A0A0' }}>
              {(hoveredCategory || categories[0]).reason}
            </p>

            <button
              type="button"
              onClick={() => onNavigateTab((hoveredCategory || categories[0]).targetTab)}
              style={{
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: (hoveredCategory || categories[0]).color,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span>Drill into {(hoveredCategory || categories[0]).label}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Category Bars List: linked to radar (fills in sync, 60ms stagger) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat, bIdx) => {
              const isHovered = hoveredCategory?.id === cat.id;
              const isDimmed = hoveredCategory !== null && !isHovered;
              const fillStaggerDelay = bIdx * 60;

              return (
                <div
                  key={`bar-${cat.id}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${cat.label} ${cat.score} percent`}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onFocus={() => setHoveredCategory(cat)}
                  onBlur={() => setHoveredCategory(null)}
                  onClick={() => onNavigateTab(cat.targetTab)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigateTab(cat.targetTab);
                    }
                  }}
                  className="category-bar-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 48px',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    opacity: isDimmed ? 0.35 : 1,
                    transition: 'all 0.15s ease',
                    outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: cat.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: isHovered ? 700 : 500,
                        color: isHovered ? '#FFFFFF' : '#CCCCCC',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {cat.label}
                    </span>
                  </div>

                  {/* Horizontal Bar with fill animation in sync */}
                  <div
                    style={{
                      position: 'relative',
                      height: '8px',
                      width: '100%',
                      overflow: 'hidden',
                      borderRadius: '9999px',
                      backgroundColor: '#161616',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '9999px',
                        width: hasLoaded || prefersReducedMotion ? `${cat.score}%` : '0%',
                        backgroundColor: cat.color,
                        boxShadow: isHovered ? `0 0 10px ${cat.color}` : 'none',
                        transition: prefersReducedMotion ? 'none' : 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                        transitionDelay: prefersReducedMotion ? '0ms' : `${fillStaggerDelay}ms`,
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#E0E0E0',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {cat.score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .radar-content-grid {
          display: grid;
          grid-template-columns: minmax(320px, 1fr) minmax(320px, 1.1fr);
          align-items: center;
          gap: 36px;
        }

        @media (max-width: 900px) {
          .radar-content-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }

        @keyframes breatheGlow {
          0% { transform: scale(0.95); opacity: 0.5; }
          100% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes rotateTicks {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
