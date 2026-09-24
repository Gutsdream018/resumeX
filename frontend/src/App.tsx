import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { UploadZone } from './components/UploadZone';
import { HowItWorksSection } from './components/HowItWorksSection';
import { BeforeAfterSection } from './components/BeforeAfterSection';
import { FeaturesSection } from './components/FeaturesSection';
import { FaqSection } from './components/FaqSection';
import { LoadingState } from './components/LoadingState';
import { ResultsDashboard } from './components/ResultsDashboard';
import { BrandLogo } from './components/BrandLogo';
import { AuthModal, AuthUser } from './components/AuthModal';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { MatchMode } from './components/match-mode/MatchMode';
import { ParticleBackground } from './components/ParticleBackground';
import { CosmicAuroraSpace } from './components/CosmicAuroraSpace';
import { DevDebugPanel } from './components/DevDebugPanel';
import {
  checkBackendHealth,
  fetchSampleResumes,
  fetchSampleResumeById,
  analyzeResumeFile,
  analyzeResumeText,
} from './services/api';
import { ResumeAnalysisResult, SampleResume } from './types';
import { DashboardTab } from './components/DashboardSidebar';
import { CardReveal } from './components/CardReveal';

export const App: React.FC = () => {
  // Check if opened in separate small popup window/tab
  const urlParams = new URLSearchParams(window.location.search);
  const isPopup = urlParams.get('popup') === 'true';
  const urlAuthTab = (urlParams.get('auth') as 'login' | 'signup') || 'login';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>(urlAuthTab);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('resumex_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sampleResumes, setSampleResumes] = useState<SampleResume[]>([]);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isMatchModeOpen, setIsMatchModeOpen] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<DashboardTab | undefined>(undefined);

  // Cross-window sync (when login happens in a separate small tab/window)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'RESUMEX_AUTH_SUCCESS' && e.data?.user) {
        setCurrentUser(e.data.user);
        setAuthModalOpen(false);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'resumex_user' && e.newValue) {
        try {
          setCurrentUser(JSON.parse(e.newValue));
        } catch (err) {}
      } else if (e.key === 'resumex_user' && !e.newValue) {
        setCurrentUser(null);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Check health and load sample resumes on initial mount
  useEffect(() => {
    checkBackendHealth()
      .then((health) => {
        setIsBackendOnline(health.status === 'ok');
      })
      .catch(() => setIsBackendOnline(false));

    fetchSampleResumes()
      .then((samples) => setSampleResumes(samples))
      .catch((err) => console.warn('Sample resumes fetch failed:', err.message));
  }, []);

  const scrollToUpload = () => {
    const el = document.getElementById('upload-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 450, behavior: 'smooth' });
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyzeFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await analyzeResumeFile(file);
      console.log('[DASHBOARD] result received', result);
      setAnalysisResult(result);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[DASHBOARD] Analysis failed:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to review resume. Please verify file and try again.');
    }
  };

  const handleAnalyzeText = async (text: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await analyzeResumeText(text);
      console.log('[DASHBOARD] result received', result);
      setAnalysisResult(result);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[DASHBOARD] Text analysis failed:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Review failed. Please verify resume text.');
    }
  };

  const handleSelectSample = async (sampleId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const sample = await fetchSampleResumeById(sampleId);
      if (!sample || !sample.content) {
        throw new Error('Could not load sample content.');
      }
      const result = await analyzeResumeText(sample.content);
      console.log('[DASHBOARD] result received', result);
      setAnalysisResult(result);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[DASHBOARD] Sample analysis failed:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to load sample resume.');
    }
  };

  const handleApplyFixDestination = async (destinationTab: string) => {
    if (sampleResumes && sampleResumes.length > 0) {
      setDashboardInitialTab(destinationTab as DashboardTab);
      await handleSelectSample(sampleResumes[0].id);
    } else {
      scrollToUpload();
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setErrorMessage(null);
    setIsLoading(false);
    setIsMatchModeOpen(false);
    setDashboardInitialTab(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isPopup) {
    return (
      <AuthModal
        isOpen={true}
        initialTab={urlAuthTab}
        isStandalone={true}
        onClose={() => window.close()}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#070707', position: 'relative' }}>
      {/* Imposed 1080x1080 Cosmic Aurora blended with Space Theme */}
      <CosmicAuroraSpace />

      {/* Interactive AI Constellation Particle Layer (Stars & Shooting Stars) */}
      <ParticleBackground />

      {/* Top Navbar */}
      {!analysisResult && (
        <Navbar
          onReset={handleReset}
          hasResults={Boolean(analysisResult)}
          onOpenUpload={scrollToUpload}
          onOpenAuth={(tab) => {
            setAuthModalTab(tab);
            setAuthModalOpen(true);
          }}
          currentUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            localStorage.removeItem('resumex_user');
          }}
          onOpenMatchMode={() => {
            if (analysisResult) {
              setDashboardInitialTab('job-match');
              setIsMatchModeOpen(false);
            } else {
              setIsMatchModeOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      <main style={{ flex: 1, position: 'relative', zIndex: 2 }}>
        {isLoading ? (
          /* Multi-step AI Processing Screen */
          <LoadingState />
        ) : isMatchModeOpen ? (
          <div className="container py-8 min-h-screen" style={{ paddingBottom: 'clamp(100px, 20vh, 200px)' }}>
            {/* Separate Circular Back Button with Arrow */}
            <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setIsMatchModeOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="match-mode-circle-back-btn"
                title="Back to Home"
                aria-label="Back to Home"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#121212',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#E31B2B';
                  e.currentTarget.style.backgroundColor = 'rgba(227, 27, 43, 0.16)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(227, 27, 43, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                  e.currentTarget.style.backgroundColor = '#121212';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.5)';
                }}
              >
                <ArrowLeft size={19} />
              </button>
            </div>

            <MatchMode
              analysis={analysisResult}
              onNavigateTab={(tab) => {
                if (tab === 'bullet-points') {
                  setIsMatchModeOpen(false);
                }
              }}
              onBackToHome={() => {
                setIsMatchModeOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        ) : analysisResult ? (
          /* High-Impact Dashboard with Left Sidebar */
          <ResultsDashboard
            key={dashboardInitialTab}
            analysis={analysisResult}
            onReset={handleReset}
            initialTab={dashboardInitialTab}
          />
        ) : (
          /* Landing Page Workflow */
          <div className="animate-fade-in">
            {/* 1. Hero Section */}
            <HeroSection
              onAnalyzeClick={scrollToUpload}
              onHowItWorksClick={scrollToHowItWorks}
              onApplyFixDestination={handleApplyFixDestination}
            />

            {/* 2. Dedicated Resume Upload Section */}
            <UploadZone
              onAnalyzeFile={handleAnalyzeFile}
              onAnalyzeText={handleAnalyzeText}
              onSelectSample={handleSelectSample}
              sampleResumes={sampleResumes}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />

            {/* 3. How It Works (4-step sequence) */}
            <div className="container">
              <HowItWorksSection />
            </div>

            {/* 4. One Bullet. Before and After */}
            <div className="container">
              <BeforeAfterSection />
            </div>

            {/* 5. 8-Factor Recruiter-Calibrated Diagnostic Framework */}
            <div className="container">
              <FeaturesSection />
            </div>

            {/* 6. Pricing & FAQ Accordion */}
            <div className="container">
              <FaqSection onAnalyzeClick={scrollToUpload} />
            </div>

            {/* 7. Bottom High-Impact CTA Banner */}
            <div className="container">
              <CardReveal index={0} borderRadius="16px">
                <div
                  style={{
                    margin: '20px 0 80px',
                    background: 'linear-gradient(135deg, rgba(193, 18, 31, 0.15) 0%, rgba(17, 17, 17, 0.95) 100%)',
                    border: '1px solid rgba(227, 27, 43, 0.35)',
                    borderRadius: '16px',
                    padding: '50px 32px',
                    textAlign: 'center',
                    boxShadow: '0 0 40px rgba(227, 27, 43, 0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '200px',
                      height: '200px',
                      background: 'radial-gradient(circle, rgba(227, 27, 43, 0.25) 0%, transparent 70%)',
                      filter: 'blur(40px)',
                    }}
                  />

                  <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 800, marginBottom: '12px', color: '#FFFFFF' }}>
                    Ready to transform your resume?
                  </h2>
                  <p style={{ color: '#9A9A9A', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 28px' }}>
                    Get an objective ATS audit, identify every red flag, and unlock natural bullet rewrites in seconds.
                  </p>
                  <button
                    onClick={scrollToUpload}
                    className="btn btn-red"
                    style={{
                      padding: '14px 34px',
                      fontSize: '1.02rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>Upload your resume for free</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </CardReveal>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {!analysisResult && (
        <footer
          style={{
            borderTop: '1px solid #1E1E1E',
            padding: '30px 0',
            backgroundColor: '#0A0A0A',
            fontSize: '0.84rem',
            color: '#737373',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div className="container">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrandLogo size="sm" showIcon={false} />
                <span>— Professional Resume Critique & ATS Diagnostic Platform</span>
              </div>
              <div>
                Confidential in-memory processing • Standardized against Fortune 500 ATS benchmarks
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Login & Sign Up Modal with Separate Small Tab / Window Options */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
      />

      {/* Dev-only Diagnostic Debug Drawer */}
      <DevDebugPanel
        analysis={analysisResult}
        pipelineStage={isLoading ? 'ats' : analysisResult ? 'completed' : 'idle'}
        error={errorMessage}
      />
    </div>
  );
};

export default App;
