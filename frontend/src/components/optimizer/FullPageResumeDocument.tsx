import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { CanonicalResume } from '../../types';
import { ResumeTemplatePreset, DocumentTheme } from './FullPageOptimizerHeader';
import { DrawerRecommendation } from './AiOptimizationDrawer';

interface FullPageResumeDocumentProps {
  resume: CanonicalResume;
  docTheme: DocumentTheme;
  templatePreset: ResumeTemplatePreset;
  appliedRevisions: Set<string>;
  recommendations: DrawerRecommendation[];
  onSelectIssue: (issueId: string) => void;
  onChange: (updatedResume: CanonicalResume, changeDescription?: string) => void;
}

export const FullPageResumeDocument: React.FC<FullPageResumeDocumentProps> = ({
  resume,
  docTheme,
  templatePreset,
  appliedRevisions,
  recommendations,
  onSelectIssue,
  onChange,
}) => {
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>('technical');
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [isAddingSkill, setIsAddingSkill] = useState<boolean>(false);
  const [showAddSectionMenu, setShowAddSectionMenu] = useState<boolean>(false);

  // Quick lookup map for recommendations by bulletId / section key
  const recMap = new Map<string, DrawerRecommendation>();
  recommendations.forEach((r) => {
    recMap.set(r.id, r);
  });

  // Contact change
  const handleContactChange = (field: keyof typeof resume.contact, val: string) => {
    const next = {
      ...resume,
      contact: {
        ...resume.contact,
        [field]: val,
      },
    };
    onChange(next, `Updated contact ${field}`);
  };

  const handleSummaryChange = (val: string) => {
    const next = { ...resume, summary: val };
    onChange(next, 'Updated professional summary');
  };

  // Experience handlers
  const handleExpFieldChange = (idx: number, field: string, val: any) => {
    const nextExp = [...(resume.experience || [])];
    nextExp[idx] = { ...nextExp[idx], [field]: val };
    onChange({ ...resume, experience: nextExp }, `Updated experience entry`);
  };

  const handleBulletChange = (expIdx: number, bulletIdx: number, val: string) => {
    const nextExp = [...(resume.experience || [])];
    const nextBullets = [...(nextExp[expIdx].bullets || [])];
    nextBullets[bulletIdx] = val;
    nextExp[expIdx] = { ...nextExp[expIdx], bullets: nextBullets };
    onChange({ ...resume, experience: nextExp }, `Edited experience bullet`);
  };

  const addBullet = (expIdx: number) => {
    const nextExp = [...(resume.experience || [])];
    const nextBullets = [...(nextExp[expIdx].bullets || []), 'Engineered core feature delivering measurable 25% efficiency gains.'];
    nextExp[expIdx] = { ...nextExp[expIdx], bullets: nextBullets };
    onChange({ ...resume, experience: nextExp }, `Added bullet point`);
  };

  const deleteBullet = (expIdx: number, bulletIdx: number) => {
    const nextExp = [...(resume.experience || [])];
    const nextBullets = nextExp[expIdx].bullets.filter((_, i) => i !== bulletIdx);
    nextExp[expIdx] = { ...nextExp[expIdx], bullets: nextBullets };
    onChange({ ...resume, experience: nextExp }, `Deleted bullet point`);
  };

  const addExperienceRole = () => {
    const nextExp = [
      {
        title: 'Software Engineer',
        company: 'Company Name',
        location: 'City, State',
        startDate: '2023',
        endDate: 'Present',
        bullets: [
          'Architected scalable backend microservices utilizing Node.js, PostgreSQL, and Docker.',
          'Optimized database queries and Redis caching, reducing endpoint latency by 32%.',
        ],
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL'],
      },
      ...(resume.experience || []),
    ];
    onChange({ ...resume, experience: nextExp }, 'Added work experience role');
  };

  const deleteExperienceRole = (idx: number) => {
    const nextExp = (resume.experience || []).filter((_, i) => i !== idx);
    onChange({ ...resume, experience: nextExp }, 'Deleted work experience role');
  };

  // Projects handlers
  const handleProjectFieldChange = (idx: number, field: string, val: any) => {
    const nextProj = [...(resume.projects || [])];
    nextProj[idx] = { ...nextProj[idx], [field]: val };
    onChange({ ...resume, projects: nextProj }, 'Updated project details');
  };

  const addProject = () => {
    const nextProj = [
      {
        name: 'Distributed Systems Pipeline',
        description: 'Engineered high-throughput event processing pipeline handling 100k daily events.',
        technologies: ['Go', 'Kafka', 'Redis'],
        link: 'https://github.com/example/pipeline',
      },
      ...(resume.projects || []),
    ];
    onChange({ ...resume, projects: nextProj }, 'Added new technical project');
  };

  const deleteProject = (idx: number) => {
    const nextProj = (resume.projects || []).filter((_, i) => i !== idx);
    onChange({ ...resume, projects: nextProj }, 'Deleted project');
  };

  // Skills handlers
  const handleAddSkill = (category: string, skill: string) => {
    if (!skill.trim()) return;
    const skills = { ...resume.skills };
    const list = [...((skills as any)[category] || [])];
    if (!list.includes(skill.trim())) {
      list.push(skill.trim());
      (skills as any)[category] = list;
      onChange({ ...resume, skills }, `Added skill ${skill}`);
    }
    setNewSkillInput('');
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = (category: string, skill: string) => {
    const skills = { ...resume.skills };
    const list = ((skills as any)[category] || []).filter((s: string) => s !== skill);
    (skills as any)[category] = list;
    onChange({ ...resume, skills }, `Removed skill ${skill}`);
  };

  // Education handlers
  const handleEduFieldChange = (idx: number, field: string, val: string) => {
    const nextEdu = [...(resume.education || [])];
    nextEdu[idx] = { ...nextEdu[idx], [field]: val };
    onChange({ ...resume, education: nextEdu }, 'Updated education entry');
  };

  const addEducation = () => {
    const nextEdu = [
      ...(resume.education || []),
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University Name',
        graduationDate: '2023',
        gpa: '3.8',
      },
    ];
    onChange({ ...resume, education: nextEdu }, 'Added education entry');
  };

  const deleteEducation = (idx: number) => {
    const nextEdu = (resume.education || []).filter((_, i) => i !== idx);
    onChange({ ...resume, education: nextEdu }, 'Deleted education entry');
  };

  const addSection = (sectionName: string) => {
    setShowAddSectionMenu(false);
    const next = { ...resume };
    if (sectionName === 'summary' && !next.summary) {
      next.summary = 'Results-driven software engineer with extensive experience building scalable distributed web architectures.';
    } else if (sectionName === 'experience' && (!next.experience || next.experience.length === 0)) {
      next.experience = [
        {
          title: 'Software Engineer',
          company: 'Technology Solutions',
          startDate: '2022',
          endDate: 'Present',
          bullets: ['Engineered scalable microservices utilizing Node.js, TypeScript, and AWS.'],
        },
      ];
    } else if (sectionName === 'projects' && (!next.projects || next.projects.length === 0)) {
      next.projects = [
        {
          name: 'Distributed Event Streamer',
          description: 'Engineered high-throughput event processing pipeline handling 50k daily events.',
          technologies: ['Go', 'Kafka'],
        },
      ];
    } else if (sectionName === 'certifications' && (!next.certifications || next.certifications.length === 0)) {
      next.certifications = ['AWS Certified Solutions Architect – Associate'];
    } else if (sectionName === 'achievements' && (!next.achievements || next.achievements.length === 0)) {
      next.achievements = ['Won 1st Place at National Tech Hackathon 2023'];
    }
    onChange(next, `Added ${sectionName} section`);
  };

  // Theme & Template styling configurations
  const isDark = docTheme === 'dark';
  const paperBg = isDark ? '#141414' : '#FFFFFF';
  const textPrimary = isDark ? '#F3F4F6' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#4B5563';
  const dividerColor = isDark ? '#262626' : '#E5E7EB';
  const headerBorder = isDark ? '1px solid #333333' : '1px solid #1A1A1A';

  const getFontFamily = () => {
    switch (templatePreset) {
      case 'ats_classic':
        return "'Times New Roman', Times, Georgia, serif";
      case 'minimal':
        return "'Helvetica Neue', Arial, sans-serif";
      case 'technical':
      case 'engineering':
        return "'Inter', -apple-system, sans-serif";
      case 'student':
        return "'Georgia', serif";
      case 'modern_pro':
      default:
        return "'Inter', 'Segoe UI', -apple-system, sans-serif";
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 20px 80px',
        backgroundColor: '#070707',
        minHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Realistic A4 Paper Canvas */}
      <div
        id="resume-document-a4-sheet"
        className="resume-a4-canvas"
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: paperBg,
          color: textPrimary,
          boxShadow: isDark
            ? '0 12px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          borderRadius: '4px',
          padding: '46px 50px',
          boxSizing: 'border-box',
          position: 'relative',
          fontFamily: getFontFamily(),
          lineHeight: '1.48',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        {/* ================= 1. HEADER: NAME & CONTACT ================= */}
        <div
          id="section-contact"
          style={{
            textAlign: 'center',
            marginBottom: '18px',
            borderBottom: headerBorder,
            paddingBottom: '12px',
          }}
        >
          {/* Full Name */}
          <input
            type="text"
            value={resume.contact?.name || ''}
            onChange={(e) => handleContactChange('name', e.target.value)}
            placeholder="CANDIDATE FULL NAME"
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: textPrimary,
              border: '1px dashed transparent',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              padding: '2px 4px',
            }}
            className="doc-editable-input doc-editable-name"
          />

          {/* Compact Contact Row: Email | Phone | Location | LinkedIn | Portfolio */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: textSecondary,
              marginTop: '4px',
            }}
          >
            <input
              type="text"
              value={resume.contact?.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
              placeholder="email@example.com"
              style={{
                textAlign: 'center',
                border: '1px dashed transparent',
                outline: 'none',
                background: 'transparent',
                fontSize: 'inherit',
                color: 'inherit',
                width: '170px',
              }}
              className="doc-editable-input"
            />
            <span>|</span>
            <input
              type="text"
              value={resume.contact?.phone || ''}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              placeholder="(555) 000-0000"
              style={{
                textAlign: 'center',
                border: '1px dashed transparent',
                outline: 'none',
                background: 'transparent',
                fontSize: 'inherit',
                color: 'inherit',
                width: '120px',
              }}
              className="doc-editable-input"
            />
            <span>|</span>
            <input
              type="text"
              value={resume.contact?.location || ''}
              onChange={(e) => handleContactChange('location', e.target.value)}
              placeholder="City, State"
              style={{
                textAlign: 'center',
                border: '1px dashed transparent',
                outline: 'none',
                background: 'transparent',
                fontSize: 'inherit',
                color: 'inherit',
                width: '130px',
              }}
              className="doc-editable-input"
            />
            {resume.contact?.linkedin && (
              <>
                <span>|</span>
                <input
                  type="text"
                  value={resume.contact.linkedin}
                  onChange={(e) => handleContactChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/profile"
                  style={{
                    textAlign: 'center',
                    border: '1px dashed transparent',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 'inherit',
                    color: 'inherit',
                    width: '160px',
                  }}
                  className="doc-editable-input"
                />
              </>
            )}
            {resume.contact?.portfolio && (
              <>
                <span>|</span>
                <input
                  type="text"
                  value={resume.contact.portfolio}
                  onChange={(e) => handleContactChange('portfolio', e.target.value)}
                  placeholder="portfolio.dev"
                  style={{
                    textAlign: 'center',
                    border: '1px dashed transparent',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 'inherit',
                    color: 'inherit',
                    width: '130px',
                  }}
                  className="doc-editable-input"
                />
              </>
            )}
          </div>
        </div>

        {/* ================= 2. PROFESSIONAL SUMMARY ================= */}
        {recMap.has('structure-decomposition') && !appliedRevisions.has('structure-decomposition') && (
          <div
            style={{
              marginBottom: '14px',
              padding: '10px 14px',
              background: isDark ? 'linear-gradient(90deg, rgba(227, 27, 43, 0.18), rgba(227, 27, 43, 0.06))' : 'linear-gradient(90deg, #FEF2F2, #FFF5F5)',
              border: '1px solid #E31B2B',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#E31B2B" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>
                  Mashed Sections Detected in Summary
                </div>
                <div style={{ fontSize: '0.74rem', color: textSecondary }}>
                  Education, Certifications, and Internships are compressed into your summary. Auto-separate into clean ATS sections.
                </div>
              </div>
            </div>
            <button
              onClick={() => onSelectIssue('structure-decomposition')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#E31B2B',
                color: '#FFF',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(227, 27, 43, 0.3)',
              }}
            >
              <Sparkles size={11} /> Auto-Separate Sections
            </button>
          </div>
        )}

        {resume.summary && (
          <div id="section-summary" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
            <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
                  Professional Summary
                </span>

                {appliedRevisions.has('summary') && (
                  <span className="doc-optimized-badge">
                    <Check size={10} /> Optimized
                  </span>
                )}

                {recMap.has('summary') && !appliedRevisions.has('summary') && (
                  <button
                    className="doc-ai-subtle-sparkle-btn"
                    onClick={() => onSelectIssue('summary')}
                    title="Click to view AI optimization"
                  >
                    <Sparkles size={11} />
                    <span>Improve</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={resume.summary || ''}
              onChange={(e) => handleSummaryChange(e.target.value)}
              rows={Math.max(2, Math.ceil(resume.summary.length / 100))}
              style={{
                width: '100%',
                fontSize: '0.84rem',
                lineHeight: '1.48',
                color: textPrimary,
                border: '1px dashed transparent',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                resize: 'none',
                padding: '3px 4px',
                boxSizing: 'border-box',
                marginTop: '4px',
              }}
              className="doc-editable-input"
            />
          </div>
        )}

        {/* ================= 3. WORK EXPERIENCE & INTERNSHIPS ================= */}
        <div id="section-experience" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
          <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
                Work Experience & Internships
              </span>
            </div>

            <button
              onClick={addExperienceRole}
              className="doc-header-add-btn"
              title="Add new role"
            >
              <Plus size={12} /> Add Role
            </button>
          </div>

          {/* Roles List */}
          {(!resume.experience || resume.experience.length === 0) ? (
            <div
              style={{
                padding: '12px',
                border: isDark ? '1px dashed #333' : '1px dashed #E2E8F0',
                borderRadius: '6px',
                textAlign: 'center',
                marginTop: '6px',
              }}
            >
              <p style={{ fontSize: '0.8rem', color: textSecondary, margin: '0 0 6px 0' }}>
                No work experience or internships listed yet.
              </p>
              <button
                onClick={addExperienceRole}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#E31B2B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={11} /> Add Experience / Internship
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
              {resume.experience.map((exp: any, expIdx: number) => (
                <div key={expIdx} className="doc-role-card">
                  {/* Role Title, Company, Location & Dates */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <input
                        type="text"
                        value={exp.title || ''}
                        onChange={(e) => handleExpFieldChange(expIdx, 'title', e.target.value)}
                        placeholder="Job Title / Internship Role"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: textPrimary,
                          border: '1px dashed transparent',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'inherit',
                          width: '45%',
                        }}
                        className="doc-editable-input"
                      />
                      <span style={{ color: textSecondary }}>•</span>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => handleExpFieldChange(expIdx, 'company', e.target.value)}
                        placeholder="Company / Organization Name"
                        style={{
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          color: textPrimary,
                          border: '1px dashed transparent',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'inherit',
                          width: '40%',
                        }}
                        className="doc-editable-input"
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: textSecondary }}>
                      <input
                        type="text"
                        value={`${exp.startDate || ''} – ${exp.endDate || ''}`}
                        onChange={(e) => {
                          const [s, end] = e.target.value.split(/[–-]/).map((t: string) => t.trim());
                          handleExpFieldChange(expIdx, 'startDate', s || '');
                          handleExpFieldChange(expIdx, 'endDate', end || '');
                        }}
                        placeholder="2022 – Present"
                        style={{
                          textAlign: 'right',
                          fontSize: 'inherit',
                          color: 'inherit',
                          border: '1px dashed transparent',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'inherit',
                          width: '120px',
                        }}
                        className="doc-editable-input"
                      />
                      <button
                        onClick={() => deleteExperienceRole(expIdx)}
                        className="doc-item-delete-btn"
                        title="Delete role"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Bullets */}
                  <ul style={{ margin: '3px 0 0 16px', padding: 0, listStyleType: 'disc' }}>
                    {(exp.bullets || []).map((bullet: string, bIdx: number) => {
                      const bulletKey = `exp-${expIdx}-bullet-${bIdx}`;
                      const isOptimized = appliedRevisions.has(bulletKey);
                      const rec = recMap.get(bulletKey);

                      return (
                        <li key={bIdx} className="doc-bullet-item" style={{ marginBottom: '3px', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                            <textarea
                              value={bullet}
                              onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)}
                              rows={Math.max(1, Math.ceil(bullet.length / 95))}
                              style={{
                                flex: 1,
                                fontSize: '0.82rem',
                                color: textPrimary,
                                border: '1px dashed transparent',
                                outline: 'none',
                                background: 'transparent',
                                fontFamily: 'inherit',
                                lineHeight: '1.45',
                                resize: 'none',
                                padding: '1px 3px',
                              }}
                              className="doc-editable-input"
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginTop: '2px' }}>
                              {isOptimized && (
                                <span className="doc-optimized-badge">
                                  <Check size={9} /> Optimized
                                </span>
                              )}

                              {rec && !isOptimized && (
                                <button
                                  className="doc-ai-subtle-sparkle-btn"
                                  onClick={() => onSelectIssue(bulletKey)}
                                  title="Click to view AI optimization"
                                >
                                  <Sparkles size={10} />
                                  <span>Improve</span>
                                </button>
                              )}

                              <div className="doc-bullet-hover-toolbar">
                                <button onClick={() => deleteBullet(expIdx, bIdx)} title="Delete bullet">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={() => addBullet(expIdx)}
                    className="doc-add-inline-btn"
                    style={{ marginLeft: '16px', marginTop: '2px' }}
                  >
                    <Plus size={10} /> Add bullet
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= 4. PROJECTS & TECHNICAL SEMINARS ================= */}
        <div id="section-projects" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
          <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
                Projects & Technical Seminars
              </span>
            </div>

            <button
              onClick={addProject}
              className="doc-header-add-btn"
              title="Add Project"
            >
              <Plus size={12} /> Add Project
            </button>
          </div>

          {(!resume.projects || resume.projects.length === 0) ? (
            <div
              style={{
                padding: '10px',
                border: isDark ? '1px dashed #333' : '1px dashed #E2E8F0',
                borderRadius: '6px',
                textAlign: 'center',
                marginTop: '6px',
              }}
            >
              <p style={{ fontSize: '0.8rem', color: textSecondary, margin: '0 0 6px 0' }}>
                No technical projects or seminar presentations added.
              </p>
              <button
                onClick={addProject}
                style={{
                  padding: '3px 8px',
                  backgroundColor: isDark ? '#2D2D2D' : '#F1F5F9',
                  color: textPrimary,
                  border: isDark ? '1px solid #444' : '1px solid #CBD5E1',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={10} /> Add Project / Seminar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              {resume.projects.map((proj: any, projIdx: number) => (
                <div key={projIdx} className="doc-role-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        value={proj.name || ''}
                        onChange={(e) => handleProjectFieldChange(projIdx, 'name', e.target.value)}
                        placeholder="Project Name / Seminar Topic"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          color: textPrimary,
                          border: '1px dashed transparent',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'inherit',
                          width: '35%',
                        }}
                        className="doc-editable-input"
                      />
                      <span style={{ color: textSecondary }}>|</span>
                      <input
                        type="text"
                        value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || ''}
                        onChange={(e) =>
                          handleProjectFieldChange(
                            projIdx,
                            'technologies',
                            e.target.value.split(',').map((t: string) => t.trim())
                          )
                        }
                        placeholder="Technologies / Tools (e.g. AutoCAD, CATIA, Microturbines)"
                        style={{
                          fontSize: '0.8rem',
                          color: textSecondary,
                          border: '1px dashed transparent',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'inherit',
                          flex: 1,
                        }}
                        className="doc-editable-input"
                      />
                    </div>

                    <button
                      onClick={() => deleteProject(projIdx)}
                      className="doc-item-delete-btn"
                      title="Delete project"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  <textarea
                    value={proj.description || ''}
                    onChange={(e) => handleProjectFieldChange(projIdx, 'description', e.target.value)}
                    placeholder="Describe implementation details, scope, and technical outcomes..."
                    rows={2}
                    style={{
                      width: '100%',
                      fontSize: '0.82rem',
                      color: textPrimary,
                      border: '1px dashed transparent',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: 'inherit',
                      lineHeight: '1.45',
                      resize: 'none',
                      marginTop: '2px',
                    }}
                    className="doc-editable-input"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= 5. TECHNICAL SKILLS ================= */}
        <div id="section-skills" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
          <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
                Technical Skills & Competencies
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontSize: '0.82rem' }}>
            {/* Technical / CAD Tools */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontWeight: 700, minWidth: '120px', color: textPrimary }}>Technical / CAD:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, alignItems: 'center' }}>
                {(resume.skills?.technical || []).map((s: string, idx: number) => (
                  <span key={idx} className={isDark ? 'doc-skill-tag-dark' : 'doc-skill-tag-light'}>
                    {s}
                    <button onClick={() => handleRemoveSkill('technical', s)} title="Remove">
                      <X size={9} />
                    </button>
                  </span>
                ))}

                {isAddingSkill && activeSkillCategory === 'technical' ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <input
                      type="text"
                      autoFocus
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSkill('technical', newSkillInput);
                        if (e.key === 'Escape') setIsAddingSkill(false);
                      }}
                      placeholder="Skill..."
                      style={{
                        padding: '1px 5px',
                        fontSize: '0.72rem',
                        border: '1px solid #777',
                        borderRadius: '3px',
                        outline: 'none',
                        width: '75px',
                        background: 'transparent',
                        color: textPrimary,
                      }}
                    />
                    <button
                      onClick={() => handleAddSkill('technical', newSkillInput)}
                      style={{ fontSize: '0.7rem', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '3px', padding: '1px 5px' }}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveSkillCategory('technical');
                      setIsAddingSkill(true);
                    }}
                    className="doc-add-skill-pill"
                  >
                    <Plus size={9} /> Add
                  </button>
                )}
              </div>
            </div>

            {/* Frameworks, Tools & Processes */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontWeight: 700, minWidth: '120px', color: textPrimary }}>Tools & Processes:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, alignItems: 'center' }}>
                {[...(resume.skills?.frameworks || []), ...(resume.skills?.tools || []), ...(resume.skills?.databases || [])].map((s: string, idx: number) => (
                  <span key={idx} className={isDark ? 'doc-skill-tag-dark' : 'doc-skill-tag-light'}>
                    {s}
                    <button onClick={() => handleRemoveSkill('tools', s)} title="Remove">
                      <X size={9} />
                    </button>
                  </span>
                ))}

                {isAddingSkill && activeSkillCategory === 'tools' ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <input
                      type="text"
                      autoFocus
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSkill('tools', newSkillInput);
                        if (e.key === 'Escape') setIsAddingSkill(false);
                      }}
                      placeholder="Tool/Process..."
                      style={{
                        padding: '1px 5px',
                        fontSize: '0.72rem',
                        border: '1px solid #777',
                        borderRadius: '3px',
                        outline: 'none',
                        width: '85px',
                        background: 'transparent',
                        color: textPrimary,
                      }}
                    />
                    <button
                      onClick={() => handleAddSkill('tools', newSkillInput)}
                      style={{ fontSize: '0.7rem', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '3px', padding: '1px 5px' }}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveSkillCategory('tools');
                      setIsAddingSkill(true);
                    }}
                    className="doc-add-skill-pill"
                  >
                    <Plus size={9} /> Add
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 6. EDUCATION ================= */}
        <div id="section-education" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
          <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
                Education
              </span>
            </div>

            <button
              onClick={addEducation}
              className="doc-header-add-btn"
              title="Add Education"
            >
              <Plus size={12} /> Add Education
            </button>
          </div>

          {(!resume.education || resume.education.length === 0) ? (
            <div
              style={{
                padding: '10px',
                border: isDark ? '1px dashed #333' : '1px dashed #E2E8F0',
                borderRadius: '6px',
                textAlign: 'center',
                marginTop: '6px',
              }}
            >
              <p style={{ fontSize: '0.8rem', color: textSecondary, margin: '0 0 6px 0' }}>
                No educational qualifications listed.
              </p>
              <button
                onClick={addEducation}
                style={{
                  padding: '3px 8px',
                  backgroundColor: isDark ? '#2D2D2D' : '#F1F5F9',
                  color: textPrimary,
                  border: isDark ? '1px solid #444' : '1px solid #CBD5E1',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={10} /> Add Degree / Institution
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {resume.education.map((edu: any, eduIdx: number) => (
                <div key={eduIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => handleEduFieldChange(eduIdx, 'degree', e.target.value)}
                      placeholder="Degree (e.g. B.Tech in Mechanical Engineering)"
                      style={{
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        color: textPrimary,
                        border: '1px dashed transparent',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        width: '48%',
                      }}
                      className="doc-editable-input"
                    />
                    <span style={{ color: textSecondary }}>•</span>
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => handleEduFieldChange(eduIdx, 'institution', e.target.value)}
                      placeholder="University / College"
                      style={{
                        fontSize: '0.86rem',
                        color: textPrimary,
                        border: '1px dashed transparent',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        width: '40%',
                      }}
                      className="doc-editable-input"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      value={edu.graduationDate || ''}
                      onChange={(e) => handleEduFieldChange(eduIdx, 'graduationDate', e.target.value)}
                      placeholder="Graduation Year"
                      style={{
                        textAlign: 'right',
                        fontSize: '0.8rem',
                        color: textSecondary,
                        border: '1px dashed transparent',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        width: '75px',
                      }}
                      className="doc-editable-input"
                    />
                    <button
                      onClick={() => deleteEducation(eduIdx)}
                      className="doc-item-delete-btn"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= 7. TECHNICAL CERTIFICATIONS & WORKSHOPS ================= */}
        <div id="section-certifications" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
          <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
              Certifications & Technical Training
            </span>
            <button
              onClick={() => {
                const nextCert = [...(resume.certifications || []), { name: 'AutoCAD Professional – Central Tool Room and Training Centre (CTTC)' }];
                onChange({ ...resume, certifications: nextCert }, 'Added certification');
              }}
              className="doc-header-add-btn"
              title="Add Certification"
            >
              <Plus size={12} /> Add Certification
            </button>
          </div>

          {(!resume.certifications || resume.certifications.length === 0) ? (
            <div
              style={{
                padding: '10px',
                border: isDark ? '1px dashed #333' : '1px dashed #E2E8F0',
                borderRadius: '6px',
                textAlign: 'center',
                marginTop: '6px',
              }}
            >
              <p style={{ fontSize: '0.8rem', color: textSecondary, margin: '0 0 6px 0' }}>
                No professional certifications or specialized workshop credentials added.
              </p>
              <button
                onClick={() => {
                  const nextCert = [{ name: 'AutoCAD Certified – CTTC' }];
                  onChange({ ...resume, certifications: nextCert }, 'Added certification');
                }}
                style={{
                  padding: '3px 8px',
                  backgroundColor: isDark ? '#2D2D2D' : '#F1F5F9',
                  color: textPrimary,
                  border: isDark ? '1px solid #444' : '1px solid #CBD5E1',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={10} /> Add Certification
              </button>
            </div>
          ) : (
            <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyleType: 'disc' }}>
              {resume.certifications.map((item: any, itemIdx: number) => {
                const val = typeof item === 'string' ? item : item.name || '';
                return (
                  <li key={itemIdx} style={{ marginBottom: '4px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const nextCert = [...(resume.certifications || [])];
                          nextCert[itemIdx] = typeof item === 'string' ? e.target.value : { ...item, name: e.target.value };
                          onChange({ ...resume, certifications: nextCert }, 'Updated certification');
                        }}
                        placeholder="Certification Title – Issuing Institution (Date)"
                        style={{
                          flex: 1,
                          fontSize: '0.82rem',
                          color: textPrimary,
                          border: '1px dashed transparent',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'inherit',
                        }}
                        className="doc-editable-input"
                      />
                      <button
                        onClick={() => {
                          const nextCert = (resume.certifications || []).filter((_, i) => i !== itemIdx);
                          onChange({ ...resume, certifications: nextCert }, 'Deleted certification');
                        }}
                        className="doc-item-delete-btn"
                        title="Delete certification"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ================= 8. CO-CURRICULAR & EXTRACURRICULAR ================= */}
        {resume.achievements && resume.achievements.length > 0 && (
          <div id="section-activities" className="doc-section-wrapper" style={{ marginBottom: '16px', position: 'relative' }}>
            <div className="doc-section-header" style={{ borderBottom: `1px solid ${dividerColor}` }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: textPrimary }}>
                Co-Curricular & Extracurricular Leadership
              </span>
              <button
                onClick={() => {
                  const nextAch = [...(resume.achievements || []), 'Junior Red Cross (JRC) Camps – Active Delegate'];
                  onChange({ ...resume, achievements: nextAch }, 'Added activity');
                }}
                className="doc-header-add-btn"
                title="Add Activity"
              >
                <Plus size={12} /> Add Activity
              </button>
            </div>

            <ul style={{ margin: '4px 0 0 16px', padding: 0, listStyleType: 'disc' }}>
              {(resume.achievements || []).map((item: string, itemIdx: number) => (
                <li key={itemIdx} style={{ marginBottom: '4px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const nextAch = [...(resume.achievements || [])];
                        nextAch[itemIdx] = e.target.value;
                        onChange({ ...resume, achievements: nextAch }, 'Updated activity');
                      }}
                      placeholder="Activity Title / Leadership Role"
                      style={{
                        flex: 1,
                        fontSize: '0.82rem',
                        color: textPrimary,
                        border: '1px dashed transparent',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                      }}
                      className="doc-editable-input"
                    />
                    <button
                      onClick={() => {
                        const nextAch = (resume.achievements || []).filter((_, i) => i !== itemIdx);
                        onChange({ ...resume, achievements: nextAch }, 'Deleted activity');
                      }}
                      className="doc-item-delete-btn"
                      title="Delete activity"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ================= BOTTOM: ADD SECTION ================= */}
        <div style={{ marginTop: '20px', textAlign: 'center', position: 'relative' }}>
          <button
            onClick={() => setShowAddSectionMenu(!showAddSectionMenu)}
            style={{
              padding: '5px 12px',
              backgroundColor: isDark ? '#1C1C1C' : '#F3F4F6',
              border: isDark ? '1px solid #333' : '1px solid #D1D5DB',
              borderRadius: '5px',
              fontSize: '0.74rem',
              color: textSecondary,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={11} /> Add Section
          </button>

          {showAddSectionMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
                border: isDark ? '1px solid #333' : '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
                padding: '4px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '2px',
                width: '280px',
                zIndex: 50,
              }}
            >
              {[
                { id: 'summary', label: 'Professional Summary' },
                { id: 'experience', label: 'Work Experience' },
                { id: 'projects', label: 'Projects' },
                { id: 'certifications', label: 'Certifications' },
                { id: 'achievements', label: 'Achievements' },
              ].map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => addSection(sec.id)}
                  style={{
                    padding: '5px 8px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    color: textPrimary,
                    cursor: 'pointer',
                  }}
                  className="doc-add-sec-item"
                >
                  + {sec.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .doc-editable-input {
          transition: border-color 0.15s ease, background-color 0.15s ease;
          border-radius: 3px;
        }
        .doc-editable-input:hover {
          border-color: #94A3B8 !important;
          background-color: rgba(0, 0, 0, 0.02) !important;
        }
        .doc-editable-input:focus {
          border-color: #E31B2B !important;
          background-color: rgba(227, 27, 43, 0.04) !important;
        }
        .doc-section-wrapper {
          position: relative;
        }
        .doc-section-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .doc-header-add-btn {
          background: none;
          border: none;
          color: #10B981;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .doc-section-wrapper:hover .doc-header-add-btn {
          opacity: 1;
        }
        .doc-bullet-item:hover .doc-bullet-hover-toolbar {
          opacity: 1;
        }
        .doc-bullet-hover-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .doc-bullet-hover-toolbar button {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 1px 2px;
        }
        .doc-bullet-hover-toolbar button:hover {
          color: #EF4444;
        }
        .doc-item-delete-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 1px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .doc-role-card:hover .doc-item-delete-btn {
          opacity: 1;
        }
        .doc-item-delete-btn:hover {
          color: #E31B2B;
        }
        .doc-add-inline-btn {
          background: none;
          border: none;
          color: #64748B;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 1px 3px;
        }
        .doc-add-inline-btn:hover {
          color: #E31B2B;
        }
        .doc-skill-tag-light {
          font-size: 0.74rem;
          background-color: #F1F5F9;
          color: #1E293B;
          padding: 1px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          border: 1px solid #E2E8F0;
        }
        .doc-skill-tag-dark {
          font-size: 0.74rem;
          background-color: #1E1E1E;
          color: #E5E7EB;
          padding: 1px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          border: 1px solid #333333;
        }
        .doc-skill-tag-light button, .doc-skill-tag-dark button {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .doc-skill-tag-light button:hover, .doc-skill-tag-dark button:hover {
          color: #EF4444;
        }
        .doc-add-skill-pill {
          background: none;
          border: 1px dashed #94A3B8;
          color: #64748B;
          font-size: 0.7rem;
          border-radius: 3px;
          padding: 0 5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .doc-add-skill-pill:hover {
          border-color: #E31B2B;
          color: #E31B2B;
        }
        .doc-optimized-badge {
          font-size: 0.65rem;
          font-weight: 700;
          color: #10B981;
          background-color: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 1px 5px;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .doc-ai-subtle-sparkle-btn {
          font-size: 0.65rem;
          font-weight: 700;
          color: #E31B2B;
          background-color: rgba(227, 27, 43, 0.08);
          border: 1px solid rgba(227, 27, 43, 0.25);
          padding: 1px 5px;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .doc-ai-subtle-sparkle-btn:hover {
          background-color: #E31B2B;
          color: #FFFFFF;
        }
        .doc-add-sec-item:hover {
          background-color: rgba(227, 27, 43, 0.1) !important;
          color: #E31B2B !important;
        }
      `}</style>
    </div>
  );
};
