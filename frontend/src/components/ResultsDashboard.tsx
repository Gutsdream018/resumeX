import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Menu,
  Check,
  FileText,
  Printer,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../types';
import { DashboardSidebar, DashboardTab } from './DashboardSidebar';
import { DashboardOverview } from './DashboardOverview';
import { ResumeSplitView } from './ResumeSplitView';
import { AtsScorePage } from './AtsScorePage';
import { AiSuggestionsPage } from './AiSuggestionsPage';
import { SectionAnalysisPage } from './SectionAnalysisPage';
import { JobMatchPage } from './JobMatchPage';
import { KeywordDeepDivePage } from './KeywordDeepDivePage';
import { SectionDeepDive } from './SectionDeepDive';
import { ResumeOptimizerPage } from './optimizer/ResumeOptimizerPage';
import { WorkflowBreadcrumb, WorkflowStage } from './common/WorkflowBreadcrumb';
import { ResumeEvolutionTimeline } from './evolution/ResumeEvolutionTimeline';

interface ResultsDashboardProps {
  analysis: ResumeAnalysisResult;
  onReset: () => void;
  initialTab?: DashboardTab;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  onReset,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (analysis.overall_score >= 80) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E31B2B', '#C1121F', '#FFFFFF', '#10B981'],
      });
    }
  }, [analysis.overall_score]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'transparent',
        color: '#F5F5F5',
        position: 'relative',
      }}
      className="dashboard-wrapper"
    >
      {/* Desktop & Mobile Left Sidebar */}
      <div
        className={`dashboard-sidebar-wrapper ${isMobileNavOpen ? 'mobile-open' : ''}`}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 90,
        }}
      >
        <DashboardSidebar
          activeTab={activeTab}
          overallScore={analysis.overall_score}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileNavOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onReset={onReset}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
      </div>

      {/* Main Content Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Sticky Header */}
        <header
          style={{
            height: '68px',
            borderBottom: '1px solid #242424',
            backgroundColor: 'rgba(13, 13, 13, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 80,
          }}
        >
          {/* Mobile hamburger + Document Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="dashboard-mobile-toggle"
              style={{
                display: 'none',
                background: '#141414',
                border: '1px solid #242424',
                color: '#FFFFFF',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Menu size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#E50920" />
              <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF' }}>
                {analysis.metadata?.preserved_document?.original_name || 'candidate_resume.pdf'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                Audited
              </span>
            </div>
          </div>

          {/* Center Workflow Breadcrumb */}
          <div className="desktop-workflow-breadcrumb" style={{ display: 'flex', alignItems: 'center' }}>
            {(() => {
              let stage: WorkflowStage = 'analyze';
              if (activeTab === 'ats-score' || activeTab === 'resume-analysis') stage = 'diagnose';
              else if (activeTab === 'job-match') stage = 'match';
              else if (activeTab === 'optimizer') stage = 'optimize';
              else if (activeTab === 'suggestions') stage = 'validate';

              return (
                <WorkflowBreadcrumb
                  currentStage={stage}
                  onNavigateStage={(targetStage) => {
                    const stageToTab: Record<WorkflowStage, DashboardTab> = {
                      analyze: 'overview',
                      diagnose: 'ats-score',
                      match: 'job-match',
                      optimize: 'optimizer',
                      validate: 'suggestions',
                      export: 'optimizer',
                    };
                    setActiveTab(stageToTab[targetStage]);
                  }}
                />
              );
            })()}
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleShare}
              className="btn btn-secondary-dark"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {copiedShare ? <Check size={14} color="#10B981" /> : <Share2 size={14} />}
              <span>{copiedShare ? 'Link Copied!' : 'Share Audit'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-secondary-dark"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Printer size={14} />
              <span>Export PDF</span>
            </button>

            <button
              onClick={onReset}
              className="btn btn-red"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <RefreshCw size={14} />
              <span>New Review</span>
            </button>
          </div>
        </header>

        {/* Tab Content Container */}
        <main
          style={{
            flex: 1,
            padding: activeTab === 'optimizer' ? '0' : '32px 28px clamp(100px, 20vh, 200px)',
            maxWidth: activeTab === 'optimizer' ? '100%' : '1200px',
            width: '100%',
            margin: '0 auto',
            minHeight: 'calc(100vh - 68px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'overview' && (
            <DashboardOverview
              analysis={analysis}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'ats-score' && (
            <AtsScorePage
              analysis={analysis}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'optimizer' && (
            <ResumeOptimizerPage
              analysis={analysis}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'resume-analysis' && <ResumeSplitView analysis={analysis} />}

          {activeTab === 'keywords' && <KeywordDeepDivePage analysis={analysis} />}

          {activeTab === 'experience' && (
            <SectionDeepDive
              type="experience"
              analysis={analysis}
              onNavigateSuggestions={() => setActiveTab('suggestions')}
            />
          )}

          {activeTab === 'education' && (
            <SectionDeepDive
              type="education"
              analysis={analysis}
              onNavigateSuggestions={() => setActiveTab('suggestions')}
            />
          )}

          {activeTab === 'skills' && (
            <SectionDeepDive
              type="skills"
              analysis={analysis}
              onNavigateSuggestions={() => setActiveTab('suggestions')}
            />
          )}

          {activeTab === 'suggestions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ResumeEvolutionTimeline
                analysis={analysis}
                onNavigateOptimizer={() => setActiveTab('optimizer')}
              />
              <AiSuggestionsPage analysis={analysis} />
            </div>
          )}

          {activeTab === 'sections' && (
            <SectionAnalysisPage
              analysis={analysis}
              onNavigateSuggestions={() => setActiveTab('suggestions')}
            />
          )}

          {activeTab === 'job-match' && (
            <JobMatchPage
              analysis={analysis}
              onNavigateTab={(tab: any) => setActiveTab(tab)}
            />
          )}

          {/* 20% Dark Space Cushion to Compensate Length Differentiation Across Tabs */}
          <div
            aria-hidden="true"
            style={{
              height: 'clamp(80px, 20vh, 180px)',
              width: '100%',
              flexShrink: 0,
              pointerEvents: 'none',
            }}
          />
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-mobile-toggle {
            display: flex !important;
          }
          .dashboard-sidebar-wrapper {
            position: fixed !important;
            left: -280px;
            top: 0;
            bottom: 0;
            transition: left 0.25s ease;
          }
          .dashboard-sidebar-wrapper.mobile-open {
            left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
