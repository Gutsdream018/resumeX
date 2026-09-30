import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';

import { ExportQualityReport } from '../../types';

interface ResumeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: any;
  overallScore: number;
  qualityReport?: ExportQualityReport;
}

export const ResumeExportModal: React.FC<ResumeExportModalProps> = ({
  isOpen,
  onClose,
  resume,
  overallScore,
  qualityReport,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatePlainTextResume = () => {
    const lines: string[] = [];

    // Name & Contact
    lines.push((resume.contact?.name || 'CANDIDATE NAME').toUpperCase());
    const contactParts = [
      resume.contact?.location,
      resume.contact?.email,
      resume.contact?.phone,
      resume.contact?.linkedin,
      resume.contact?.github,
    ].filter(Boolean);
    if (contactParts.length > 0) lines.push(contactParts.join(' | '));

    // Summary
    if (resume.summary) {
      lines.push('\nPROFESSIONAL SUMMARY');
      lines.push(resume.summary);
    }

    // Skills
    const allSkills = [
      ...(resume.skills?.technical || []),
      ...(resume.skills?.frameworks || []),
      ...(resume.skills?.databases || []),
      ...(resume.skills?.tools || []),
    ];
    if (allSkills.length > 0) {
      lines.push('\nTECHNICAL SKILLS');
      lines.push(allSkills.join(', '));
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
      lines.push('\nPROFESSIONAL EXPERIENCE');
      for (const exp of resume.experience) {
        lines.push(`${exp.title || 'Role'} - ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || ''})`);
        for (const bullet of exp.bullets || []) {
          lines.push(`• ${bullet}`);
        }
      }
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
      lines.push('\nPROJECTS');
      for (const proj of resume.projects) {
        const tech = proj.technologies?.length ? ` | ${proj.technologies.join(', ')}` : '';
        lines.push(`${proj.name || 'Project'}${tech}`);
        for (const bullet of proj.bullets || []) {
          lines.push(`• ${bullet}`);
        }
      }
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      lines.push('\nEDUCATION');
      for (const edu of resume.education) {
        lines.push(`${edu.degree || 'Degree'} - ${edu.institution || 'University'} (${edu.graduationDate || ''})`);
      }
    }

    return lines.join('\n');
  };

  const handleCopyText = () => {
    const text = generatePlainTextResume();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const plainText = generatePlainTextResume();
  const hasUnresolvedPlaceholders = /\[X%\]|\[N users\]|\[metric:|\b\[Insert\b/i.test(plainText);

  return (
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
      onClick={onClose}
    >
      <div
        className="card-dark"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          background: '#111111',
          border: '1px solid #242424',
          borderRadius: '16px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10B981" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Export ATS-Optimized Resume
              </h3>
            </div>
            <p style={{ color: '#888888', fontSize: '0.8rem', margin: '2px 0 0' }}>
              Deterministic single-column text layout formatted for Workday, Greenhouse, and Lever parsers.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        {/* Amber Placeholders Warning if [X%] present */}
        {hasUnresolvedPlaceholders && (
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: '1' }}>⚠️</span>
            <div style={{ fontSize: '0.76rem', color: '#F59E0B', lineHeight: '1.4' }}>
              <strong>Export Blocked: Unresolved Placeholders Detected</strong>
              <div>
                Your resume contains metric placeholders such as <code style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>[X%]</code> or <code style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>[N users]</code>. Please fill in your authentic measurements or remove the placeholders in the document before exporting.
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Box */}
        <div
          style={{
            flex: 1,
            background: '#0B0B0B',
            border: '1px solid #222222',
            borderRadius: '10px',
            padding: '18px',
            overflowY: 'auto',
            maxHeight: '360px',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            color: '#E0E0E0',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            marginBottom: '18px',
          }}
        >
          {plainText}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
            <CheckCircle2 size={14} />
            <span>ATS Readability Score: {overallScore}/100</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopyText}
              className="btn btn-secondary-dark"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Text!' : 'Copy Formatted Text'}</span>
            </button>

            <button
              onClick={hasUnresolvedPlaceholders ? undefined : handlePrint}
              disabled={hasUnresolvedPlaceholders}
              className="btn btn-red"
              title={hasUnresolvedPlaceholders ? 'Resolve [X%] placeholders to enable PDF export' : 'Print / Save as PDF'}
              style={{
                fontSize: '0.82rem',
                padding: '8px 18px',
                fontWeight: 700,
                opacity: hasUnresolvedPlaceholders ? 0.45 : 1,
                cursor: hasUnresolvedPlaceholders ? 'not-allowed' : 'pointer',
              }}
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
