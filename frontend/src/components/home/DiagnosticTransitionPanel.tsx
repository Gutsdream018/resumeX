import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AnimatePresence,
  motion,
  Variants,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
import './DiagnosticTransitionPanel.css';

/* =========================================================================
   TIMING CONSTANTS (Exposed at top of file for tuning feel)
   ========================================================================= */
export const FLIP_MS = 720;     // 3D left-to-right flip duration
export const STAGGER_MS = 70;   // Choreography stagger base interval (60–80ms offsets)
export const AUTO_MS = 4000;    // 4s auto progression timer

/* =========================================================================
   5 STEPS DATA ARRAY (Preloaded for zero wait on transition)
   ========================================================================= */
export interface DiagnosticStep {
  id: number;
  stepNumber: string;
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  score: number;
  previousScore?: number;
  delta?: string;
  statusText: string;
  statusColor?: string;
  impactScore: number;
  keywordScore: number;
  structureScore: number;
  readabilityScore: number;
  beforeSnippet: {
    header: string;
    text: string;
    flawNotice: string;
  };
  flaws: string[];
  afterSnippet: {
    header: string;
    text: string;
    improvements: string[];
  };
  recruiterTip: string;
}

export const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  {
    id: 1,
    stepNumber: 'Step 1 of 5',
    title: 'Quantify Impact (XYZ Formula)',
    badge: '+10 Pts Lift',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    score: 68,
    previousScore: 58,
    delta: '+10',
    statusText: 'MEASURABLE IMPACT',
    statusColor: '#34d399',
    impactScore: 72,
    keywordScore: 52,
    structureScore: 65,
    readabilityScore: 68,
    beforeSnippet: {
      header: 'ORIGINAL DRAFT',
      text: 'Worked on customer support portal and fixed reported bugs.',
      flawNotice: 'Lacks scale, outcome, and tech stack details',
    },
    flaws: ['No scale or outcome metrics', 'Missing core tech stack', 'Passive framing'],
    afterSnippet: {
      header: 'OPTIMIZED',
      text: 'Architected full-stack React/Node support portal, cutting ticket resolution latency by 34% across 18,000 monthly enterprise users.',
      improvements: ['34% latency reduction', '18,000 enterprise users', 'React & Node.js'],
    },
    recruiterTip: 'Frame bullets with Google’s rule: Accomplished [X], measured by [Y], by doing [Z].',
  },
  {
    id: 2,
    stepNumber: 'Step 2 of 5',
    title: 'Inject ATS Keywords & Tech Stack',
    badge: '+10 Pts Keywords',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    score: 78,
    previousScore: 68,
    delta: '+10',
    statusText: 'KEYWORD MATCH',
    statusColor: '#34d399',
    impactScore: 75,
    keywordScore: 84,
    structureScore: 70,
    readabilityScore: 75,
    beforeSnippet: {
      header: 'ORIGINAL DRAFT',
      text: 'Maintained backend databases and deployed software to cloud servers.',
      flawNotice: 'Missing key recruiter search terms (AWS, Docker, PostgreSQL)',
    },
    flaws: ['Missing recruiter search terms', 'Generic database maintenance', 'Zero cloud taxonomy'],
    afterSnippet: {
      header: 'OPTIMIZED',
      text: 'Automated CI/CD pipelines with Docker & AWS ECS, tuning PostgreSQL read replicas to scale query throughput 4x to 4,200 req/sec.',
      improvements: ['Docker & AWS ECS', 'PostgreSQL tuning', '4,200 req/sec scale'],
    },
    recruiterTip: 'ATS filters screen for exact skills. Missing essential keywords can silently filter your resume.',
  },
  {
    id: 3,
    stepNumber: 'Step 3 of 5',
    title: 'ATS Single-Column Format',
    badge: '+8 Pts Parsing',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    score: 86,
    previousScore: 78,
    delta: '+8',
    statusText: 'LAYOUT VALIDATED',
    statusColor: '#34d399',
    impactScore: 80,
    keywordScore: 88,
    structureScore: 94,
    readabilityScore: 85,
    beforeSnippet: {
      header: 'ORIGINAL DRAFT',
      text: 'Nested 2-column layout with icon graphics, floating skill meter bars, and text boxes.',
      flawNotice: 'Tables and columns cause parsing failures in Workday and Taleo',
    },
    flaws: ['Nested 2-column table layout', 'Floating skill bar graphics', 'Text-box dropouts in ATS'],
    afterSnippet: {
      header: 'OPTIMIZED',
      text: 'Standardized single-column chronological format with 0.65" margins, clean hierarchy, and standard bullet formatting.',
      improvements: ['100% ATS parse pass', '0.65" margin standard', 'No text-box dropouts'],
    },
    recruiterTip: 'Use clean single-column layouts. Multi-column tables cause up to 75% of parsing errors.',
  },
  {
    id: 4,
    stepNumber: 'Step 4 of 5',
    title: 'Executive Summary Hook',
    badge: '+6 Pts Authority',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    score: 92,
    previousScore: 86,
    delta: '+6',
    statusText: 'EXECUTIVE HOOK',
    statusColor: '#34d399',
    impactScore: 88,
    keywordScore: 92,
    structureScore: 96,
    readabilityScore: 92,
    beforeSnippet: {
      header: 'ORIGINAL DRAFT',
      text: 'Hardworking software developer seeking a challenging role at a growth company where I can apply my skills.',
      flawNotice: 'Generic objective statement recruiters immediately skip',
    },
    flaws: ['Generic objective statement', 'No seniority stated (6+ yrs)', 'Zero business scale proof'],
    afterSnippet: {
      header: 'OPTIMIZED',
      text: 'Senior Full-Stack Engineer with 6+ years in distributed systems and cloud architecture. Track record scaling microservices to 50M+ requests/day.',
      improvements: ['6+ years seniority', 'Distributed systems focus', '50M+ requests/day scale'],
    },
    recruiterTip: 'Skip generic objectives. Open with a 2-line summary establishing your core expertise and scale.',
  },
  {
    id: 5,
    stepNumber: 'Step 5 of 5',
    title: 'Authoritative Verbs & 2-Line Skim',
    badge: '+4 Pts Polish',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    score: 96,
    previousScore: 92,
    delta: '+4',
    statusText: '6-SEC SKIM PASS',
    statusColor: '#34d399',
    impactScore: 94,
    keywordScore: 96,
    structureScore: 98,
    readabilityScore: 98,
    beforeSnippet: {
      header: 'ORIGINAL DRAFT',
      text: 'Assisted with team meetings and participated in code reviews while helping design team on UI components.',
      flawNotice: 'Passive filler words ("assisted", "helped") dilute your impact',
    },
    flaws: ['Passive filler verbs ("assisted")', 'Vague team participation', 'Diluted ownership proof'],
    afterSnippet: {
      header: 'OPTIMIZED',
      text: 'Spearheaded code quality across 10 engineers, standardizing PR reviews and unit tests to cut production defects by 41%.',
      improvements: ['Action verbs: Spearheaded, Standardized', 'Cut passive filler words', 'Rapid 2-line scan'],
    },
    recruiterTip: 'Start every bullet point with an active past-tense verb and keep it under two lines.',
  },
];

interface DiagnosticTransitionPanelProps {
  slides?: DiagnosticStep[];
  currentSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  onNavigateDestination?: (destinationTab: string) => void;
}

export const DiagnosticTransitionPanel: React.FC<DiagnosticTransitionPanelProps> = ({
  slides = DIAGNOSTIC_STEPS,
  currentSlideIndex,
  onSlideChange,
  onNavigateDestination,
}) => {
  // Start on Step 3 of 5 (index 2)
  const [activeIdx, setActiveIdx] = useState<number>(() => {
    if (typeof currentSlideIndex === 'number' && currentSlideIndex >= 0 && currentSlideIndex < slides.length) {
      return currentSlideIndex;
    }
    return 2;
  });

  // 3D Flip Direction: 1 = Next (Left-to-Right), -1 = Prev (Right-to-Left)
  const [direction, setDirection] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [buttonRipple, setButtonRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mouse tilt motion values (max ±4deg, spring-smoothed)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    stiffness: 300,
    damping: 30,
  });
  const smoothRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 300,
    damping: 30,
  });

  // Keep parent in sync
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(activeIdx);
    }
  }, [activeIdx, onSlideChange]);

  // Advance to Next Step (Smooth Left-to-Right 3D Flip)
  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setDirection(1);
    setIsTransitioning(true);
    setAutoProgress(0);
    setActiveIdx((prev) => (prev + 1) % slides.length);
  }, [isTransitioning, slides.length]);

  // Advance to Previous Step
  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setDirection(-1);
    setIsTransitioning(true);
    setAutoProgress(0);
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }, [isTransitioning, slides.length]);

  // Jump to specific step from dots
  const handleSelectStep = useCallback((idx: number) => {
    if (idx === activeIdx || isTransitioning) return;
    setDirection(idx > activeIdx ? 1 : -1);
    setIsTransitioning(true);
    setAutoProgress(0);
    setActiveIdx(idx);
  }, [activeIdx, isTransitioning]);

  // 4s Auto-advance timer (pauses on hover or during flip transition)
  useEffect(() => {
    if (!isAutoPlaying || isHovered || isTransitioning || prefersReducedMotion) {
      return;
    }

    const intervalMs = 40;
    const stepIncrement = (intervalMs / AUTO_MS) * 100;

    const timer = setInterval(() => {
      setAutoProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, isTransitioning, prefersReducedMotion, handleNext]);

  // Keyboard navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Mouse move handler for spring tilt (±4deg)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTransitioning || prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Button Click Ripple on "Apply Next Fix"
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setButtonRipple({ x, y, id: Date.now() });

    setTimeout(() => {
      setButtonRipple(null);
    }, 600);

    handleNext();
  };

  // 3D Smooth Left-to-Right Flip Variants (Calibrated Apple-grade easing)
  const flipVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? -75 : 75,
      rotateY: dir > 0 ? -22 : 22,
      scale: 0.97,
      opacity: 0,
    }),
    center: {
      x: 0,
      rotateY: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.44,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? 75 : -75,
      rotateY: dir > 0 ? 22 : -22,
      scale: 0.97,
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.38,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    }),
  };

  const currentStep = slides[activeIdx] || slides[0];

  return (
    <div
      ref={containerRef}
      className="diagnostic-perspective-container"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Red Glow Box behind card */}
      <div
        style={{
          position: 'absolute',
          inset: '-10px',
          background: 'radial-gradient(ellipse at center, rgba(229, 48, 58, 0.22) 0%, transparent 70%)',
          filter: 'blur(32px)',
          zIndex: 0,
          borderRadius: '24px',
          pointerEvents: 'none',
        }}
      />

      {/* Card Outer Shell with Ambient Float & Pointer Tilt */}
      <motion.div
        className="diagnostic-card-shell"
        animate={
          prefersReducedMotion
            ? { y: 0 }
            : { y: [-3, 3, -3] }
        }
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut',
        }}
        style={{
          rotateX: prefersReducedMotion ? 0 : smoothRotateX,
          rotateY: prefersReducedMotion ? 0 : smoothRotateY,
        }}
      >
        {/* Slow Rotating Conic-Gradient Border (12% opacity) */}
        <div className="conic-border-glow" />

        {/* Moving Specular Highlight Sheen Sweeping Across from Left to Right */}
        <AnimatePresence>
          {isTransitioning && !prefersReducedMotion && (
            <motion.div
              key={`sheen-${activeIdx}`}
              className="flip-specular-sheen"
              initial={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
              animate={{
                x: direction > 0 ? '160%' : '-160%',
                opacity: [0, 0.45, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.44, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* 3D Flip Stage Container */}
        <div className="diagnostic-flip-stage">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={activeIdx}
              custom={direction}
              variants={flipVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onAnimationComplete={() => setIsTransitioning(false)}
              className="diagnostic-flip-card"
            >
              <CardFaceContent
                step={currentStep}
                isAutoPlaying={isAutoPlaying}
                setIsAutoPlaying={setIsAutoPlaying}
                isHovered={isHovered}
                autoProgress={autoProgress}
                onApplyClick={handleButtonClick}
                buttonRipple={buttonRipple}
                prefersReducedMotion={Boolean(prefersReducedMotion)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Statically Grounded Bottom Navigation: Arrows + Morphing Layout Dots */}
        <div className="diagnostic-card-footer">
          <motion.button
            type="button"
            onClick={handlePrev}
            whileTap={{ scale: 0.94 }}
            whileHover={{ x: -2 }}
            title="Previous Step (←)"
            aria-label="Previous Step"
            className="nav-arrow-btn"
          >
            <ChevronLeft size={14} />
          </motion.button>

          {/* Morphing Pagination Dots (Active dot morphs into red pill) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {slides.map((_, idx) => {
              const isActive = activeIdx === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectStep(idx)}
                  title={`Go to step ${idx + 1}`}
                  className="dot-btn"
                  style={{
                    height: '6px',
                    width: isActive ? '22px' : '6px',
                    borderRadius: '9999px',
                    background: isActive ? '#E5303A' : 'rgba(255, 255, 255, 0.18)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    transition: 'width 0.25s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.25s ease',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-dot-pill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '9999px',
                        boxShadow: '0 0 8px rgba(229, 48, 58, 0.7)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <motion.button
            type="button"
            onClick={handleNext}
            whileTap={{ scale: 0.94 }}
            whileHover={{ x: 2 }}
            title="Next Step (→)"
            aria-label="Next Step"
            className="nav-arrow-btn"
          >
            <ChevronRight size={14} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

/* =========================================================================
   CARD FACE CONTENT COMPONENT (Twin Text Boxes with Balanced Frame)
   ========================================================================= */
interface CardFaceContentProps {
  step: DiagnosticStep;
  isAutoPlaying: boolean;
  setIsAutoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isHovered: boolean;
  autoProgress: number;
  onApplyClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  buttonRipple: { x: number; y: number; id: number } | null;
  prefersReducedMotion: boolean;
}

const CardFaceContent: React.FC<CardFaceContentProps> = ({
  step,
  isAutoPlaying,
  setIsAutoPlaying,
  isHovered,
  autoProgress,
  onApplyClick,
  buttonRipple,
  prefersReducedMotion,
}) => {
  // Choreography timeline offsets
  const tHeader = 0;
  const tRing = STAGGER_MS / 1000; // 0.07s
  const tRingDuration = prefersReducedMotion ? 0.01 : 1.1;
  const tBadge = tRing + tRingDuration; // Pops in after ring completes (~1.17s)
  const tBarsBase = (STAGGER_MS * 2) / 1000; // 0.14s
  const tStatusPill = (STAGGER_MS * 3) / 1000; // 0.21s
  const tDraft = (STAGGER_MS * 4) / 1000; // 0.28s
  const tOptimized = (STAGGER_MS * 5) / 1000; // 0.35s
  const tTip = (STAGGER_MS * 6) / 1000; // 0.42s

  // Synchronized score number count-up (smooth delta lift from previousScore to current score)
  const previousScoreVal = step.previousScore ?? Math.max(0, step.score - 10);
  const [animatedScore, setAnimatedScore] = useState<number>(step.score);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedScore(step.score);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 750;
    const startVal = previousScoreVal;
    const endVal = step.score;
    let frameId: number;

    const delayTimer = setTimeout(() => {
      const stepCounter = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (endVal - startVal) * easeOut);
        setAnimatedScore(current);

        if (progress < 1) {
          frameId = requestAnimationFrame(stepCounter);
        } else {
          setAnimatedScore(endVal);
        }
      };
      frameId = requestAnimationFrame(stepCounter);
    }, STAGGER_MS);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(frameId);
    };
  }, [step.score, previousScoreVal, prefersReducedMotion]);

  // Score tip end-cap beacon calculation
  const clampedScore = Math.min(100, Math.max(0, animatedScore));
  const angleDeg = (clampedScore / 100) * 360 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const r = 15.9155;
  const tipCx = 18 + r * Math.cos(angleRad);
  const tipCy = 18 + r * Math.sin(angleRad);


  return (
    <>
      {/* a. Header Row */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tHeader, duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1F1F1F',
          paddingBottom: '11px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E5303A' }} />
          <span
            style={{
              fontSize: '0.7rem',
              color: '#888888',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {step.stepNumber}
          </span>
          <span style={{ color: '#333333' }}>/</span>
          <span style={{ fontSize: '0.8rem', color: '#E4E4E7', fontWeight: 600 }}>
            {step.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 4s Auto Timer Toggle Pill */}
          <motion.button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            title={isAutoPlaying ? 'Pause 4s auto-advance' : 'Resume 4s auto-advance'}
            initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: tHeader + 0.05, duration: 0.25 }}
            className="auto-play-toggle-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '4px',
              border: '1px solid #2A2A2A',
              background: 'rgba(255, 255, 255, 0.02)',
              color: isHovered ? '#fbbf24' : isAutoPlaying ? '#34d399' : '#71717A',
              fontSize: '0.62rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isAutoPlaying && !isHovered ? <Pause size={8} /> : <Play size={8} />}
            <span>{isHovered ? 'PAUSED' : isAutoPlaying ? '4s AUTO' : 'PAUSED'}</span>
          </motion.button>

          {/* Step Badge */}
          <motion.span
            initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: tHeader + 0.08, duration: 0.25 }}
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: step.badgeBg,
              color: step.badgeColor,
              border: `1px solid ${step.badgeColor}30`,
            }}
          >
            {step.badge}
          </motion.span>
        </div>
      </motion.div>

      {/* Top 4s Progression Timer Line */}
      <div
        style={{
          width: '100%',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '1px',
          marginBottom: '14px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #E5303A, #34d399)',
            width: isHovered || !isAutoPlaying ? '100%' : `${autoProgress}%`,
            opacity: isHovered || !isAutoPlaying ? 0.3 : 1,
            transition: 'width 0.04s linear',
          }}
        />
      </div>

      {/* Top Row: SVG Score Ring + 4 Dimension Progress Bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '125px 1fr',
          gap: '14px',
          marginBottom: '10px',
          background: '#0D0D0D',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid #222222',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* b & c. Score Ring with stroke-dashoffset & riding end-cap dot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', width: '88px', height: '88px' }}>
            <svg
              className="w-full h-full"
              viewBox="0 0 36 36"
              style={{ transform: 'rotate(0deg)' }}
            >
              {/* Background Track */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#222222"
                strokeWidth="2.8"
              />

              {/* Animated Stroke Dashoffset Arc */}
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeDasharray="100, 100"
                initial={prefersReducedMotion ? false : { strokeDashoffset: 100 - previousScoreVal }}
                animate={{ strokeDashoffset: 100 - step.score }}
                transition={{
                  delay: 0.05,
                  duration: prefersReducedMotion ? 0.01 : 0.5,
                  ease: 'easeOut',
                }}
              />

              {/* End-cap dot riding stroke tip */}
              {!prefersReducedMotion && (
                <circle
                  cx={tipCx}
                  cy={tipCy}
                  r="1.8"
                  fill="#FFFFFF"
                  stroke="#10b981"
                  strokeWidth="0.8"
                  style={{
                    filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.9))',
                  }}
                />
              )}
            </svg>

            {/* Center Tabular-Nums Count-Up */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="tabular-numbers"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {animatedScore}
              </span>
              <span style={{ fontSize: '0.55rem', color: '#71717A', marginTop: '2px', fontWeight: 600 }}>
                / 100
              </span>
            </div>
          </div>

          <span style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 600, marginTop: '3px' }}>
            ATS Score
          </span>

          {/* c. "+8" Delta Badge (pops in with spring + pulse ring) */}
          {step.delta && (
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 18,
                delay: tBadge,
              }}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Single Pulse Ring */}
              {!prefersReducedMotion && (
                <motion.span
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ delay: tBadge, duration: 0.65, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.4)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)',
                }}
              >
                {step.delta}
              </span>
            </motion.div>
          )}

          {/* e. Status Pill with pulsing/breathing dot */}
          <div
            style={{
              marginTop: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 6px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 1 }}
              animate={prefersReducedMotion ? {} : { scale: [1, 1.4, 1] }}
              transition={{ delay: tStatusPill, duration: 0.35 }}
              className="status-dot-breathing"
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: step.statusColor || '#34d399',
              }}
            />
            <span
              style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                color: '#D4D4D8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {step.statusText}
            </span>
          </div>
        </div>

        {/* d. 4 Dimension Metric Bars (grows 0 -> value with 90ms stagger) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            { label: 'Measurable Impact', value: step.impactScore },
            { label: 'ATS Keyword Coverage', value: step.keywordScore },
            { label: 'Structure & Layout Parsing', value: step.structureScore },
            { label: '6-Second Skimmability', value: step.readabilityScore },
          ].map((metric, mIdx) => {
            const barDelay = tBarsBase + mIdx * 0.09;
            const barColor = metric.value >= 80 ? '#10b981' : metric.value >= 65 ? '#f59e0b' : '#e31b2b';

            return (
              <div key={metric.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px' }}>
                  <span style={{ color: '#D4D4D4' }}>{metric.label}</span>
                  <span className="tabular-numbers" style={{ color: barColor, fontWeight: 600 }}>
                    {metric.value}%
                  </span>
                </div>
                <div
                  style={{
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={prefersReducedMotion ? false : { width: `${Math.max(0, metric.value - 12)}%` }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{
                      delay: 0.08 + mIdx * 0.04,
                      duration: prefersReducedMotion ? 0.01 : 0.42,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      height: '100%',
                      background: barColor,
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Middle Body: Twin Text Boxes with Balanced Frame & Equal Length         */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: '9px',
          marginBottom: '10px',
        }}
      >
        {/* f. ORIGINAL DRAFT Frame (Identical 96px length, 3 flaw micro-chips) */}
        <motion.div
          initial={prefersReducedMotion ? false : { x: -16, opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: 0.7, x: 0 }
              : {
                  x: 0,
                  opacity: [0, 1, 0.75],
                }
          }
          transition={{
            delay: tDraft,
            duration: 0.8,
            times: [0, 0.35, 1],
          }}
          style={{
            height: '98px',
            background: 'rgba(239, 68, 68, 0.025)',
            border: '1px solid rgba(239, 68, 68, 0.16)',
            borderRadius: '8px',
            padding: '9px 12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#F87171', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {step.beforeSnippet.header}
            </span>
            <span style={{ fontSize: '0.67rem', color: '#A1A1AA' }}>
              {step.beforeSnippet.flawNotice}
            </span>
          </div>

          {/* Quoted Text */}
          <p
            style={{
              fontSize: '0.78rem',
              color: '#A1A1AA',
              lineHeight: 1.38,
              margin: 0,
              textDecoration: 'line-through',
              textDecorationColor: 'rgba(239, 68, 68, 0.45)',
            }}
          >
            "{step.beforeSnippet.text}"
          </p>

          {/* Bottom Flaw Micro-Chips (Equal visual structure to Optimized box) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {step.flaws.map((flaw, fIdx) => (
              <span
                key={fIdx}
                style={{
                  fontSize: '0.63rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239, 68, 68, 0.18)',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: '#F87171', fontWeight: 700 }}>✕</span>
                <span>{flaw}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* g. OPTIMIZED Frame (Identical 96px length, Calibrated tag, word-by-word reveal, 3 improvement chips) */}
        <motion.div
          initial={prefersReducedMotion ? false : { x: 16, opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1, x: 0 }
              : {
                  x: 0,
                  opacity: 1,
                  boxShadow: [
                    '0 0 0px transparent',
                    '0 0 18px rgba(16, 185, 129, 0.35)',
                    '0 0 0px transparent',
                  ],
                }
          }
          transition={{
            delay: tOptimized,
            duration: 0.7,
          }}
          style={{
            height: '98px',
            background: 'rgba(16, 185, 129, 0.035)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            borderRadius: '8px',
            padding: '9px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#34D399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {step.afterSnippet.header}
            </span>

            {/* Calibrated Tag Fades in */}
            <motion.span
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: tOptimized + 0.15, duration: 0.3 }}
              style={{
                fontSize: '0.65rem',
                color: '#34D399',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              Calibrated
            </motion.span>
          </div>

          {/* Optimized Text */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            style={{ fontSize: '0.78rem', color: '#F9FAFB', lineHeight: 1.38, fontWeight: 500, margin: 0 }}
          >
            "{step.afterSnippet.text}"
          </motion.p>

          {/* 3 Improvement chips popping in with check drawing itself */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {step.afterSnippet.improvements.map((tag, tIdx) => {
              const chipDelay = tOptimized + 0.35 + tIdx * 0.08;

              return (
                <motion.span
                  key={tIdx}
                  initial={prefersReducedMotion ? false : { scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: chipDelay, duration: 0.25 }}
                  style={{
                    fontSize: '0.63rem',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: '#A7F3D0',
                    border: '1px solid rgba(16, 185, 129, 0.18)',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {/* Drawing SVG Check Icon */}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={prefersReducedMotion ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        delay: chipDelay + 0.05,
                        duration: prefersReducedMotion ? 0.01 : 0.28,
                        ease: 'easeOut',
                      }}
                    />
                  </svg>
                  <span>{tag}</span>
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* h. Bottom Footer: Recruiter Tip & Step Advance Action */}
      <div
        style={{
          borderTop: '1px solid #1F1F1F',
          paddingTop: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Recruiter Tip Fades In */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: tTip, duration: 0.35 }}
          style={{ flex: 1 }}
        >
          <p style={{ fontSize: '0.72rem', color: '#8E8E93', lineHeight: 1.42, margin: 0 }}>
            <span style={{ color: '#E4E4E7', fontWeight: 600 }}>Tip: </span>
            {step.recruiterTip}
          </p>
        </motion.div>

        {/* "Apply Next Fix" Button with Red Glow Pulse Once + Ripple */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button
            type="button"
            onClick={onApplyClick}
            className="apply-fix-btn btn btn-red"
            initial={prefersReducedMotion ? false : { boxShadow: '0 0 0px transparent' }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    boxShadow: [
                      '0 0 0px transparent',
                      '0 0 24px rgba(229, 48, 58, 0.65)',
                      '0 0 0px transparent',
                    ],
                  }
            }
            transition={{ delay: tTip + 0.1, duration: 0.8 }}
            style={{
              padding: '6px 14px',
              fontSize: '0.76rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Click Ripple Effect */}
            {buttonRipple && (
              <motion.span
                className="ripple-wave"
                style={{
                  left: buttonRipple.x,
                  top: buttonRipple.y,
                  width: '20px',
                  height: '20px',
                }}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 6, opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            )}
            <span>Apply Next Fix</span>
            <ArrowRight size={13} />
          </motion.button>
        </div>
      </div>
    </>
  );
};
