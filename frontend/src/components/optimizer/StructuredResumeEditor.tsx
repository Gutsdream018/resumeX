import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  AlertTriangle,
  FileText,
  Briefcase,
  Layers,
  GraduationCap,
  Award,
  Trophy,
} from 'lucide-react';

interface StructuredResumeEditorProps {
  resume: any;
  onChange: (updatedResume: any, changeReason?: string) => void;
  onOpenAiImprove: (bulletText: string, section: string, roleOrContext?: string, bulletId?: string) => void;
  highlightedIssues: Record<string, string>; // e.g. { 'Worked on web app': 'Passive verb' }
}

export const StructuredResumeEditor: React.FC<StructuredResumeEditorProps> = ({
  resume,
  onChange,
  onOpenAiImprove,
  highlightedIssues,
}) => {
  const [editingBulletKey, setEditingBulletKey] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [newSkillText, setNewSkillText] = useState<string>('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<'technical' | 'frameworks' | 'databases' | 'tools'>('technical');

  // Helpers to mutate resume
  const updateContact = (field: string, val: string) => {
    const updated = {
      ...resume,
      contact: {
        ...resume.contact,
        [field]: val,
      },
    };
    onChange(updated, `Updated contact ${field}`);
  };

  const updateSummary = (val: string) => {
    const updated = {
      ...resume,
      summary: val,
    };
    onChange(updated, 'Updated professional summary');
  };

  // Experience Mutations
  const updateExperienceField = (expIndex: number, field: string, val: string) => {
    const newExp = [...(resume.experience || [])];
    newExp[expIndex] = { ...newExp[expIndex], [field]: val };
    onChange({ ...resume, experience: newExp }, `Updated experience ${field}`);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, newText: string) => {
    const newExp = [...(resume.experience || [])];
    const newBullets = [...(newExp[expIndex].bullets || [])];
    newBullets[bulletIndex] = newText;
    newExp[expIndex] = { ...newExp[expIndex], bullets: newBullets };
    onChange({ ...resume, experience: newExp }, 'Edited bullet point');
    setEditingBulletKey(null);
  };

  const deleteBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...(resume.experience || [])];
    const newBullets = (newExp[expIndex].bullets || []).filter((_: any, idx: number) => idx !== bulletIndex);
    newExp[expIndex] = { ...newExp[expIndex], bullets: newBullets };
    onChange({ ...resume, experience: newExp }, 'Deleted bullet point');
  };

  const duplicateBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...(resume.experience || [])];
    const bullets = [...(newExp[expIndex].bullets || [])];
    bullets.splice(bulletIndex + 1, 0, bullets[bulletIndex]);
    newExp[expIndex] = { ...newExp[expIndex], bullets };
    onChange({ ...resume, experience: newExp }, 'Duplicated bullet point');
  };

  const moveBullet = (expIndex: number, bulletIndex: number, direction: 'up' | 'down') => {
    const newExp = [...(resume.experience || [])];
    const bullets = [...(newExp[expIndex].bullets || [])];
    const targetIdx = direction === 'up' ? bulletIndex - 1 : bulletIndex + 1;
    if (targetIdx < 0 || targetIdx >= bullets.length) return;
    const temp = bullets[bulletIndex];
    bullets[bulletIndex] = bullets[targetIdx];
    bullets[targetIdx] = temp;
    newExp[expIndex] = { ...newExp[expIndex], bullets };
    onChange({ ...resume, experience: newExp }, 'Reordered bullet points');
  };

  const addBullet = (expIndex: number) => {
    const newExp = [...(resume.experience || [])];
    const bullets = [...(newExp[expIndex].bullets || []), 'Accomplished [Deliverable], utilizing [Technologies], achieving [Quantifiable Result].'];
    newExp[expIndex] = { ...newExp[expIndex], bullets };
    onChange({ ...resume, experience: newExp }, 'Added new bullet point');
  };

  const addExperienceRole = () => {
    const newExp = [
      ...(resume.experience || []),
      {
        title: 'Senior Software Engineer',
        company: 'Technology Solutions Inc.',
        location: 'City, State',
        startDate: '2023',
        endDate: 'Present',
        bullets: ['Engineered scalable web applications and microservice architectures.'],
        technologies: ['TypeScript', 'React'],
      },
    ];
    onChange({ ...resume, experience: newExp }, 'Added new experience entry');
  };

  // Skills Mutations
  const addSkill = () => {
    if (!newSkillText.trim()) return;
    const skillsObj = { ...(resume.skills || { technical: [], frameworks: [], databases: [], tools: [] }) };
    const list = [...(skillsObj[selectedSkillCategory] || [])];
    if (!list.includes(newSkillText.trim())) {
      list.push(newSkillText.trim());
      skillsObj[selectedSkillCategory] = list;
      onChange({ ...resume, skills: skillsObj }, `Added skill: ${newSkillText.trim()}`);
    }
    setNewSkillText('');
  };

  const removeSkill = (category: string, skill: string) => {
    const skillsObj = { ...(resume.skills || {}) };
    skillsObj[category] = (skillsObj[category] || []).filter((s: string) => s !== skill);
    onChange({ ...resume, skills: skillsObj }, `Removed skill: ${skill}`);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 1. Candidate Contact Section */}
      <div
        id="section-contact"
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
              Full Candidate Name
            </label>
            <input
              type="text"
              value={resume.contact?.name || ''}
              onChange={(e) => updateContact('name', e.target.value)}
              placeholder="e.g. Alex Rivera"
              style={{
                width: '100%',
                background: '#141414',
                border: '1px solid #282828',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                fontWeight: 800,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
              Target Engineering Title
            </label>
            <input
              type="text"
              value={resume.contact?.title || ''}
              onChange={(e) => updateContact('title', e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer"
              style={{
                width: '100%',
                background: '#141414',
                border: '1px solid #282828',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.68rem', color: '#737373', display: 'block', marginBottom: '2px' }}>Email</label>
            <input
              type="email"
              value={resume.contact?.email || ''}
              onChange={(e) => updateContact('email', e.target.value)}
              placeholder="email@domain.com"
              style={{ width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#D4D4D4', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.68rem', color: '#737373', display: 'block', marginBottom: '2px' }}>Phone</label>
            <input
              type="text"
              value={resume.contact?.phone || ''}
              onChange={(e) => updateContact('phone', e.target.value)}
              placeholder="(555) 000-0000"
              style={{ width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#D4D4D4', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.68rem', color: '#737373', display: 'block', marginBottom: '2px' }}>Location</label>
            <input
              type="text"
              value={resume.contact?.location || ''}
              onChange={(e) => updateContact('location', e.target.value)}
              placeholder="San Francisco, CA"
              style={{ width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#D4D4D4', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.68rem', color: '#737373', display: 'block', marginBottom: '2px' }}>LinkedIn / GitHub</label>
            <input
              type="text"
              value={resume.contact?.linkedin || resume.contact?.github || ''}
              onChange={(e) => updateContact('linkedin', e.target.value)}
              placeholder="linkedin.com/in/alex"
              style={{ width: '100%', background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#D4D4D4', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Summary Section */}
      <div
        id="section-summary"
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#E31B2B" />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Professional Summary
            </h4>
          </div>
          <button
            onClick={() => onOpenAiImprove(resume.summary || '', 'summary', 'Professional Summary')}
            className="btn btn-ghost-red"
            style={{ fontSize: '0.76rem', padding: '3px 10px' }}
          >
            <Sparkles size={12} />
            <span>Optimize Summary</span>
          </button>
        </div>

        <textarea
          value={resume.summary || ''}
          onChange={(e) => updateSummary(e.target.value)}
          rows={3}
          placeholder="Concise 2-3 sentence overview highlighting core technical expertise, target role, and engineering deliverables..."
          style={{
            width: '100%',
            background: '#141414',
            border: '1px solid #282828',
            borderRadius: '8px',
            padding: '12px',
            color: '#F0F0F0',
            fontSize: '0.86rem',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>

      {/* 3. Professional Experience Section */}
      <div
        id="section-experience"
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={16} color="#E31B2B" />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Work Experience
            </h4>
          </div>
          <button
            onClick={addExperienceRole}
            className="btn btn-secondary-dark"
            style={{ fontSize: '0.76rem', padding: '4px 12px' }}
          >
            <Plus size={13} />
            <span>Add Role</span>
          </button>
        </div>

        {/* Experience Roles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(resume.experience || []).map((exp: any, expIdx: number) => {
            const roleContext = `${exp.title || 'Role'} • ${exp.company || 'Company'}`;
            return (
              <div
                key={expIdx}
                style={{
                  background: '#121212',
                  border: '1px solid #222222',
                  borderRadius: '10px',
                  padding: '18px',
                }}
              >
                {/* Role Header Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 120px 120px', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    value={exp.title || ''}
                    onChange={(e) => updateExperienceField(expIdx, 'title', e.target.value)}
                    placeholder="Role Title"
                    style={{ background: '#181818', border: '1px solid #2C2C2C', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '0.86rem', fontWeight: 700, outline: 'none' }}
                  />
                  <input
                    type="text"
                    value={exp.company || ''}
                    onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                    placeholder="Organization / Company"
                    style={{ background: '#181818', border: '1px solid #2C2C2C', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '0.86rem', outline: 'none' }}
                  />
                  <input
                    type="text"
                    value={exp.startDate || ''}
                    onChange={(e) => updateExperienceField(expIdx, 'startDate', e.target.value)}
                    placeholder="Start (e.g. 2022)"
                    style={{ background: '#181818', border: '1px solid #2C2C2C', borderRadius: '6px', padding: '7px 10px', color: '#A3A3A3', fontSize: '0.8rem', outline: 'none' }}
                  />
                  <input
                    type="text"
                    value={exp.endDate || ''}
                    onChange={(e) => updateExperienceField(expIdx, 'endDate', e.target.value)}
                    placeholder="End (e.g. Present)"
                    style={{ background: '#181818', border: '1px solid #2C2C2C', borderRadius: '6px', padding: '7px 10px', color: '#A3A3A3', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                {/* Bullets List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(exp.bullets || []).map((bullet: string, bIdx: number) => {
                    const bulletKey = `${expIdx}-${bIdx}`;
                    const isEditingThis = editingBulletKey === bulletKey;
                    const issueNotice = highlightedIssues[bullet.trim()];

                    return (
                      <div
                        key={bIdx}
                        style={{
                          background: '#161616',
                          border: issueNotice ? '1px dashed rgba(227, 27, 43, 0.45)' : '1px solid #262626',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isEditingThis ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={2}
                              style={{
                                width: '100%',
                                background: '#0D0D0D',
                                border: '1px solid #E31B2B',
                                borderRadius: '6px',
                                padding: '8px',
                                color: '#FFFFFF',
                                fontSize: '0.84rem',
                                outline: 'none',
                                resize: 'vertical',
                              }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => updateBullet(expIdx, bIdx, editingText)}
                                className="btn btn-red"
                                style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                              >
                                <Check size={12} />
                                <span>Save Changes</span>
                              </button>
                              <button
                                onClick={() => setEditingBulletKey(null)}
                                className="btn btn-secondary-dark"
                                style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              {issueNotice && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(227, 27, 43, 0.12)', border: '1px solid rgba(227, 27, 43, 0.3)', color: '#FF99A1', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', marginBottom: '4px' }}>
                                  <AlertTriangle size={10} />
                                  <span>{issueNotice}</span>
                                </div>
                              )}
                              <p style={{ margin: 0, color: '#E0E0E0', fontSize: '0.84rem', lineHeight: 1.45 }}>
                                • {bullet}
                              </p>
                            </div>

                            {/* Bullet Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <button
                                onClick={() => onOpenAiImprove(bullet, 'experience', roleContext, bulletKey)}
                                title="AI Optimize (Add Missing Facts)"
                                className="btn btn-ghost-red"
                                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              >
                                <Sparkles size={13} />
                                <span>AI Improve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingBulletKey(bulletKey);
                                  setEditingText(bullet);
                                }}
                                title="Edit manually"
                                style={{ background: 'transparent', border: 'none', color: '#888888', padding: '4px', cursor: 'pointer' }}
                              >
                                <Edit3 size={13} />
                              </button>

                              <button
                                onClick={() => moveBullet(expIdx, bIdx, 'up')}
                                title="Move up"
                                style={{ background: 'transparent', border: 'none', color: '#888888', padding: '4px', cursor: 'pointer' }}
                              >
                                <ArrowUp size={13} />
                              </button>

                              <button
                                onClick={() => moveBullet(expIdx, bIdx, 'down')}
                                title="Move down"
                                style={{ background: 'transparent', border: 'none', color: '#888888', padding: '4px', cursor: 'pointer' }}
                              >
                                <ArrowDown size={13} />
                              </button>

                              <button
                                onClick={() => duplicateBullet(expIdx, bIdx)}
                                title="Duplicate"
                                style={{ background: 'transparent', border: 'none', color: '#888888', padding: '4px', cursor: 'pointer' }}
                              >
                                <Copy size={13} />
                              </button>

                              <button
                                onClick={() => deleteBullet(expIdx, bIdx)}
                                title="Delete"
                                style={{ background: 'transparent', border: 'none', color: '#E31B2B', padding: '4px', cursor: 'pointer' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => addBullet(expIdx)}
                  className="btn btn-secondary-dark"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', marginTop: '10px' }}
                >
                  <Plus size={12} />
                  <span>Add Bullet</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Technical Skills Section */}
      <div
        id="section-skills"
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={16} color="#E31B2B" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Technical Skills Matrix
          </h4>
        </div>

        {/* Add Skill Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select
            value={selectedSkillCategory}
            onChange={(e: any) => setSelectedSkillCategory(e.target.value)}
            style={{ background: '#141414', border: '1px solid #282828', borderRadius: '6px', color: '#FFFFFF', padding: '6px 10px', fontSize: '0.8rem', outline: 'none' }}
          >
            <option value="technical">Languages & Core</option>
            <option value="frameworks">Frameworks / Libraries</option>
            <option value="databases">Databases & Storage</option>
            <option value="tools">DevOps & Cloud Tools</option>
          </select>
          <input
            type="text"
            value={newSkillText}
            onChange={(e) => setNewSkillText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            placeholder="Type verified skill (e.g. React, PostgreSQL, Docker)..."
            style={{ flex: 1, background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '6px 12px', color: '#FFFFFF', fontSize: '0.82rem', outline: 'none' }}
          />
          <button
            onClick={addSkill}
            className="btn btn-red"
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <Plus size={13} />
            <span>Add Skill</span>
          </button>
        </div>

        {/* Categorized Skills Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(['technical', 'frameworks', 'databases', 'tools'] as const).map((catKey) => {
            const list = resume.skills?.[catKey] || [];
            if (list.length === 0 && catKey !== 'technical') return null;
            const categoryLabels: Record<string, string> = {
              technical: 'Languages & Core',
              frameworks: 'Frameworks',
              databases: 'Databases',
              tools: 'Tools & Cloud',
            };

            return (
              <div key={catKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: '#737373', minWidth: '110px' }}>
                  {categoryLabels[catKey]}:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {list.map((skill: string, sIdx: number) => (
                    <span
                      key={sIdx}
                      style={{
                        background: '#1A1A1A',
                        border: '1px solid #2E2E2E',
                        color: '#F0F0F0',
                        fontSize: '0.78rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(catKey, skill)}
                        style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', padding: 0, fontSize: '0.74rem' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Education Section */}
      <div
        id="section-education"
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <GraduationCap size={16} color="#E31B2B" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Education
          </h4>
        </div>

        {(resume.education || []).map((edu: any, eduIdx: number) => (
          <div key={eduIdx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 100px', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={edu.degree || ''}
              onChange={(e) => {
                const newEdu = [...resume.education];
                newEdu[eduIdx] = { ...newEdu[eduIdx], degree: e.target.value };
                onChange({ ...resume, education: newEdu }, 'Updated degree');
              }}
              placeholder="Degree (e.g. B.S. in Computer Science)"
              style={{ background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '0.84rem', outline: 'none' }}
            />
            <input
              type="text"
              value={edu.institution || ''}
              onChange={(e) => {
                const newEdu = [...resume.education];
                newEdu[eduIdx] = { ...newEdu[eduIdx], institution: e.target.value };
                onChange({ ...resume, education: newEdu }, 'Updated institution');
              }}
              placeholder="University / College"
              style={{ background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '0.84rem', outline: 'none' }}
            />
            <input
              type="text"
              value={edu.graduationDate || ''}
              onChange={(e) => {
                const newEdu = [...resume.education];
                newEdu[eduIdx] = { ...newEdu[eduIdx], graduationDate: e.target.value };
                onChange({ ...resume, education: newEdu }, 'Updated graduation date');
              }}
              placeholder="Year (e.g. 2021)"
              style={{ background: '#141414', border: '1px solid #282828', borderRadius: '6px', padding: '7px 10px', color: '#A3A3A3', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
