import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Target,
  AlertCircle,
} from 'lucide-react';
import { ScoreMeter } from './ScoreMeter';

interface SlideStep {
  id: number;
  title: string;
  category: string;
  scoreBoost: number;
  targetScore: number;
  startingScore: number;
  problem: string;
  solution: string;
  beforeSnippet: string;
  afterSnippet: string;
  keyTakeaway: string;
}

const IMPROVEMENT_SLIDES: SlideStep[] = [
  {
    id: 1,
    title: 'Quantify Experience & Bullet Outcomes',
    category: 'Impact & Achievement',
    scoreBoost: 10,
    startingScore: 68,
    targetScore: 78,
    problem: 'Passive duty statements ("Worked on...", "Responsible for...") fail to show business results.',
    solution: 'Apply the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
    beforeSnippet: 'Worked on a web application and fixed database bugs.',
    afterSnippet: 'Developed a full-stack React & Node.js application, reducing p99 response latency by 30% for 45,000 monthly active users.',
    keyTakeaway: 'Recruiters prioritize quantifiable metrics ($ saved, % speedup, user scale) over simple task descriptions.',
  },
  {
    id: 2,
    title: 'Inject Target Technical Keywords',
    category: 'Keyword Coverage',
    scoreBoost: 8,
    startingScore: 78,
    targetScore: 86,
    problem: 'Missing critical technology keywords (AWS, Docker, PostgreSQL, REST APIs) causes silent ATS rejection.',
    solution: 'Categorize your technical skills matrix and explicitly mention target cloud & container tools in job bullets.',
    beforeSnippet: 'Skills: JavaScript, HTML, Web development.',
    afterSnippet: 'Languages & Cloud: TypeScript, Python, Node.js, PostgreSQL, Docker, AWS (ECS, S3), REST APIs.',
    keyTakeaway: 'ATS parsers check for exact skill string matches before human recruiters review your file.',
  },
  {
    id: 3,
    title: 'Standardize ATS Layout & Header Structure',
    category: 'ATS Parseability',
    scoreBoost: 6,
    startingScore: 86,
    targetScore: 92,
    problem: 'Multi-column tables, text boxes, and non-standard header titles get garbled by legacy Workday/Taleo parsers.',
    solution: 'Use a clean single-column format with universal headers ("Work Experience", "Education", "Skills").',
    beforeSnippet: 'Header: "My Career Journey & Projects" in a 2-column sidebar layout.',
    afterSnippet: 'Header: "Work Experience" in a clean single-column chronological layout.',
    keyTakeaway: 'A clean single-column structure ensures 100% text parsing accuracy across all enterprise ATS systems.',
  },
  {
    id: 4,
    title: 'Align Resume to Target Job Posting',
    category: 'Role Relevance',
    scoreBoost: 4,
    startingScore: 92,
    targetScore: 96,
    problem: 'Generic resumes score in the mid-70s because key phrases from the job description are omitted.',
    solution: 'Paste the target job description into the Job Match tool and inject top matching skill terms.',
    beforeSnippet: 'Built software for clients across various projects.',
    afterSnippet: 'Architected microservices using Go and PostgreSQL, directly matching tier-1 requirements for Senior Platform Engineer.',
    keyTakeaway: 'Tailoring top skills to the specific job posting boosts candidate match score from 75% to 95%+.',
  },
];

interface ImprovementSlideshowProps {
  onApplyStepFix?: (stepId: number, boost: number) => void;
}

export const ImprovementSlideshow: React.FC<ImprovementSlideshowProps> = ({
  onApplyStepFix,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [appliedSteps, setAppliedSteps] = useState<number[]>([]);

  const activeSlide = IMPROVEMENT_SLIDES[currentSlideIndex];

  // Calculate live dynamic score based on applied steps
  const baseScore = 68;
  const currentLiveScore = appliedSteps.reduce((acc, stepId) => {
    const slide = IMPROVEMENT_SLIDES.find((s) => s.id === stepId);
    return acc + (slide ? slide.scoreBoost : 0);
  }, baseScore);

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev < IMPROVEMENT_SLIDES.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : IMPROVEMENT_SLIDES.length - 1));
  };

  const handleToggleApplyStep = (stepId: number) => {
    if (appliedSteps.includes(stepId)) {
      setAppliedSteps((prev) => prev.filter((id) => id !== stepId));
    } else {
      setAppliedSteps((prev) => [...prev, stepId]);
      if (onApplyStepFix) {
        const slide = IMPROVEMENT_SLIDES.find((s) => s.id === stepId);
        onApplyStepFix(stepId, slide ? slide.scoreBoost : 5);
      }
    }
  };

  const isCurrentApplied = appliedSteps.includes(activeSlide.id);

  return (
    <div
      className="card-dark"
      style={{
        padding: '32px',
        background: '#111111',
        border: '1px solid #242424',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Top Slide Header & Live Score Meter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #242424',
          paddingBottom: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-red">
              STEP {activeSlide.id} OF {IMPROVEMENT_SLIDES.length}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#9A9A9A', fontWeight: 600 }}>
              {activeSlide.category}
            </span>
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            {activeSlide.title}
          </h3>
        </div>

        {/* Live Moving Score Meter Widget */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#0D0D0D',
            padding: '10px 18px',
            borderRadius: '12px',
            border: '1px solid #242424',
          }}
        >
          <ScoreMeter
            score={isCurrentApplied ? activeSlide.targetScore : currentLiveScore}
            size={76}
            label=""
            showSublabel={false}
            animateOnMount={false}
          />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Score Impact
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                +{activeSlide.scoreBoost} PTS
              </span>
              <span style={{ fontSize: '0.76rem', color: '#737373' }}>
                ({activeSlide.startingScore} ➔ {activeSlide.targetScore})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content Grid: Problem & Solution Snippets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
        className="slideshow-snippets-grid"
      >
        {/* Problem Snippet */}
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid rgba(227, 27, 43, 0.3)',
            borderRadius: '10px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={16} color="#E31B2B" />
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Flaw Identified
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#FF99A1', marginBottom: '12px', lineHeight: 1.5, fontFamily: 'monospace' }}>
            "{activeSlide.beforeSnippet}"
          </p>
          <p style={{ fontSize: '0.8rem', color: '#9A9A9A', lineHeight: 1.45 }}>
            <strong>Why it holds you back:</strong> {activeSlide.problem}
          </p>
        </div>

        {/* Solution Snippet */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Recruiter-Approved Revision
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#FFFFFF', marginBottom: '12px', lineHeight: 1.5, fontWeight: 500 }}>
            "{activeSlide.afterSnippet}"
          </p>
          <p style={{ fontSize: '0.8rem', color: '#9A9A9A', lineHeight: 1.45 }}>
            <strong>Recruiter Takeaway:</strong> {activeSlide.keyTakeaway}
          </p>
        </div>
      </div>

      {/* Slide Navigation Controls & Interactive Action Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderTop: '1px solid #1E1E1E',
          paddingTop: '20px',
        }}
      >
        {/* Step Indicator Dots / Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {IMPROVEMENT_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            const isApplied = appliedSteps.includes(slide.id);
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: isActive ? '#C1121F' : isApplied ? 'rgba(16, 185, 129, 0.15)' : '#141414',
                  border: `1px solid ${isActive ? '#E31B2B' : isApplied ? 'rgba(16, 185, 129, 0.3)' : '#242424'}`,
                  color: isActive || isApplied ? '#FFFFFF' : '#737373',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                {isApplied && <Check size={12} color="#10B981" />}
                <span>Step {slide.id}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => handleToggleApplyStep(activeSlide.id)}
            className={isCurrentApplied ? 'btn btn-secondary-dark' : 'btn btn-red'}
            style={{ fontSize: '0.86rem', padding: '9px 18px' }}
          >
            {isCurrentApplied ? (
              <>
                <Check size={14} color="#10B981" />
                <span>Step Applied (+{activeSlide.scoreBoost} PTS)</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Apply Step Fix (+{activeSlide.scoreBoost} PTS)</span>
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handlePrev}
              className="btn btn-secondary-dark"
              style={{ padding: '8px 12px' }}
              title="Previous Step"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="btn btn-secondary-dark"
              style={{ padding: '8px 12px' }}
              title="Next Step"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .slideshow-snippets-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
