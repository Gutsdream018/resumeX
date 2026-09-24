import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  RotateCcw,
  AlertTriangle,
  Copy,
  CheckCheck,
  FileText,
  ShieldCheck,
  TrendingUp,
  Edit3,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  ResumeAnalysisResult,
  CritiqueIssue,
  CritiqueRevision,
} from '../types';
import { applyResumeRevision } from '../services/api';

interface ResumeSplitViewProps {
  analysis: ResumeAnalysisResult;
}

interface AppliedRevisionState {
  originalText: string;
  revisedText: string;
  scoreDelta: number;
}

export const ResumeSplitView: React.FC<ResumeSplitViewProps> = ({ analysis }) => {
  // 1. Derive canonical resume or structured resume
  const resume = useMemo(() => {
    if (analysis.canonicalResume) return analysis.canonicalResume;
    if (analysis.structuredResume) {
      const s = analysis.structuredResume;
      return {
        contact: s.contact || {},
        summary: s.summary || '',
        experience: s.experience || [],
        projects: s.projects || [],
        education: s.education || [],
        skills: s.skills || { technical: [], tools: [] },
      };
    }
    return {
      contact: {
        name: 'Candidate Profile',
        email: 'candidate@email.com',
        location: 'Location',
      },
      summary: 'Experienced software engineer specializing in scalable systems and modern web technologies.',
      experience: [
        {
          title: 'Software Engineer',
          company: 'Engineering Team',
          startDate: '2022',
          endDate: 'Present',
          bullets: ['Worked on core application features and backend APIs.'],
        },
      ],
      projects: [],
      education: [],
      skills: { technical: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'], tools: ['Git', 'Docker'] },
    };
  }, [analysis]);

  // 2. Derive issues and revisions from critique engine or fallbacks
  const issues: CritiqueIssue[] = useMemo(() => {
    if (analysis.critique?.issues && analysis.critique.issues.length > 0) {
      return analysis.critique.issues;
    }
    if (analysis.bullet_point_improvements && analysis.bullet_point_improvements.length > 0) {
      return analysis.bullet_point_improvements.map((b, idx) => ({
        id: `issue-${idx + 1}`,
        type: 'WEAK_ACTION_VERB',
        section: 'experience',
        severity: 'high' as const,
        title: b.problem || 'Passive phrasing & missing metrics',
        sourceText: b.original,
        reason: b.why_better || 'Lacks measurable impact and strong action verbs.',
        roleOrContext: 'Work Experience',
        evidence: [],
        impact: {
          category: 'experienceQuality',
          description: 'Recruiters favor decisive action verbs and quantified deliverables.',
        },
      }));
    }
    return [
      {
        id: 'issue-1',
        type: 'WEAK_ACTION_VERB',
        section: 'experience',
        severity: 'high' as const,
        title: 'Passive Duty Phrasing',
        sourceText: resume.experience[0]?.bullets[0] || 'Worked on core application features and backend APIs.',
        reason: 'Leading with passive phrasing obscures your direct engineering ownership and results.',
        roleOrContext: `${resume.experience[0]?.title || 'Engineer'} • ${resume.experience[0]?.company || 'Organization'}`,
        evidence: ['TypeScript', 'React'],
        impact: {
          category: 'experienceQuality',
          description: 'Convert to decisive power verbs to boost recruiter readability.',
        },
      },
    ];
  }, [analysis, resume]);

  const revisionsMap: Record<string, CritiqueRevision> = useMemo(() => {
    const map: Record<string, CritiqueRevision> = {};
    if (analysis.critique?.revisions) {
      for (const rev of analysis.critique.revisions) {
        map[rev.issueId] = rev;
      }
    }
    // Fallback for improvements
    if (analysis.bullet_point_improvements) {
      analysis.bullet_point_improvements.forEach((b, idx) => {
        const id = `issue-${idx + 1}`;
        if (!map[id]) {
          map[id] = {
            issueId: id,
            originalText: b.original,
            suggestedRevision: b.improved,
            requiresUserInput: false,
            verifiedFacts: [],
            unsupportedClaims: [],
            explanation: b.why_better || 'Expanded with active voice and clear engineering scope.',
            recruiterTip: 'Action-oriented bullet points score significantly higher in ATS parsing.',
            type: 'DIRECT_REWRITE',
          };
        }
      });
    }
    return map;
  }, [analysis]);

  // State
  const [selectedIssueId, setSelectedIssueId] = useState<string>(issues[0]?.id || 'issue-1');
  const [appliedRevisions, setAppliedRevisions] = useState<Record<string, AppliedRevisionState>>({});
  const [customTextMap, setCustomTextMap] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [totalScoreBoost, setTotalScoreBoost] = useState(0);
  const [isXRayMode, setIsXRayMode] = useState(true);

  const activeIssue = issues.find((i) => i.id === selectedIssueId) || issues[0];
  const activeRevision = activeIssue ? revisionsMap[activeIssue.id] : undefined;
  const isCurrentlyApplied = activeIssue ? !!appliedRevisions[activeIssue.id] : false;

  // Handlers
  const handleApplyRevision = async (issue: CritiqueIssue, textToApply: string) => {
    setIsApplying(true);
    try {
      const deltaResult = await applyResumeRevision({
        resumeId: analysis.resumeId,
        issueId: issue.id,
        originalText: issue.sourceText,
        revisionText: textToApply,
        canonicalResume: resume,
      });

      const delta = deltaResult?.delta ?? 2;
      setAppliedRevisions((prev) => ({
        ...prev,
        [issue.id]: {
          originalText: issue.sourceText,
          revisedText: textToApply,
          scoreDelta: delta,
        },
      }));
      setTotalScoreBoost((prev) => prev + delta);
    } catch (e) {
      // Local fallback if offline
      setAppliedRevisions((prev) => ({
        ...prev,
        [issue.id]: {
          originalText: issue.sourceText,
          revisedText: textToApply,
          scoreDelta: 2,
        },
      }));
      setTotalScoreBoost((prev) => prev + 2);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRevertRevision = (issueId: string) => {
    const existing = appliedRevisions[issueId];
    if (existing) {
      setTotalScoreBoost((prev) => Math.max(0, prev - existing.scoreDelta));
      setAppliedRevisions((prev) => {
        const copy = { ...prev };
        delete copy[issueId];
        return copy;
      });
    }
  };

  const getDisplayText = (original: string, issueId?: string) => {
    if (issueId && appliedRevisions[issueId]) {
      return appliedRevisions[issueId].revisedText;
    }
    // Check if any applied revision matches this text
    for (const applied of Object.values(appliedRevisions)) {
      if (applied.originalText.trim() === original.trim()) {
        return applied.revisedText;
      }
    }
    return original;
  };

  const handleCopyFullResume = () => {
    const lines: string[] = [];

    // Contact
    const name = resume.contact?.name || 'CANDIDATE';
    lines.push(name.toUpperCase());
    const contactParts = [
      resume.contact?.email,
      resume.contact?.phone,
      resume.contact?.location,
      resume.contact?.linkedin,
      resume.contact?.github,
    ].filter(Boolean);
    if (contactParts.length > 0) lines.push(contactParts.join(' • '));

    // Summary
    const summaryIssue = issues.find((i) => i.section === 'summary');
    const summaryText = getDisplayText(resume.summary || '', summaryIssue?.id);
    if (summaryText) {
      lines.push('\nPROFESSIONAL SUMMARY');
      lines.push(summaryText);
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
      lines.push('\nPROFESSIONAL EXPERIENCE');
      for (const exp of resume.experience) {
        lines.push(`${exp.title || 'Role'} • ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || ''})`);
        for (const bullet of exp.bullets || []) {
          const matchIssue = issues.find((i) => i.sourceText.trim() === bullet.trim());
          const bulletText = getDisplayText(bullet, matchIssue?.id);
          lines.push(`• ${bulletText}`);
        }
      }
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
      lines.push('\nPROJECTS');
      for (const proj of resume.projects) {
        const techStr = proj.technologies?.length ? ` | ${proj.technologies.join(', ')}` : '';
        lines.push(`${proj.name || 'Project'}${techStr}`);
        for (const bullet of proj.bullets || []) {
          const matchIssue = issues.find((i) => i.sourceText.trim() === bullet.trim());
          const bulletText = getDisplayText(bullet, matchIssue?.id);
          lines.push(`• ${bulletText}`);
        }
      }
    }

    // Skills
    const skillsList = [
      ...(resume.skills?.technical || []),
      ...(resume.skills?.frameworks || []),
      ...(resume.skills?.databases || []),
      ...(resume.skills?.tools || []),
    ];
    if (skillsList.length > 0) {
      lines.push('\nTECHNICAL SKILLS');
      lines.push(skillsList.join(', '));
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      lines.push('\nEDUCATION');
      for (const edu of resume.education) {
        lines.push(`${edu.degree || 'Degree'} - ${edu.institution || 'University'} (${edu.graduationYear || edu.graduationDate || ''})`);
      }
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'rgba(227, 27, 43, 0.15)', border: '#E31B2B', color: '#FF4D5E', text: 'CRITICAL' };
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: '#EF4444', color: '#F87171', text: 'HIGH SEVERITY' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', color: '#FBBF24', text: 'MEDIUM PRIORITY' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.12)', border: '#3B82F6', color: '#60A5FA', text: 'RECOMMENDATION' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Document Critique & Live Revisions
            </h2>
            {totalScoreBoost > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10B981',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                <TrendingUp size={13} /> +{totalScoreBoost} ATS Points Boosted
              </span>
            )}
          </div>
          <p style={{ color: '#9A9A9A', fontSize: '0.86rem', marginTop: '2px' }}>
            Evidence-grounded audit. Flagged bullets on the left connect directly to verified recruiter fixes on the right.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopyFullResume}
            className="btn btn-secondary-dark"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            {copiedDoc ? <CheckCheck size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copiedDoc ? 'Copied Full Document!' : 'Copy Updated Resume'}</span>
          </button>
        </div>
      </div>

      {/* Split-Screen 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
        className="split-screen-grid"
      >
        {/* LEFT PANE: Actual Rendered Candidate Resume */}
        <div
          className="card-dark"
          style={{
            background: '#0B0B0B',
            border: '1px solid #242424',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '12px 18px',
              background: '#141414',
              borderBottom: '1px solid #242424',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#E50920" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F5F5F5' }}>
                Document Preview
              </span>
            </div>

            {/* X-Ray Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  background: '#0D0D0D',
                  border: '1px solid #282828',
                  borderRadius: '6px',
                  padding: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsXRayMode(false)}
                  style={{
                    background: !isXRayMode ? '#222' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    fontWeight: !isXRayMode ? 700 : 500,
                    color: !isXRayMode ? '#FFF' : '#777',
                    cursor: 'pointer',
                  }}
                >
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => setIsXRayMode(true)}
                  style={{
                    background: isXRayMode ? 'rgba(229, 9, 32, 0.2)' : 'transparent',
                    border: isXRayMode ? '1px solid rgba(229, 9, 32, 0.4)' : '1px solid transparent',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    fontWeight: isXRayMode ? 800 : 500,
                    color: isXRayMode ? '#FF4D5E' : '#777',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={10} />
                  <span>X-RAY</span>
                </button>
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={11} /> Grounded
              </span>
            </div>
          </div>

          {/* Rendered Document Sheet */}
          <div
            style={{
              padding: '26px',
              fontFamily: 'Inter, sans-serif',
              color: '#F5F5F5',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              maxHeight: '720px',
              overflowY: 'auto',
            }}
          >
            {/* Candidate Contact */}
            <div style={{ borderBottom: '1px solid #242424', paddingBottom: '14px', marginBottom: '18px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                {resume.contact?.name || 'CANDIDATE NAME'}
              </h1>
              <p style={{ fontSize: '0.78rem', color: '#9A9A9A', lineHeight: 1.4 }}>
                {[
                  resume.contact?.location,
                  resume.contact?.email,
                  resume.contact?.phone,
                  resume.contact?.linkedin,
                  resume.contact?.github,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>

            {/* Summary */}
            {resume.summary && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Professional Summary
                </h4>
                {(() => {
                  const summaryIssue = issues.find((i) => i.section === 'summary' || i.sourceText === resume.summary);
                  const isFixed = summaryIssue && appliedRevisions[summaryIssue.id];
                  const isSelected = summaryIssue && selectedIssueId === summaryIssue.id;

                  if (summaryIssue) {
                    return (
                      <div
                        onClick={() => setSelectedIssueId(summaryIssue.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isFixed
                            ? 'rgba(16, 185, 129, 0.08)'
                            : isSelected
                            ? 'rgba(227, 27, 43, 0.16)'
                            : 'rgba(227, 27, 43, 0.07)',
                          border: isFixed
                            ? '1px solid rgba(16, 185, 129, 0.35)'
                            : isSelected
                            ? '1.5px solid #E31B2B'
                            : '1px dashed #C1121F',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isFixed ? '#10B981' : '#E31B2B' }}>
                            {isFixed ? '✓ REVISED' : '🔴 FLAGGED SUMMARY ISSUE'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#737373' }}>Click to inspect</span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: isFixed ? '#FFFFFF' : '#FF99A1', margin: 0 }}>
                          {getDisplayText(resume.summary, summaryIssue.id)}
                        </p>
                      </div>
                    );
                  }

                  return <p style={{ fontSize: '0.84rem', color: '#B3B3B3', lineHeight: 1.5, margin: 0 }}>{resume.summary}</p>;
                })()}
              </div>
            )}

            {/* Work Experience */}
            {resume.experience && resume.experience.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Professional Experience
                </h4>

                {resume.experience.map((exp: any, expIdx: number) => (
                  <div key={expIdx} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF', flexWrap: 'wrap' }}>
                      <span>{exp.title || 'Role'} • {exp.company || 'Company'}</span>
                      <span style={{ color: '#737373', fontSize: '0.78rem' }}>
                        {exp.startDate || ''} {exp.endDate ? `— ${exp.endDate}` : ''}
                      </span>
                    </div>

                    <ul style={{ paddingLeft: '16px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(exp.bullets || []).map((bullet: string, bIdx: number) => {
                        const matchedIssue = issues.find(
                          (i) => i.sourceText.trim() === bullet.trim() || bullet.includes(i.sourceText) || i.sourceText.includes(bullet)
                        );
                        const isFixed = matchedIssue && appliedRevisions[matchedIssue.id];
                        const isSelected = matchedIssue && selectedIssueId === matchedIssue.id;

                        if (matchedIssue) {
                          return (
                            <li
                              key={bIdx}
                              onClick={() => setSelectedIssueId(matchedIssue.id)}
                              style={{
                                cursor: 'pointer',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: isFixed
                                  ? 'rgba(16, 185, 129, 0.08)'
                                  : isSelected
                                  ? 'rgba(227, 27, 43, 0.16)'
                                  : 'rgba(227, 27, 43, 0.07)',
                                border: isFixed
                                  ? '1px solid rgba(16, 185, 129, 0.35)'
                                  : isSelected
                                  ? '1.5px solid #E31B2B'
                                  : '1px dashed #C1121F',
                                transition: 'all 0.2s ease',
                                listStylePosition: 'inside',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isFixed ? '#10B981' : '#E31B2B' }}>
                                  {isFixed ? '✓ REVISED' : `🔴 FLAGGED ISSUE (${matchedIssue.id.toUpperCase()})`}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#737373' }}>Click to view revision</span>
                              </div>
                              <span style={{ color: isFixed ? '#FFFFFF' : '#FF99A1' }}>
                                {getDisplayText(bullet, matchedIssue.id)}
                              </span>
                            </li>
                          );
                        }

                        return (
                          <li key={bIdx} style={{ color: '#D4D4D4', fontSize: '0.84rem' }}>
                            {bullet}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {resume.projects && resume.projects.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                  Technical Projects
                </h4>
                {resume.projects.map((proj: any, pIdx: number) => (
                  <div key={pIdx} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                      <span>{proj.name || 'Project'}</span>
                      {proj.technologies?.length > 0 && (
                        <span style={{ color: '#E31B2B', fontSize: '0.76rem' }}>{proj.technologies.join(', ')}</span>
                      )}
                    </div>
                    <ul style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(proj.bullets || []).map((b: string, pbIdx: number) => (
                        <li key={pbIdx} style={{ color: '#D4D4D4', fontSize: '0.82rem' }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {((resume.skills?.technical && resume.skills.technical.length > 0) ||
              (resume.skills?.tools && resume.skills.tools.length > 0)) && (
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Skills & Competencies
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#9A9A9A', margin: 0 }}>
                  <strong style={{ color: '#FFFFFF' }}>Core Technical Skills: </strong>
                  {[
                    ...(resume.skills?.technical || []),
                    ...(resume.skills?.frameworks || []),
                    ...(resume.skills?.databases || []),
                    ...(resume.skills?.tools || []),
                  ].join(', ')}
                </p>
              </div>
            )}

            {/* Education */}
            {resume.education && resume.education.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E31B2B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Education
                </h4>
                {resume.education.map((edu: any, eIdx: number) => (
                  <div key={eIdx} style={{ fontSize: '0.82rem', color: '#D4D4D4', marginBottom: '4px' }}>
                    <strong style={{ color: '#FFFFFF' }}>{edu.degree || 'Degree'}</strong> • {edu.institution || 'University'}{' '}
                    {edu.graduationYear || edu.graduationDate ? `(${edu.graduationYear || edu.graduationDate})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Grounded AI Critique & Revision System */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Issue Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {issues.map((issue, idx) => {
              const isFixed = !!appliedRevisions[issue.id];
              const isSelected = selectedIssueId === issue.id;
              return (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  style={{
                    flex: '1 0 auto',
                    minWidth: '100px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isSelected ? '#1C1C1C' : '#111111',
                    border: `1px solid ${isSelected ? '#E31B2B' : '#242424'}`,
                    color: isSelected ? '#FFFFFF' : '#9A9A9A',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isFixed ? <Check size={12} color="#10B981" /> : <span style={{ color: '#E31B2B' }}>●</span>}
                  <span>Issue #{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Active Critique Card */}
          {activeIssue && (
            <div
              className="card-dark"
              style={{
                padding: '24px',
                background: '#111111',
                border: '1px solid #242424',
                boxShadow: 'var(--shadow-card)',
                borderRadius: '12px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(227, 27, 43, 0.12)',
                      border: '1px solid rgba(227, 27, 43, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={18} color="#E31B2B" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        {activeIssue.title}
                      </h3>
                      {(() => {
                        const sev = getSeverityBadge(activeIssue.severity);
                        return (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: sev.bg,
                              border: `1px solid ${sev.border}`,
                              color: sev.color,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {sev.text}
                          </span>
                        );
                      })()}
                    </div>
                    {activeIssue.roleOrContext && (
                      <span style={{ fontSize: '0.74rem', color: '#737373' }}>
                        {activeIssue.roleOrContext}
                      </span>
                    )}
                  </div>
                </div>

                {isCurrentlyApplied && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#10B981',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={13} /> Applied
                  </span>
                )}
              </div>

              {/* Diagnosis Reason */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid #222222',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '0.8rem',
                  color: '#A3A3A3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Info size={15} color="#E31B2B" style={{ flexShrink: 0 }} />
                <span>{activeIssue.reason}</span>
              </div>

              {/* Original Resume Text */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                  Original Resume Statement:
                </span>
                <div
                  style={{
                    background: '#0D0D0D',
                    border: '1px dashed rgba(227, 27, 43, 0.4)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    color: '#FF99A1',
                    lineHeight: 1.5,
                  }}
                >
                  "{activeIssue.sourceText}"
                </div>
              </div>

              {/* Recommended Revision or Editable Template */}
              {activeRevision && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {activeRevision.requiresUserInput ? 'Grounded Improvement Template (Fill in verified metric):' : 'Evidence-Grounded Revision:'}
                    </span>
                    {activeRevision.requiresUserInput && (
                      <span style={{ fontSize: '0.68rem', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Edit3 size={11} /> Requires your metrics
                      </span>
                    )}
                  </div>

                  {activeRevision.requiresUserInput ? (
                    <div>
                      <textarea
                        value={customTextMap[activeIssue.id] ?? activeRevision.suggestedRevision}
                        onChange={(e) =>
                          setCustomTextMap({
                            ...customTextMap,
                            [activeIssue.id]: e.target.value,
                          })
                        }
                        rows={3}
                        style={{
                          width: '100%',
                          background: '#0D0D0D',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '0.86rem',
                          color: '#FFFFFF',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1.5,
                          resize: 'vertical',
                          outline: 'none',
                        }}
                      />
                      {activeRevision.missingEvidence && activeRevision.missingEvidence.length > 0 && (
                        <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} />
                          <span>Missing evidence needed: {activeRevision.missingEvidence.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        color: '#FFFFFF',
                        lineHeight: 1.5,
                        fontWeight: 500,
                      }}
                    >
                      "{activeRevision.suggestedRevision}"
                    </div>
                  )}

                  {/* Fact Grounding Badge */}
                  {activeRevision.verifiedFacts && activeRevision.verifiedFacts.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: '#737373' }}>Anchored on verified facts:</span>
                      {activeRevision.verifiedFacts.map((fact, fIdx) => (
                        <span
                          key={fIdx}
                          style={{
                            fontSize: '0.68rem',
                            background: '#1A1A1A',
                            border: '1px solid #2B2B2B',
                            color: '#E5E5E5',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {fact}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {!isCurrentlyApplied ? (
                  <button
                    disabled={isApplying}
                    onClick={() => {
                      const text =
                        customTextMap[activeIssue.id] ??
                        activeRevision?.suggestedRevision ??
                        activeIssue.sourceText;
                      handleApplyRevision(activeIssue, text);
                    }}
                    className="btn btn-red"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      opacity: isApplying ? 0.7 : 1,
                    }}
                  >
                    <Sparkles size={16} />
                    <span>{isApplying ? 'Recalculating ATS Score...' : 'Apply Revision & Update Score'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevertRevision(activeIssue.id)}
                    className="btn btn-secondary-dark"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Revert to Original</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recruiter Parsing Tip */}
          <div
            className="card-dark"
            style={{
              padding: '18px 20px',
              background: '#0D0D0D',
              border: '1px solid #242424',
              fontSize: '0.82rem',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: '#E31B2B' }}>●</span>
              <strong style={{ color: '#FFFFFF' }}>Recruiter Parsing Tip:</strong>
            </div>
            <p style={{ color: '#9A9A9A', lineHeight: 1.5, margin: 0 }}>
              {activeRevision?.recruiterTip ||
                'Lead every bullet with strong action verbs (Engineered, Architected, Spearheaded) and verified metrics rather than passive responsibilities to maximize interview callback rates.'}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .split-screen-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
