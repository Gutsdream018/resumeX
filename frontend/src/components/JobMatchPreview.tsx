import React from 'react';
import { Target, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const JobMatchPreview: React.FC = () => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '28px',
        marginTop: '24px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 27, 75, 0.4) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top-right badge */}
      <div style={{ position: 'absolute', top: '16px', right: '20px' }}>
        <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>
          Architecture Ready • Feature Preview
        </span>
      </div>

      <div style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Target size={20} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>Job Description Matching (Coming Next)</h3>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
          Our backend is already architected to ingest target Job Descriptions. Once activated, you'll be able to
          compare your uploaded resume against any job posting for:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            color: '#e2e8f0',
          }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span>Target Job Match Score (0–100%)</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            color: '#e2e8f0',
          }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span>Matching & Overlapping Skills</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            color: '#e2e8f0',
          }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span>Missing Keywords & ATS Gaps</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            color: '#e2e8f0',
          }}>
            <CheckCircle2 size={16} color="var(--primary)" />
            <span>Tailored Experience Highlights</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: '0.82rem',
          color: 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span>Endpoint <code>/api/job-match/match</code> is structurally wired and prepared for rollout.</span>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>v1.1 Roadmap Ready</span>
        </div>
      </div>
    </div>
  );
};
