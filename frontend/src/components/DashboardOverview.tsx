import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  FileCheck,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../types';
import { ResumeHealthCore } from './overview/ResumeHealthCore';
import { ResumeDNA } from './overview/ResumeDNA';
import { ATSVisualization } from './overview/ATSVisualization';
import { ResumeHeatmap } from './overview/ResumeHeatmap';
import { InformationHierarchy } from './overview/InformationHierarchy';
import { KeywordConstellation } from './overview/KeywordConstellation';
import { RecruiterViewCard } from './overview/RecruiterViewCard';
import { AIInsightPanel } from './overview/AIInsightPanel';
import { PriorityActions } from './overview/PriorityActions';
import { ResumeEvolution } from './overview/ResumeEvolution';
import { ScoreTransitionCard } from './overview/ScoreTransitionCard';

interface DashboardOverviewProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const [showScoreExplanationModal, setShowScoreExplanationModal] = useState<boolean>(false);

  const rawAny = analysis as any;
  const score = analysis.overall_score ?? rawAny?.score?.overall ?? 0;
  const diagnostic = analysis.diagnostic;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '36px',
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* 1. TOP: Resume Intelligence Header + Resume Health Core */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                ● Live AI Intelligence
              </span>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                Resume Command Center
              </h2>
            </div>
            <p style={{ color: '#8E8E8E', fontSize: '0.88rem', margin: 0 }}>
              Understand how your resume is performing, what is strong, what is weak, and what should be improved next.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowScoreExplanationModal(true)}
              className="btn btn-secondary-dark"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <HelpCircle size={15} />
              <span>Score Methodology</span>
            </button>

            <button
              onClick={() => onNavigateTab('optimizer')}
              className="btn btn-red"
              style={{ fontSize: '0.84rem', padding: '8px 16px', fontWeight: 700 }}
            >
              <span>Launch Resume Optimizer</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Primary Interactive Score Card with 3D Flip Transition */}
        <ScoreTransitionCard
          analysis={analysis}
          onNavigate={() => onNavigateTab('ats-score')}
        />

        {/* SECTION 1: Resume Health Core (Radial 7-dimension central intelligence) */}
        <ResumeHealthCore
          analysis={analysis}
          onNavigateTab={onNavigateTab}
          onOpenScoreExplanation={() => setShowScoreExplanationModal(true)}
        />
      </section>

      {/* 2. SECTION 2: RESUME DNA (Deterministic Connected 3D / 2D Network) */}
      <section>
        <ResumeDNA
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />
      </section>

      {/* 3. SECTION 3: ATS + CONTENT ANALYSIS (Radial ATS Arc + Horizontal Section Heatmap) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '24px',
        }}
        className="overview-two-col-grid"
      >
        <ATSVisualization
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />

        <ResumeHeatmap
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />
      </section>

      {/* 4. SECTION 4: RESUME STRUCTURE (Recruiter Attention Map + Keyword Constellation) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '24px',
        }}
        className="overview-two-col-grid"
      >
        <InformationHierarchy
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />

        <KeywordConstellation
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />
      </section>

      {/* 5. SECTION 5: RECRUITER 6-SECOND SCAN SIMULATION */}
      <section>
        <RecruiterViewCard
          analysis={analysis}
          onOptimize={() => onNavigateTab('optimizer')}
        />
      </section>

      {/* 6. SECTION 6: AI INSIGHTS ("Resume Intelligence" Curated Observations) */}
      <section>
        <AIInsightPanel
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />
      </section>

      {/* 7. SECTION 7: RECOMMENDED NEXT ACTIONS (Prioritized Sequence) */}
      <section>
        <PriorityActions
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />
      </section>

      {/* 8. SECTION 8: RESUME EVOLUTION (Temporal Version Timeline) */}
      <section>
        <ResumeEvolution
          analysis={analysis}
          onNavigateTab={onNavigateTab}
        />
      </section>

      {/* 9. MATCH MODE CALLOUT BANNER */}
      <section
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(229, 9, 32, 0.12) 0%, rgba(15, 15, 15, 0.95) 100%)',
          border: '1px solid rgba(229, 9, 32, 0.35)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '680px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(229, 9, 32, 0.2)',
              border: '1px solid rgba(229, 9, 32, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Target size={24} color="#E50920" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Benchmark Against Specific Job Descriptions
              </h4>
              <span className="badge badge-red" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                MATCH MODE
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#B0B0B0', margin: 0, lineHeight: 1.45 }}>
              Compare your resume directly against target job postings to calculate deterministic keyword overlap, missing frameworks, and role alignment.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('job-match')}
          className="btn btn-red"
          style={{ padding: '10px 22px', fontSize: '0.86rem', fontWeight: 700 }}
        >
          <span>Launch Match Mode</span>
          <ArrowRight size={15} />
        </button>
      </section>

      {/* Score Explanation Modal */}
      {showScoreExplanationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowScoreExplanationModal(false)}
        >
          <div
            className="card-dark"
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#0F0F0F',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-red">AUDIT METHODOLOGY</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  ResumeX Evaluation ({score}/100)
                </h3>
              </div>
              <button
                onClick={() => setShowScoreExplanationModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#9A9A9A', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#B0B0B0', lineHeight: 1.5, marginBottom: '18px' }}>
              {diagnostic?.scoreExplanation?.summary ||
                'Your score is calculated deterministically across 7 structural dimensions: ATS Readability (20%), Keyword Relevance (20%), Experience Quality (20%), Project Detail (15%), Formatting (10%), Education (5%), and Measurable Outcomes (10%).'}
            </p>

            <div style={{ marginBottom: '20px', background: '#141414', padding: '14px', borderRadius: '10px', border: '1px solid #222222' }}>
              <strong style={{ color: '#E50920', fontSize: '0.78rem', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Primary Score Optimization Levers:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#A3A3A3', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {(diagnostic?.scoreExplanation?.deductions || [
                  'Keyword Relevance — Technical skills dispersed instead of consolidated in a skills matrix.',
                  'Experience Quality — Passive responsibility phrasing instead of ownership power verbs.',
                  'Measurable Outcomes — Underdeveloped metrics and deliverable quantification.',
                ]).map((ded, dIdx) => (
                  <li key={dIdx} style={{ marginBottom: '4px' }}>{ded}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                setShowScoreExplanationModal(false);
                onNavigateTab('optimizer');
              }}
              className="btn btn-red"
              style={{ width: '100%', padding: '10px', fontSize: '0.88rem', fontWeight: 700, borderRadius: '8px' }}
            >
              <span>Begin Step-by-Step Optimization</span>
            </button>
          </div>
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 900px) {
          .overview-two-col-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
