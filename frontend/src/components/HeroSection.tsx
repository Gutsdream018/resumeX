import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle,
  FileText,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react';
import { ScoreMeter } from './ScoreMeter';
import { DiagnosticTransitionPanel, DIAGNOSTIC_STEPS } from './home/DiagnosticTransitionPanel';

interface HeroSectionProps {
  onAnalyzeClick: () => void;
  onHowItWorksClick: () => void;
  onApplyFixDestination?: (destinationTab: string) => void;
}

interface ImprovementSlide {
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
  impactScore: number;
  keywordScore: number;
  structureScore: number;
  readabilityScore: number;
  beforeSnippet?: {
    header: string;
    text: string;
    flawNotice: string;
  };
  afterSnippet?: {
    header: string;
    text: string;
    improvements: string[];
  };
  finalOverview?: {
    summary: string;
    dimensions: { name: string; val: number }[];
  };
  recruiterTip: string;
}

const SLIDES: ImprovementSlide[] = [
  {
    id: 0,
    stepNumber: 'Diagnostic Baseline',
    title: 'Initial Resume Audit',
    badge: '4 Critical Flaws',
    badgeColor: '#fb7185',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    score: 58,
    statusText: 'FLAWS DETECTED',
    impactScore: 38,
    keywordScore: 45,
    structureScore: 62,
    readabilityScore: 50,
    beforeSnippet: {
      header: 'Original Draft',
      text: 'Responsible for web application features and fixing bugs. Participated in team standups and wrote database queries for reports.',
      flawNotice: 'No measurable results • Passive phrasing • Missing core tech stack',
    },
    recruiterTip: 'Recruiters scan resumes in 6 seconds. Highlight business outcomes instead of basic job responsibilities.',
  },
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
    impactScore: 72,
    keywordScore: 52,
    structureScore: 65,
    readabilityScore: 68,
    beforeSnippet: {
      header: 'Original Draft',
      text: 'Worked on customer support portal and fixed reported bugs.',
      flawNotice: 'Lacks scale, outcome, and tech stack details',
    },
    afterSnippet: {
      header: 'Optimized',
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
    impactScore: 75,
    keywordScore: 84,
    structureScore: 70,
    readabilityScore: 75,
    beforeSnippet: {
      header: 'Original Draft',
      text: 'Maintained backend databases and deployed software to cloud servers.',
      flawNotice: 'Missing key recruiter search terms (AWS, Docker, PostgreSQL)',
    },
    afterSnippet: {
      header: 'Optimized',
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
    impactScore: 80,
    keywordScore: 88,
    structureScore: 94,
    readabilityScore: 85,
    beforeSnippet: {
      header: 'Original Draft',
      text: 'Nested 2-column layout with icon graphics, floating skill meter bars, and text boxes.',
      flawNotice: 'Tables and columns cause parsing failures in Workday and Taleo',
    },
    afterSnippet: {
      header: 'Optimized',
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
    impactScore: 88,
    keywordScore: 92,
    structureScore: 96,
    readabilityScore: 92,
    beforeSnippet: {
      header: 'Original Draft',
      text: 'Hardworking software developer seeking a challenging role at a growth company where I can apply my skills.',
      flawNotice: 'Generic objective statement recruiters immediately skip',
    },
    afterSnippet: {
      header: 'Optimized',
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
    impactScore: 94,
    keywordScore: 96,
    structureScore: 98,
    readabilityScore: 98,
    beforeSnippet: {
      header: 'Original Draft',
      text: 'Assisted with team meetings and participated in code reviews while helping design team on UI components.',
      flawNotice: 'Passive filler words ("assisted", "helped") dilute your impact',
    },
    afterSnippet: {
      header: 'Optimized',
      text: 'Spearheaded code quality across 10 engineers, standardizing PR reviews and unit tests to cut production defects by 41%.',
      improvements: ['Action verbs: Spearheaded, Standardized', 'Cut passive filler words', 'Rapid 2-line scan'],
    },
    recruiterTip: 'Start every bullet point with an active past-tense verb and keep it under two lines.',
  },
  {
    id: 6,
    stepNumber: 'Shortlist Ready',
    title: 'Top 3% Profile Achieved',
    badge: 'Top 3% Applicant',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    score: 96,
    previousScore: 58,
    delta: '+38 Total',
    statusText: 'INTERVIEW READY',
    impactScore: 96,
    keywordScore: 96,
    structureScore: 98,
    readabilityScore: 98,
    finalOverview: {
      summary: 'Your resume is calibrated from 58 to an elite 96 ATS rating—ready for recruiter shortlists.',
      dimensions: [
        { name: 'ATS Compatibility', val: 98 },
        { name: 'Quantifiable Impact', val: 96 },
        { name: 'Tech Keyword Match', val: 96 },
        { name: 'Single-Column Structure', val: 98 },
        { name: 'Readability & Brevity', val: 98 },
      ],
    },
    recruiterTip: 'Resumes scoring 90+ receive up to 3.8x more recruiter interview requests.',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyzeClick,
  onHowItWorksClick,
  onApplyFixDestination,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(2);

  return (
    <section
      style={{
        padding: '52px 0 64px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Red Ambient Glow behind Hero */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '8%',
          width: '560px',
          height: '460px',
          background: 'radial-gradient(circle, rgba(227, 27, 43, 0.12) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: '40px',
            alignItems: 'start',
          }}
          className="hero-grid"
        >
          {/* Left Column: Copy, CTAs, Checkmarks (Fixed Anchor & Stable Height) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignSelf: 'start',
            }}
          >
            {/* Status Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '9999px',
                background: 'rgba(227, 27, 43, 0.06)',
                border: '1px solid rgba(227, 27, 43, 0.25)',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#E31B2B',
                  boxShadow: '0 0 6px #E31B2B',
                  animation: 'score-live-blink 1.4s infinite alternate',
                }}
              />
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#D4D4D8', letterSpacing: '0.03em' }}>
                ResumeX • AI Resume Intelligence Engine
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.2vw, 3.6rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                marginBottom: '16px',
              }}
            >
              Understand how your resume is seen.
              <br />
              <span style={{ color: '#E50920' }}>Build a stronger version.</span>
            </h1>

            {/* Subheading */}
            <p
              style={{
                fontSize: 'clamp(0.96rem, 1.25vw, 1.08rem)',
                color: '#9CA3AF',
                lineHeight: 1.6,
                maxWidth: '490px',
                marginBottom: '28px',
              }}
            >
              See how your resume matches target jobs, diagnose critical ATS filter friction, and craft grounded, metric-driven upgrades with zero hallucination.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                marginBottom: '32px',
              }}
            >
              <button
                onClick={onAnalyzeClick}
                className="btn btn-red"
                style={{
                  padding: '14px 28px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                <span>Upload & Audit My Resume</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={onHowItWorksClick}
                className="btn btn-secondary-dark"
                style={{
                  padding: '14px 22px',
                  fontSize: '0.96rem',
                }}
              >
                <span>See How It Works</span>
              </button>
            </div>

            {/* Verification Checklist */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '10px 18px',
                maxWidth: '500px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D1D5DB', fontSize: '0.84rem' }}>
                <span style={{ color: '#E31B2B', display: 'flex' }}><Check size={15} strokeWidth={2.4} /></span>
                <span>Live Score Meter</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D1D5DB', fontSize: '0.84rem' }}>
                <span style={{ color: '#E31B2B', display: 'flex' }}><Check size={15} strokeWidth={2.4} /></span>
                <span>Google XYZ Formula</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D1D5DB', fontSize: '0.84rem' }}>
                <span style={{ color: '#E31B2B', display: 'flex' }}><Check size={15} strokeWidth={2.4} /></span>
                <span>Keyword Match Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D1D5DB', fontSize: '0.84rem' }}>
                <span style={{ color: '#E31B2B', display: 'flex' }}><Check size={15} strokeWidth={2.4} /></span>
                <span>Single-Column Format</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Choreographed 3D Flip Card Carousel */}
          <div style={{ position: 'relative' }}>
            <DiagnosticTransitionPanel
              slides={DIAGNOSTIC_STEPS}
              currentSlideIndex={currentSlideIndex}
              onSlideChange={(newIdx) => setCurrentSlideIndex(newIdx)}
              onNavigateDestination={(destinationTab) => {
                if (onApplyFixDestination) {
                  onApplyFixDestination(destinationTab);
                } else {
                  onAnalyzeClick();
                }
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tab-progress-4s {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .bottom-arrow-nav-btn:hover {
          border-color: #E31B2B !important;
          color: #FFFFFF !important;
          background: rgba(227, 27, 43, 0.2) !important;
          transform: scale(1.08);
        }
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </section>
  );
};
