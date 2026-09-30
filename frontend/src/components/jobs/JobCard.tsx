import React, { useState } from 'react';
import { Job, ScoredJobMatch } from '../../types';
import { CardReveal } from '../CardReveal';
import { checkJobLinkApi, trackJobClickApi } from '../../services/api';
import {
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Wifi,
  Bookmark,
  EyeOff,
  AlertCircle,
  Briefcase,
  ChevronDown,
} from 'lucide-react';

interface JobCardProps {
  match: ScoredJobMatch;
  index: number;
  userId?: string;
  onClick: (match: ScoredJobMatch) => void;
  onTailor: (match: ScoredJobMatch) => void;
  onToggleSave?: (match: ScoredJobMatch) => void;
  onHide?: (match: ScoredJobMatch) => void;
  onSelectMissingSkill?: (skill: string) => void;
  onSelectMatchedSkill?: (skill: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  match,
  index,
  userId,
  onClick,
  onTailor,
  onToggleSave,
  onHide,
  onSelectMissingSkill,
  onSelectMatchedSkill,
}) => {
  if (!match || !match.job) return null;

  const { job, overallScore = 0, matchedSkills = [], missingRequirements, limitedDescription, matchTier, seniorityTier, seniorityPenalized, isSaved } = match;

  const [isSavedState, setIsSavedState] = useState<boolean>(Boolean(isSaved));
  const [linkStatus, setLinkStatus] = useState<string | undefined>(job.linkStatus);

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
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    } catch {
      return 'Recently';
    }
  };

  // ATS Detection & Labeling
  const targetApplyUrl = job.finalUrl || job.applyUrl || '';
  const isAts =
    Boolean(job.isAts) ||
    ['greenhouse', 'lever', 'workday', 'ashby'].some((h) =>
      (job.applyHost || targetApplyUrl || '').toLowerCase().includes(h)
    );
  const applyButtonLabel = isAts
    ? 'Apply on company site'
    : job.applyLabel || `Apply via ${job.source || 'Board'}`;

  // URL security validation: must be http(s)
  const isValidUrl =
    targetApplyUrl &&
    (targetApplyUrl.startsWith('http://') || targetApplyUrl.startsWith('https://'));
  const safeApplyUrl = isValidUrl ? targetApplyUrl : '#';

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Track click event per job
    trackJobClickApi(job.id, userId);

    // Re-check link on click
    if (targetApplyUrl) {
      checkJobLinkApi(targetApplyUrl, job.id).then((res) => {
        if (res?.linkStatus) setLinkStatus(res.linkStatus);
      }).catch(() => {});
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavedState(!isSavedState);
    if (onToggleSave) onToggleSave(match);
  };

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) onHide(match);
  };

  // Top 3 matched skills and top 2 missing skills
  const displayMatched = (matchedSkills || []).slice(0, 3);
  const displayMissing = [
    ...(missingRequirements?.mustHave || []),
    ...(missingRequirements?.niceToHave || []),
  ].slice(0, 2);

  return (
    <CardReveal index={index} borderRadius="16px" className="w-full">
      <div
        onClick={() => onClick(match)}
        className="card-dark group cursor-pointer"
        style={{
          padding: '24px',
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(227, 27, 43, 0.45)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(227, 27, 43, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#242424';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
      >
        {/* Header: Title, Company, Meta, & Score Ring */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title & Badges */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <h3
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {job.title}
              </h3>

              {limitedDescription && (
                <span
                  title="Employer provided a brief snippet; matching score is estimated."
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#F59E0B',
                  }}
                >
                  <Info size={11} />
                  <span>Brief Snippet</span>
                </span>
              )}

              {/* Unknown link status badge */}
              {linkStatus === 'unknown' && (
                <span
                  title="Link status could not be verified automatically; listing may be closed."
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FF6B75',
                  }}
                >
                  <AlertCircle size={11} />
                  <span>May be closed</span>
                </span>
              )}

              {/* Seniority Demotion indicator */}
              {seniorityPenalized && (
                <span
                  title="Role is one level above your parsed profile level (-12 pts calibration penalty applied)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#C084FC',
                  }}
                >
                  <span>Stretch (+1 Seniority)</span>
                </span>
              )}
            </div>

            {/* Company & Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                fontSize: '0.84rem',
                color: '#9A9A9A',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#E0E0E0', fontWeight: 600 }}>
                <Building2 size={14} color="#E31B2B" />
                {job.company}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} />
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
                    padding: '1px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Wifi size={11} />
                  Remote
                </span>
              )}
              {formatSalary() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F5F5F5', fontWeight: 600 }}>
                  <DollarSign size={13} color="#10B981" />
                  {formatSalary()}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#737373', fontSize: '0.78rem' }}>
                <Calendar size={13} />
                {formatPostedDate(job.postedAt)}
              </span>
            </div>
          </div>

          {/* Right Header Area: Save / Hide & ATS Match Score Ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Quick Action Icons: Save & Hide */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSaveClick}
                title={isSavedState ? 'Saved to your jobs' : 'Save job'}
                aria-label={isSavedState ? 'Saved to your jobs' : 'Save job'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isSavedState ? 'rgba(227, 27, 43, 0.15)' : '#161616',
                  border: isSavedState ? '1px solid rgba(227, 27, 43, 0.4)' : '1px solid #282828',
                  color: isSavedState ? '#E31B2B' : '#777777',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E31B2B')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isSavedState ? '#E31B2B' : '#777777')}
              >
                <Bookmark size={14} fill={isSavedState ? '#E31B2B' : 'transparent'} />
              </button>

              <button
                type="button"
                onClick={handleHideClick}
                title="Hide job from results"
                aria-label="Hide job from results"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#161616',
                  border: '1px solid #282828',
                  color: '#777777',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#777777')}
              >
                <EyeOff size={14} />
              </button>
            </div>

            {/* ATS-Style Match Score Ring */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
              aria-label={`Match Score: ${overallScore} percent`}
            >
              <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    stroke="#202020"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    stroke={scoreColor}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="144.5"
                    strokeDashoffset={144.5 - (144.5 * overallScore) / 100}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
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
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                    {overallScore}
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#737373', marginTop: '1px' }}>
                    %
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: scoreColor, marginTop: '4px', textTransform: 'uppercase' }}>
                Match
              </span>
            </div>
          </div>
        </div>

        {/* Skill Chips Breakdown: Interactive clicks */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {displayMatched.map((skill, sIdx) => (
            <button
              key={`match_${sIdx}`}
              type="button"
              title="Click to view verified evidence in resume"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectMatchedSkill) onSelectMatchedSkill(skill);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                color: '#34D399',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.28)')}
            >
              <CheckCircle2 size={12} />
              <span>{skill}</span>
            </button>
          ))}

          {displayMissing.map((skill, mIdx) => (
            <button
              key={`miss_${mIdx}`}
              type="button"
              title="Click to optimize resume with this keyword"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectMissingSkill) onSelectMissingSkill(skill);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '6px',
                background: 'rgba(227, 27, 43, 0.1)',
                border: '1px solid rgba(227, 27, 43, 0.28)',
                color: '#FF6B75',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(227, 27, 43, 0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(227, 27, 43, 0.28)')}
            >
              <AlertTriangle size={12} />
              <span>Missing: {skill}</span>
            </button>
          ))}
        </div>

        {/* Actions: View / Apply & Tailor Resume */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderTop: '1px solid #1A1A1A',
            paddingTop: '14px',
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
              fontSize: '0.84rem',
              fontWeight: 600,
              color: isAts ? '#60A5FA' : '#9A9A9A',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              border: isAts ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid #282828',
              background: isAts ? 'rgba(96, 165, 250, 0.08)' : '#141414',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#555';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isAts ? '#60A5FA' : '#9A9A9A';
              e.currentTarget.style.borderColor = isAts ? 'rgba(96, 165, 250, 0.3)' : '#282828';
            }}
          >
            <span>{applyButtonLabel}</span>
            <ExternalLink size={13} />
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTailor(match);
            }}
            className="btn btn-red"
            style={{
              padding: '7px 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            <span>Tailor Resume</span>
          </button>
        </div>
      </div>
    </CardReveal>
  );
};
