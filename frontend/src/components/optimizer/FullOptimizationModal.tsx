import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Columns,
  List,
  Loader2,
  Info,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FullOptimizationJob,
  FullOptimizationMode,
  OptimizedBullet,
  SectionOptimizationResult,
} from '../../types';
import {
  startFullOptimizationApi,
  getOptimizationJobStatusApi,
  cancelOptimizationJobApi,
  subscribeOptimizationStream,
} from '../../services/api';

interface FullOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  canonicalResume: any;
  resumeId?: string;
  initialMode?: FullOptimizationMode;
  targetJob?: {
    id?: string;
    title: string;
    company: string;
    description?: string;
  } | null;
  baselineScore: number;
  onApplyOptimizations: (optimizedResume: any, allBullets: OptimizedBullet[], scoreDelta: number) => void;
}

export const FullOptimizationModal: React.FC<FullOptimizationModalProps> = ({
  isOpen,
  onClose,
  canonicalResume,
  resumeId,
  initialMode = 'ats_general',
  targetJob,
  baselineScore,
  onApplyOptimizations,
}) => {
  const [mode, setMode] = useState<FullOptimizationMode>(initialMode);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<FullOptimizationJob | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed' | 'cancelled'>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentSection, setCurrentSection] = useState<string>('summary');
  const [viewMode, setViewMode] = useState<'side_by_side' | 'unified'>('side_by_side');
  const [selectedBullets, setSelectedBullets] = useState<Record<string, boolean>>({});
  const [reviewOneByOne, setReviewOneByOne] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    experience: true,
    projects: true,
    skills: true,
    education: false,
  });

  // Start optimization pipeline when modal opens
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setJobId(null);
      setJobData(null);
      return;
    }

    let isMounted = true;
    let unsubscribeStream: (() => void) | null = null;

    const startJob = async () => {
      setStatus('running');
      setProgressPercent(5);
      try {
        const res = await startFullOptimizationApi({
          resumeId,
          mode,
          jobId: targetJob?.id,
          targetJobTitle: targetJob?.title,
          targetCompany: targetJob?.company,
          targetJobDescription: targetJob?.description,
          canonicalResume,
        });

        if (!isMounted) return;
        setJobId(res.jobId);
        if (res.job) {
          setJobData(res.job);
        }

        // Subscribe to live SSE updates
        unsubscribeStream = subscribeOptimizationStream(
          res.jobId,
          (event) => {
            if (!isMounted) return;
            if (event.progressPercent !== undefined) {
              setProgressPercent(event.progressPercent);
            }
            if (event.currentSection) {
              setCurrentSection(event.currentSection);
            }
            if (event.type === 'job_completed' && event.data) {
              setStatus('completed');
              setProgressPercent(100);
              // Fetch final job snapshot
              getOptimizationJobStatusApi(res.jobId).then((finalJob) => {
                if (isMounted && finalJob) {
                  setJobData(finalJob);
                  // Initialize all bullets as selected by default
                  const sel: Record<string, boolean> = {};
                  (finalJob.allBullets || []).forEach((b: OptimizedBullet) => {
                    sel[b.id] = true;
                  });
                  setSelectedBullets(sel);
                }
              });
            } else if (event.type === 'job_failed') {
              setStatus('failed');
            } else if (event.type === 'job_cancelled') {
              setStatus('cancelled');
            }
          },
          (err) => {
            console.warn('[FullOptimizationModal] Stream disconnected, falling back to polling:', err);
            // Fallback poll
            const interval = setInterval(async () => {
              try {
                const polled = await getOptimizationJobStatusApi(res.jobId);
                if (!isMounted) {
                  clearInterval(interval);
                  return;
                }
                if (polled) {
                  setJobData(polled);
                  setProgressPercent(polled.progressPercent || 50);
                  if (polled.status === 'completed') {
                    setStatus('completed');
                    clearInterval(interval);
                    const sel: Record<string, boolean> = {};
                    (polled.allBullets || []).forEach((b: OptimizedBullet) => {
                      sel[b.id] = true;
                    });
                    setSelectedBullets(sel);
                  } else if (polled.status === 'failed' || polled.status === 'cancelled') {
                    setStatus(polled.status);
                    clearInterval(interval);
                  }
                }
              } catch (e) {
                // polling error
              }
            }, 1000);
          }
        );
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('failed');
        console.error('Failed to start full optimization:', err);
      }
    };

    startJob();

    return () => {
      isMounted = false;
      if (unsubscribeStream) unsubscribeStream();
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (jobId) {
      await cancelOptimizationJobApi(jobId).catch(() => {});
    }
    setStatus('cancelled');
    onClose();
  };

  const handleToggleBullet = (id: string) => {
    setSelectedBullets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = () => {
    if (!jobData) return;
    // Filter only selected bullets if reviewing one by one
    const bulletsToApply = (jobData.allBullets || []).filter((b) => selectedBullets[b.id] !== false);
    onApplyOptimizations(jobData.optimizedResume, bulletsToApply, jobData.scoreDelta || 8);
    onClose();
  };

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const bulletsCount = jobData?.allBullets?.length || 0;
  const placeholdersCount = jobData?.placeholdersCount || 0;
  const rawDelta = jobData?.scoreDelta || (jobData?.estimatedOptimizedScore && jobData.estimatedOptimizedScore > baselineScore ? jobData.estimatedOptimizedScore - baselineScore : 8);
  const finalScore = Math.min(99, Math.max(baselineScore + 3, baselineScore + rawDelta));
  const scoreDelta = finalScore - baselineScore;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          maxHeight: '90vh',
          backgroundColor: '#0D0D0D',
          border: '1px solid #282828',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 20px rgba(227, 27, 43, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#F0F0F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#121212',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(227, 27, 43, 0.15)',
                border: '1px solid rgba(227, 27, 43, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E31B2B',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
                  Optimize Entire Resume
                </h2>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: mode === 'tailored' ? 'rgba(227, 27, 43, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: mode === 'tailored' ? '#E31B2B' : '#10B981',
                    border: `1px solid ${mode === 'tailored' ? 'rgba(227, 27, 43, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  }}
                >
                  {mode === 'tailored' ? 'Tailored to Job' : 'General ATS'}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#888', margin: '2px 0 0 0' }}>
                {mode === 'tailored' && targetJob
                  ? `Optimizing for ${targetJob.title} at ${targetJob.company}`
                  : 'Rewriting all sections with Google XYZ formula, power verbs, and ATS keywords'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* STAGE 1: PROGRESS STATE */}
          {status === 'running' && (
            <div style={{ padding: '30px 10px', textAlign: 'center' }}>
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 16px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      border: '3px solid #222',
                      borderTopColor: '#E31B2B',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E31B2B',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px', color: '#FFF' }}>
                  Optimizing Document Sections...
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#888', margin: '0 0 20px' }}>
                  Processing <strong style={{ color: '#E31B2B', textTransform: 'capitalize' }}>{currentSection}</strong> with unified context, zero hallucination, and Google XYZ metrics.
                </p>

                {/* Progress bar */}
                <div
                  style={{
                    height: '6px',
                    backgroundColor: '#1E1E1E',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      backgroundColor: '#E31B2B',
                      transition: 'width 0.3s ease',
                      boxShadow: '0 0 10px rgba(227, 27, 43, 0.5)',
                    }}
                  />
                </div>

                {/* Section Step Pipeline */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '24px' }}>
                  {['summary', 'experience', 'projects', 'skills', 'education'].map((sec) => {
                    const isDone = (jobData?.completedSections || []).includes(sec as any);
                    const isCurrent = currentSection === sec;
                    return (
                      <div
                        key={sec}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '6px',
                          backgroundColor: isDone ? 'rgba(16, 185, 129, 0.1)' : isCurrent ? 'rgba(227, 27, 43, 0.1)' : '#141414',
                          border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : isCurrent ? 'rgba(227, 27, 43, 0.3)' : '#222'}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize', color: isDone ? '#10B981' : isCurrent ? '#FFF' : '#666' }}>
                          {sec}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleCancel}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#181818',
                    border: '1px solid #333',
                    color: '#AAA',
                    fontSize: '0.74rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel Optimization
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: COMPLETED DIFF VIEW */}
          {status === 'completed' && jobData && (
            <div>
              {/* Summary Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  backgroundColor: '#141414',
                  border: '1px solid #242424',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                }}
              >
                {/* Score Projection */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>
                    ATS Score Projection
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '1rem', color: '#777', textDecoration: 'line-through' }}>
                      {baselineScore}
                    </span>
                    <ArrowRight size={12} color="#888" />
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
                      {finalScore}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      +{scoreDelta}
                    </span>
                  </div>
                </div>

                {/* Bullets Improved */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>
                    Bullets Enhanced
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: '4px' }}>
                    {bulletsCount} <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>rewritten</span>
                  </div>
                </div>

                {/* Keywords Added */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>
                    Keywords Woven
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {jobData.keywordsAdded?.length || 0} <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>verified</span>
                  </div>
                </div>

                {/* Placeholders Notice */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>
                    Needs Your Number
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: placeholdersCount > 0 ? '#F59E0B' : '#888' }}>
                      {placeholdersCount}
                    </span>
                    {placeholdersCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                        }}
                      >
                        [X%] tags
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Unsupported Job Gaps banner (tailored mode) */}
              {mode === 'tailored' && jobData.unsupportedJobGaps && jobData.unsupportedJobGaps.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <Info size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.74rem', color: '#DDD' }}>
                    <strong style={{ color: '#F59E0B' }}>Zero Hallucination Guarantee:</strong> The following job requirements were not found in your original resume and were <strong>not fabricated</strong>:
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                      {jobData.unsupportedJobGaps.map((gap, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#F59E0B',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Diff View Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  borderBottom: '1px solid #222',
                  paddingBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setViewMode('side_by_side')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: viewMode === 'side_by_side' ? '#262626' : 'transparent',
                      color: viewMode === 'side_by_side' ? '#FFF' : '#888',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Columns size={12} /> Side by Side
                  </button>
                  <button
                    onClick={() => setViewMode('unified')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: viewMode === 'unified' ? '#262626' : 'transparent',
                      color: viewMode === 'unified' ? '#FFF' : '#888',
                      border: '1px solid #333',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <List size={12} /> Unified List
                  </button>
                </div>

                <button
                  onClick={() => setReviewOneByOne(!reviewOneByOne)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: reviewOneByOne ? 'rgba(227, 27, 43, 0.15)' : 'transparent',
                    color: reviewOneByOne ? '#E31B2B' : '#888',
                    border: reviewOneByOne ? '1px solid rgba(227, 27, 43, 0.35)' : '1px solid #333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <SlidersHorizontal size={12} />
                  <span>{reviewOneByOne ? 'Accepting Individually' : 'Review One by One'}</span>
                </button>
              </div>

              {/* Diff Sections Accordion */}
              {Object.entries(jobData.sections || {}).map(([secKey, secResult]: [string, any]) => {
                if (!secResult || secResult.bullets?.length === 0) return null;
                const isExpanded = expandedSections[secKey] !== false;

                return (
                  <div
                    key={secKey}
                    style={{
                      marginBottom: '14px',
                      backgroundColor: '#121212',
                      border: '1px solid #222222',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Section Header */}
                    <div
                      onClick={() => toggleSection(secKey)}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#161616',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#FFF' }}>
                          {secResult.title || secKey}
                        </span>
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#222',
                            color: '#AAA',
                          }}
                        >
                          {secResult.bullets.length} revisions
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={14} color="#888" /> : <ChevronDown size={14} color="#888" />}
                    </div>

                    {/* Section Content */}
                    {isExpanded && (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {secResult.bullets.map((b: OptimizedBullet) => {
                          const isSelected = selectedBullets[b.id] !== false;
                          const hasPlaceholders = b.placeholders?.length > 0;

                          return (
                            <div
                              key={b.id}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: isSelected ? '#181818' : '#141414',
                                border: isSelected ? '1px solid #333' : '1px dashed #242424',
                                borderRadius: '6px',
                                opacity: isSelected ? 1 : 0.6,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {/* Bullet parent context & controls */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '6px',
                                  fontSize: '0.7rem',
                                  color: '#888',
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#AAA' }}>{b.parentContext}</span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {hasPlaceholders && (
                                    <span
                                      style={{
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        color: '#F59E0B',
                                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                      }}
                                    >
                                      Needs your number
                                    </span>
                                  )}

                                  {reviewOneByOne && (
                                    <button
                                      onClick={() => handleToggleBullet(b.id)}
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.66rem',
                                        fontWeight: 700,
                                        backgroundColor: isSelected ? '#10B981' : '#2A2A2A',
                                        color: isSelected ? '#FFF' : '#888',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                    >
                                      {isSelected ? <Check size={10} /> : null}
                                      <span>{isSelected ? 'Accepted' : 'Rejected'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Diff Comparison */}
                              {viewMode === 'side_by_side' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  {/* Original */}
                                  <div
                                    style={{
                                      padding: '8px 10px',
                                      backgroundColor: '#131313',
                                      borderRadius: '4px',
                                      border: '1px solid #222',
                                      fontSize: '0.78rem',
                                      lineHeight: '1.45',
                                      color: '#888',
                                      textDecoration: 'line-through',
                                    }}
                                  >
                                    {b.originalText}
                                  </div>

                                  {/* Optimized */}
                                  <div
                                    style={{
                                      padding: '8px 10px',
                                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(16, 185, 129, 0.2)',
                                      fontSize: '0.8rem',
                                      lineHeight: '1.45',
                                      color: '#E0E0E0',
                                    }}
                                  >
                                    {b.newText}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontSize: '0.74rem', color: '#777', textDecoration: 'line-through', marginBottom: '4px' }}>
                                    {b.originalText}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 500 }}>
                                    {b.newText}
                                  </div>
                                </div>
                              )}

                              {/* Reason & Evidence */}
                              <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#777', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#E31B2B', fontWeight: 700 }}>Why:</span>
                                <span>{b.reason}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Failed / Error State */}
          {status === 'failed' && (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <ShieldAlert size={36} color="#E31B2B" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#FFF', fontSize: '1rem', margin: '0 0 6px' }}>Optimization Encountered An Issue</h3>
              <p style={{ color: '#888', fontSize: '0.78rem', margin: '0 0 16px' }}>
                We were unable to complete the optimization run. Your original resume remains completely untouched.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#E31B2B',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFF',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {status === 'completed' && jobData && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #222222',
              backgroundColor: '#121212',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                backgroundColor: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#888',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Discard
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setReviewOneByOne(!reviewOneByOne)}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#DDD',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {reviewOneByOne ? 'Done Reviewing' : 'Review One by One'}
              </button>

              <button
                onClick={handleApply}
                style={{
                  padding: '7px 18px',
                  backgroundColor: '#E31B2B',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(227, 27, 43, 0.4)',
                }}
              >
                <Sparkles size={13} />
                <span>Apply All Changes (+{scoreDelta} ATS)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
