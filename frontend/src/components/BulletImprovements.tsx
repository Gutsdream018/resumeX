import React, { useState } from 'react';
import {
  FileCheck2,
  ArrowRight,
  AlertTriangle,
  Check,
  Copy,
  Lightbulb,
} from 'lucide-react';
import { BulletPointImprovement } from '../types';

interface BulletImprovementsProps {
  improvements: BulletPointImprovement[];
}

export const BulletImprovements: React.FC<BulletImprovementsProps> = ({ improvements }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!improvements || improvements.length === 0) {
    return null;
  }

  return (
    <div className="glass-card" style={{ padding: '28px', marginTop: '24px' }}>
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FileCheck2 size={18} color="#ffffff" />
          </div>
          <h3 style={{ fontSize: '1.25rem' }}>Weak Bullet-Point Diagnostics & Natural Revisions</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Rewritten to lead with decisive action verbs and clear impact framing, strictly preserving your genuine background without artificial data.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {improvements.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              position: 'relative',
            }}
          >
            {/* Header / Number */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}>
              <span className="badge badge-warning" style={{ fontSize: '0.74rem' }}>
                Item #{idx + 1} • Polish Opportunity
              </span>
              <button
                onClick={() => handleCopy(item.improved, idx)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                title="Copy recommended revision"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check size={14} color="var(--success)" />
                    <span style={{ color: 'var(--success)' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Revision</span>
                  </>
                )}
              </button>
            </div>

            {/* Original Box */}
            <div style={{
              background: 'rgba(244, 63, 94, 0.04)',
              border: '1px solid rgba(244, 63, 94, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '10px',
            }}>
              <div style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#fb7185',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '4px',
              }}>
                Original Statement
              </div>
              <div style={{ fontSize: '0.9rem', color: '#fecdd3', fontStyle: 'italic' }}>
                "{item.original}"
              </div>
            </div>

            {/* Problem Diagnosis */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '8px 12px',
              marginBottom: '12px',
              fontSize: '0.84rem',
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontWeight: 600 }}>Reviewer Note: </strong>
                <span>{item.problem}</span>
              </div>
            </div>

            {/* Improved Box */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '10px',
            }}>
              <div style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#34d399',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '4px',
              }}>
                Recommended Executive Revision
              </div>
              <div style={{ fontSize: '0.94rem', color: '#ecfdf5', fontWeight: 500, lineHeight: 1.5 }}>
                {item.improved}
              </div>
            </div>

            {/* Why This is Better */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              padding: '4px 8px',
            }}>
              <Lightbulb size={15} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#c7d2fe' }}>Why this revision works better: </strong>
                <span>{item.why_better}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
