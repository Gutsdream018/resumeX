import React, { useEffect, useState } from 'react';
import { ScoredJobMatch } from '../../types';
import { checkJobLinkApi, trackJobClickApi } from '../../services/api';
import {
  X,
  Building2,
  MapPin,
  Wifi,
  DollarSign,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
  ShieldCheck,
  Bookmark,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

interface JobDetailDrawerProps {
  isOpen: boolean;
  match: ScoredJobMatch | null;
  userId?: string;
  onClose: () => void;
  onTailor: (match: ScoredJobMatch) => void;
  onToggleSave?: (match: ScoredJobMatch) => void;
  onHide?: (match: ScoredJobMatch) => void;
}

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({
  isOpen,
  match,
  userId,
  onClose,
  onTailor,
  onToggleSave,
  onHide,
}) => {
  const [isSavedState, setIsSavedState] = useState<boolean>(false);
  const [linkStatus, setLinkStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (match) {
      setIsSavedState(!!match.isSaved);
      setLinkStatus(match.job.linkStatus);
    }
  }, [match]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !match || !match.job) return null;

  const { job, overallScore = 0, matchedSkills = [], missingRequirements, recommendations, limitedDescription, seniorityPenalized } = match;

  const scoreColor =
    overallScore >= 70 ? '#10B981' : overallScore >= 50 ? '#F59E0B' : '#E31B2B';

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const formatK = (num: number) => {
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
      if (num >= 1000) return `$${Math.round(num / 1000)}k`;
      return `$${num}`;
    };
    if (job.salaryMin && job.salaryMax) {
      return `${formatK(job.salaryMin)} - ${formatK(job.salaryMax)}`;
    }
    if (job.salaryMin) return `From ${formatK(job.salaryMin)}`;
    if (job.salaryMax) return `Up to ${formatK(job.salaryMax)}`;
    return null;
  };

  const formatPostedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const posted = new Date(dateStr).getTime();
      if (isNaN(posted)) return 'Recently';
      const diffDays = Math.max(0, Math.floor((Date.now() - posted) / (1000 * 60 * 60 * 24)));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } catch {
      return 'Recently';
    }
  };

  const targetApplyUrl = job.finalUrl || job.applyUrl || '';
  const isAts =
    Boolean(job.isAts) ||
    ['greenhouse', 'lever', 'workday', 'ashby'].some((h) =>
      (job.applyHost || targetApplyUrl || '').toLowerCase().includes(h)
    );
  const applyButtonLabel = isAts
    ? 'Apply on company site'
    : job.applyLabel || `Apply via ${job.source || 'Board'}`;

  const isValidUrl =
    targetApplyUrl &&
    (targetApplyUrl.startsWith('http://') || targetApplyUrl.startsWith('https://'));
  const safeApplyUrl = isValidUrl ? targetApplyUrl : '#';

  const handleApplyClick = () => {
    trackJobClickApi(job.id, userId);
    if (targetApplyUrl) {
      checkJobLinkApi(targetApplyUrl, job.id).then((res) => {
        if (res?.linkStatus) setLinkStatus(res.linkStatus);
      }).catch(() => {});
    }
  };

  const handleToggleSave = () => {
    setIsSavedState(!isSavedState);
    if (onToggleSave) onToggleSave(match);
  };

  const handleHide = () => {
    if (onHide) onHide(match);
    onClose();
  };

  const mustHaves = missingRequirements?.mustHave || [];
  const niceToHaves = missingRequirements?.niceToHave || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-job-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: '#0D0D0D',
          borderLeft: '1px solid #242424',
          boxShadow: '-15px 0 50px rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #1F1F1F',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: '#0D0D0D',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(227, 27, 43, 0.15)',
                  border: '1px solid rgba(227, 27, 43, 0.35)',
                  color: '#E31B2B',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                MATCH BREAKDOWN
              </span>

              {isAts && (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34D399',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  Direct ATS ({job.applyHost || 'Verified'})
                </span>
              )}

              {linkStatus === 'unknown' && (
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FF6B75',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertCircle size={10} />
                  <span>May be closed</span>
                </span>
              )}
            </div>

            <h2
              id="drawer-job-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {job.title}
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginTop: '10px',
                fontSize: '0.85rem',
                color: '#9A9A9A',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#E0E0E0', fontWeight: 600 }}>
                <Building2 size={15} color="#E31B2B" />
                {job.company}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={15} />
                {job.location}
              </span>
              {job.isRemote && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#34D399',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Wifi size={12} />
                  Remote
                </span>
              )}
            </div>
          </div>

          {/* Action icons & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToggleSave}
              title={isSavedState ? 'Saved' : 'Save job'}
              aria-label="Save job"
              style={{
                background: isSavedState ? 'rgba(227, 27, 43, 0.15)' : '#161616',
                border: isSavedState ? '1px solid rgba(227, 27, 43, 0.4)' : '1px solid #282828',
                borderRadius: '8px',
                color: isSavedState ? '#E31B2B' : '#888',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Bookmark size={15} fill={isSavedState ? '#E31B2B' : 'transparent'} />
            </button>

            <button
              onClick={handleHide}
              title="Hide job"
              aria-label="Hide job"
              style={{
                background: '#161616',
                border: '1px solid #282828',
                borderRadius: '8px',
                color: '#888',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <EyeOff size={15} />
            </button>

            <button
              onClick={onClose}
              aria-label="Close drawer"
              style={{
                background: '#161616',
                border: '1px solid #282828',
                borderRadius: '8px',
                color: '#888',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Match Score & Key Metrics Banner */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              background: '#121212',
              border: '1px solid #222222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#888888', textTransform: 'uppercase', fontWeight: 700 }}>
                Estimated ATS Compatibility
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                  {overallScore}%
                </span>
                <span style={{ fontSize: '0.86rem', color: '#AAA' }}>
                  {overallScore >= 70 ? 'Strong Match' : overallScore >= 50 ? 'Worth a Shot' : 'Stretch Role'}
                </span>
              </div>
              {seniorityPenalized && (
                <span style={{ fontSize: '0.74rem', color: '#C084FC', marginTop: '4px', display: 'block' }}>
                  &bull; 1 level above parsed profile (-12 pts seniority penalty applied)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              {formatSalary() && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.88rem', fontWeight: 700 }}>
                  <DollarSign size={14} />
                  <span>{formatSalary()}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#777', fontSize: '0.78rem' }}>
                <Calendar size={13} />
                <span>Posted {formatPostedDate(job.postedAt)}</span>
              </div>
            </div>
          </div>

          {/* Matched Skills */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Matched Competencies ({matchedSkills.length})
              </h3>
            </div>

            {matchedSkills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.28)',
                      color: '#34D399',
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#777', margin: 0 }}>
                No explicit skill overlaps detected in parsed description.
              </p>
            )}
          </div>

          {/* Missing Requirements Breakdown */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle size={16} color="#E31B2B" />
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Missing Requirements ({mustHaves.length + niceToHaves.length})
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mustHaves.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.76rem', color: '#FF6B75', fontWeight: 700, textTransform: 'uppercase' }}>
                    Must Have
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {mustHaves.map((skill, idx) => (
                      <span
                        key={`must_${idx}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(227, 27, 43, 0.1)',
                          border: '1px solid rgba(227, 27, 43, 0.28)',
                          color: '#FF6B75',
                        }}
                      >
                        <AlertTriangle size={12} />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {niceToHaves.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.76rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                    Nice to Have
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {niceToHaves.map((skill, idx) => (
                      <span
                        key={`nice_${idx}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.28)',
                          color: '#F59E0B',
                        }}
                      >
                        <Info size={12} />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Tailoring Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Lightbulb size={16} color="#F59E0B" />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  Tailoring Recommendations
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#111111',
                      border: '1px solid #1E1E1E',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#E0E0E0' }}>
                        {rec.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#888',
                          background: '#181818',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {rec.targetSection}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#B0B0B0', margin: '4px 0' }}>
                      {rec.suggestedAction}
                    </p>
                    <span style={{ fontSize: '0.74rem', color: '#777', fontStyle: 'italic' }}>
                      Why: {rec.whyItMatters}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Job Description (Sanitized Text, zero HTML execution) */}
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px' }}>
              Job Description
            </h3>
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: '#111111',
                border: '1px solid #202020',
                fontSize: '0.86rem',
                color: '#B0B0B0',
                lineHeight: 1.6,
                maxHeight: '340px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                wordBreak: 'break-word',
              }}
            >
              {job.description || 'No detailed description provided by the employer.'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#666666' }}>
              Source: <span style={{ textTransform: 'capitalize' }}>{job.source || 'Job Board'}</span>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer: View / Apply & Tailor Resume */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid #1F1F1F',
            background: 'rgba(13, 13, 13, 0.98)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <a
            href={safeApplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: isAts ? '#60A5FA' : '#B0B0B0',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              border: isAts ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid #282828',
              background: isAts ? 'rgba(96, 165, 250, 0.08)' : '#161616',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isAts ? '#60A5FA' : '#B0B0B0';
              e.currentTarget.style.borderColor = isAts ? 'rgba(96, 165, 250, 0.3)' : '#282828';
            }}
          >
            <span>{applyButtonLabel}</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={() => {
              onClose();
              onTailor(match);
            }}
            className="btn btn-red"
            style={{
              padding: '9px 22px',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            <span>Tailor Resume</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
