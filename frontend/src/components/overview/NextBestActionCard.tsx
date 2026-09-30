import React, { useMemo } from 'react';
import { Sparkles, ArrowRight, TrendingUp, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface NextBestActionCardProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: string, meta?: any) => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const rawAny = analysis as any;
  const priorityIssues = analysis.diagnostic?.priorityIssues || rawAny.issues || [];
  const bulletImprovements = analysis.bullet_point_improvements || [];

  const bestAction = useMemo(() => {
    // 1. Highest impact priority issue
    if (priorityIssues.length > 0) {
      const top = [...priorityIssues].sort((a: any, b: any) => {
        const defB = b.scoreImpact?.estimatedDeficit || (b.severity === 'critical' ? 5 : 3);
        const defA = a.scoreImpact?.estimatedDeficit || (a.severity === 'critical' ? 5 : 3);
        return defB - defA;
      })[0];

      const gain = top.scoreImpact?.estimatedDeficit || (top.severity === 'critical' ? 6 : 4);
      return {
        id: top.id,
        title: top.title,
        gain,
        category: top.section || top.scoreImpact?.category || 'Work Experience',
        description: top.recommendation || top.reason || 'Quantify accomplishments with metric deliverables using the Google XYZ formula.',
        severity: top.severity || 'critical',
        actionLabel: 'Fix in Resume Optimizer',
      };
    }

    // 2. First bullet improvement
    if (bulletImprovements.length > 0) {
      const topBullet = bulletImprovements[0];
      return {
        id: 'bp-0',
        title: topBullet.problem || 'Quantify achievements with business scale',
        gain: 5,
        category: 'Experience Quality',
        description: topBullet.why_better || `Upgrade: "${topBullet.improved}"`,
        severity: 'critical' as const,
        actionLabel: 'Apply 1-Click Upgrade',
      };
    }

    return null;
  }, [priorityIssues, bulletImprovements]);

  if (!bestAction) return null;

  return (
    <div
      className="card-dark"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '14px',
        border: '1px solid rgba(229, 9, 32, 0.28)',
        backgroundColor: '#0F0F0F',
        padding: '16px 20px',
        boxShadow: '0 8px 24px rgba(229, 9, 32, 0.08)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(229, 9, 32, 0.12)',
              border: '1px solid rgba(229, 9, 32, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E50920',
              flexShrink: 0,
            }}
          >
            <Zap size={18} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E50920' }}>
                Highest-Impact Next Step
              </span>
              <span
                style={{
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#10B981',
                }}
              >
                +{bestAction.gain} pts gain
              </span>
              <span style={{ fontSize: '0.72rem', color: '#777777', fontWeight: 500 }}>
                &bull; {bestAction.category}
              </span>
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px 0' }}>
              {bestAction.title}
            </h4>

            <p style={{ fontSize: '0.78rem', color: '#9E9E9E', margin: 0, maxWidth: '640px', lineHeight: 1.45 }}>
              {bestAction.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('optimizer', { issueId: bestAction.id })}
          className="btn btn-red"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(229, 9, 32, 0.35)',
            cursor: 'pointer',
          }}
        >
          <span>{bestAction.actionLabel}</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
