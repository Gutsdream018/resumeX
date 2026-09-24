import React from 'react';
import { Award, Zap, ShieldCheck } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  grade: string;
  analysisMode?: 'ai_live' | 'heuristic_engine';
  wordCount?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  grade,
  analysisMode = 'heuristic_engine',
  wordCount,
}) => {
  // SVG circular gauge geometry
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 80) return '#10b981'; // emerald
    if (val >= 65) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  const getScoreBadgeClass = (val: number) => {
    if (val >= 80) return 'badge-success';
    if (val >= 65) return 'badge-warning';
    return 'badge-danger';
  };

  const scoreColor = getScoreColor(score);

  return (
    <div
      className="glass-card"
      style={{
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '180px',
        height: '180px',
        background: `radial-gradient(circle, ${scoreColor}22 0%, transparent 70%)`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: 'var(--text-subtle)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          Overall Resume Score
        </div>

        {/* Circular Gauge */}
        <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 18px' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Track Circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Animated Dynamic Progress Circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={scoreColor}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
              }}
            />
          </svg>

          {/* Centered Score Number */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              fontFamily: 'Plus Jakarta Sans',
              lineHeight: 1,
              color: '#ffffff',
            }}>
              {score}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              out of 100
            </div>
          </div>
        </div>

        {/* Score Grade Badge */}
        <div style={{ marginBottom: '14px' }}>
          <span className={`badge ${getScoreBadgeClass(score)}`} style={{ fontSize: '0.84rem', padding: '6px 14px' }}>
            <Award size={14} />
            <span>{grade}</span>
          </span>
        </div>

        {/* Metadata Details */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '0.78rem',
          color: 'var(--text-subtle)',
          marginTop: '6px',
        }}>
          {wordCount !== undefined && <span>{wordCount} words evaluated</span>}
          <span>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} color="var(--primary)" />
            <span>Executive Recruiter Audit</span>
          </span>
        </div>
      </div>
    </div>
  );
};
