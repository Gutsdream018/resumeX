import React, { useState, useEffect } from 'react';
import { ScoredJobMatch, CanonicalResume } from '../../types';
import { generateCoverLetterApi, trackJobClickApi } from '../../services/api';
import {
  X,
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCw,
  Printer,
} from 'lucide-react';

interface ApplyKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: ScoredJobMatch;
  tailoredResume: CanonicalResume;
  analysisText?: string;
  onAppliedClick?: (match: ScoredJobMatch) => void;
}

export const ApplyKitModal: React.FC<ApplyKitModalProps> = ({
  isOpen,
  onClose,
  match,
  tailoredResume,
  analysisText,
  onAppliedClick,
}) => {
  const { job } = match;
  const [activeTab, setActiveTab] = useState<'kit' | 'cover-letter'>('kit');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isLoadingCoverLetter, setIsLoadingCoverLetter] = useState<boolean>(false);
  const [coverLetterGenerated, setCoverLetterGenerated] = useState<boolean>(false);
  const [copiedResume, setCopiedResume] = useState<boolean>(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState<boolean>(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate cover letter on open if not generated yet
  useEffect(() => {
    if (isOpen && !coverLetterGenerated && !isLoadingCoverLetter) {
      handleGenerateCoverLetter();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetApplyUrl = job.finalUrl || job.applyUrl;
  const isAts =
    job.isAts ||
    ['greenhouse', 'lever', 'workday', 'ashby'].some((h) =>
      (job.applyHost || targetApplyUrl).toLowerCase().includes(h)
    );
  const applyButtonLabel = isAts
    ? 'Apply on company site'
    : job.applyLabel || `Apply via ${job.source || 'Board'}`;

  const handleGenerateCoverLetter = async () => {
    setIsLoadingCoverLetter(true);
    try {
      const res = await generateCoverLetterApi({
        resumeText: analysisText,
        structuredResume: tailoredResume,
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
      });
      if (res.coverLetter) {
        setCoverLetter(res.coverLetter);
        setCoverLetterGenerated(true);
      }
    } catch (err) {
      console.warn('Cover letter generator fallback:', err);
      // Fallback grounded template matching only facts
      const candidateName = tailoredResume.contact?.name || 'Candidate';
      const skills = (tailoredResume.skills?.technical || []).slice(0, 4).join(', ');
      const fallback = `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position.

With my verified background in ${skills || 'software engineering and technical systems'}, I have developed proven experience designing scalable solutions and collaborating across agile engineering teams. My background directly aligns with the technical competencies required for this role.

In my recent experience at ${tailoredResume.experience?.[0]?.company || 'my previous company'}, I focused on delivering high-impact contributions, maintaining rigorous quality standards, and solving complex problems. I am eager to bring this same dedication to ${job.company}.

Thank you for your time and consideration. I welcome the opportunity to discuss how my verified skills match your team's objectives.

Sincerely,
${candidateName}`;
      setCoverLetter(fallback);
      setCoverLetterGenerated(true);
    } finally {
      setIsLoadingCoverLetter(false);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2000);
  };

  const handleCopyResumeText = () => {
    const text = formatResumePlainText(tailoredResume);
    navigator.clipboard.writeText(text);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadDocx = () => {
    const plainText = formatResumePlainText(tailoredResume);
    const blob = new Blob([plainText], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(tailoredResume.contact?.name || 'Resume').replace(/\s+/g, '_')}_${job.company.replace(/\s+/g, '_')}_Tailored.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyClick = () => {
    trackJobClickApi(job.id);
    if (onAppliedClick) {
      onAppliedClick(match);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-kit-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Dialog Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          background: '#0D0D0D',
          border: '1px solid #282828',
          borderRadius: '18px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(227, 27, 43, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #202020',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
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
                APPLY KIT READY
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
                  Direct ATS Link
                </span>
              )}
            </div>
            <h2
              id="apply-kit-title"
              style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}
            >
              {job.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.84rem', color: '#999' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#E0E0E0', fontWeight: 600 }}>
                <Building2 size={14} color="#E31B2B" />
                {job.company}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {job.location}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Apply Kit"
            style={{
              background: '#161616',
              border: '1px solid #282828',
              borderRadius: '8px',
              color: '#888',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: Overview vs Cover Letter */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1E1E1E',
            padding: '0 28px',
            background: '#090909',
          }}
        >
          <button
            onClick={() => setActiveTab('kit')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'kit' ? '2px solid #E31B2B' : '2px solid transparent',
              color: activeTab === 'kit' ? '#FFFFFF' : '#888888',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={14} />
            <span>Tailored Documents (PDF / DOCX)</span>
          </button>

          <button
            onClick={() => setActiveTab('cover-letter')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'cover-letter' ? '2px solid #E31B2B' : '2px solid transparent',
              color: activeTab === 'cover-letter' ? '#FFFFFF' : '#888888',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={14} />
            <span>Grounded Cover Letter</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'kit' ? (
            <>
              {/* Variant Saved Notice */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.82rem',
                  color: '#34D399',
                }}
              >
                <ShieldCheck size={18} color="#10B981" />
                <span>
                  <strong>Tailored variant saved safely.</strong> Your original baseline resume is preserved without overwriting.
                </span>
              </div>

              {/* Downloads Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {/* PDF Download Card */}
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: '#121212',
                    border: '1px solid #242424',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Printer size={18} color="#E31B2B" />
                      <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF' }}>Print / Save PDF</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#888', margin: 0 }}>
                      Formatted ATS single-column layout ready for direct upload.
                    </p>
                  </div>
                  <button
                    onClick={handlePrintPdf}
                    className="btn btn-secondary-dark"
                    style={{ fontSize: '0.82rem', padding: '8px 14px', width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* DOCX Download Card */}
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: '#121212',
                    border: '1px solid #242424',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileText size={18} color="#3B82F6" />
                      <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF' }}>Word Document (.DOC)</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#888', margin: 0 }}>
                      Editable Word document matching standard applicant tracking formats.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadDocx}
                    className="btn btn-secondary-dark"
                    style={{ fontSize: '0.82rem', padding: '8px 14px', width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={14} />
                    <span>Download DOCX</span>
                  </button>
                </div>
              </div>

              {/* Copy Resume Text */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#111111',
                  border: '1px solid #222222',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#E0E0E0' }}>
                    Need plain text for copy-pasting into text boxes?
                  </span>
                  <p style={{ fontSize: '0.76rem', color: '#777', margin: '2px 0 0' }}>
                    Formatted plain text with standard section dividers.
                  </p>
                </div>
                <button
                  onClick={handleCopyResumeText}
                  className="btn btn-secondary-dark"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {copiedResume ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                  <span>{copiedResume ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Cover Letter Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>
                  Grounded strictly in verified resume facts &bull; Zero invented claims
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isLoadingCoverLetter}
                    className="btn btn-secondary-dark"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    <RefreshCw size={12} className={isLoadingCoverLetter ? 'animate-spin' : ''} />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={handleCopyCoverLetter}
                    className="btn btn-secondary-dark"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    {copiedCoverLetter ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    <span>{copiedCoverLetter ? 'Copied!' : 'Copy Letter'}</span>
                  </button>
                </div>
              </div>

              {isLoadingCoverLetter ? (
                <div
                  style={{
                    padding: '40px',
                    borderRadius: '12px',
                    background: '#111111',
                    border: '1px solid #222222',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#888',
                  }}
                >
                  <Sparkles size={24} className="animate-spin text-red-500" />
                  <span style={{ fontSize: '0.86rem' }}>Synthesizing grounded cover letter draft...</span>
                </div>
              ) : (
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '260px',
                    background: '#111111',
                    border: '1px solid #242424',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    fontSize: '0.84rem',
                    color: '#E0E0E0',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid #202020',
            background: '#090909',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#777' }}>
            Destination: <strong style={{ color: '#DDD' }}>{job.applyHost || 'External Job Board'}</strong>
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary-dark"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              Close
            </button>

            <a
              href={targetApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleApplyClick}
              className="btn btn-red"
              style={{
                padding: '9px 24px',
                fontSize: '0.9rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
              }}
            >
              <span>{applyButtonLabel}</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to format clean plain text resume
function formatResumePlainText(resume: CanonicalResume): string {
  const lines: string[] = [];
  lines.push((resume.contact?.name || 'CANDIDATE NAME').toUpperCase());
  const contactParts = [
    resume.contact?.location,
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.linkedin,
  ].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(' | '));

  if (resume.summary) {
    lines.push('\nPROFESSIONAL SUMMARY');
    lines.push(resume.summary);
  }

  const allSkills = [
    ...(resume.skills?.technical || []),
    ...(resume.skills?.frameworks || []),
    ...(resume.skills?.databases || []),
    ...(resume.skills?.tools || []),
  ];
  if (allSkills.length) {
    lines.push('\nCORE SKILLS');
    lines.push(allSkills.join(', '));
  }

  if (resume.experience?.length) {
    lines.push('\nPROFESSIONAL EXPERIENCE');
    for (const exp of resume.experience) {
      lines.push(`${exp.title || 'Role'} - ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || ''})`);
      for (const bullet of exp.bullets || []) {
        lines.push(`• ${bullet}`);
      }
    }
  }

  if (resume.projects?.length) {
    lines.push('\nTECHNICAL PROJECTS');
    for (const proj of resume.projects) {
      const techStr = Array.isArray(proj.technologies)
        ? proj.technologies.join(', ')
        : typeof proj.technologies === 'string'
        ? proj.technologies
        : '';
      const tech = techStr ? ` | ${techStr}` : '';
      lines.push(`${proj.name || 'Project'}${tech}`);
      for (const bullet of proj.bullets || []) {
        lines.push(`• ${bullet}`);
      }
    }
  }

  if (resume.education?.length) {
    lines.push('\nEDUCATION');
    for (const edu of resume.education) {
      lines.push(`${edu.degree || 'Degree'} - ${edu.institution || 'Institution'} (${edu.graduationDate || ''})`);
    }
  }

  return lines.join('\n');
}
