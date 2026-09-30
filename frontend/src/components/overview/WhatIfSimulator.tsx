import React, { useState, useMemo } from 'react';
import { Sliders, Sparkles, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';
import { getScoreBand } from '../../config/scoreCategories';

interface WhatIfSimulatorProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: string, meta?: any) => void;
}

interface FixToggleItem {
  id: string;
  title: string;
  category: string;
  gain: number;
  active: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const rawAny = analysis as any;
  const baseScore = Math.max(0, Math.min(100, Math.round(analysis.overall_score || 75)));

  const initialFixes: FixToggleItem[] = useMemo(() => {
    const priorityIssues = analysis.diagnostic?.priorityIssues || rawAny.issues || [];
    const bulletImprovements = analysis.bullet_point_improvements || [];

    const items: FixToggleItem[] = [];

    if (priorityIssues.length > 0) {
      priorityIssues.slice(0, 5).forEach((issue: any, idx: number) => {
        const gain = issue.scoreImpact?.estimatedDeficit || (issue.severity === 'critical' ? 5 : 3);
        items.push({
          id: issue.id || `issue-${idx}`,
          title: issue.title || issue.reason || `Fix ${issue.section || 'Issue'}`,
          category: issue.section || issue.scoreImpact?.category || 'General',
          gain: Math.min(gain, 6),
          active: false,
        });
      });
    }

    if (items.length < 4 && bulletImprovements.length > 0) {
      bulletImprovements.slice(0, 4 - items.length).forEach((b: any, idx: number) => {
        items.push({
          id: `bp-${idx}`,
          title: b.problem || 'Quantify metric deliverables in bullets',
          category: 'Experience Quality',
          gain: 4,
          active: false,
        });
      });
    }

    if (items.length === 0) {
      items.push(
        { id: 'f1', title: 'Inject ATS Keywords & Modern Tool Taxonomy', category: 'Technical Skills', gain: 5, active: false },
        { id: 'f2', title: 'Rewrite passive bullets with Google XYZ formula', category: 'Experience Quality', gain: 4, active: false },
        { id: 'f3', title: 'Standardize single-column linear layout', category: 'ATS Readability', gain: 3, active: false }
      );
    }

    return items;
  }, [analysis]);

  const [toggles, setToggles] = useState<FixToggleItem[]>(initialFixes);

  // Compute projected score live
  const activeGain = useMemo(() => {
    return toggles.filter((t) => t.active).reduce((sum, t) => sum + t.gain, 0);
  }, [toggles]);

  const projectedScore = Math.min(98, baseScore + activeGain);
  const baseBand = getScoreBand(baseScore);
  const projectedBand = getScoreBand(projectedScore);

  const handleToggle = (id: string) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const handleReset = () => {
    setToggles((prev) => prev.map((t) => ({ ...t, active: false })));
  };

  const handleSelectAll = () => {
    setToggles((prev) => prev.map((t) => ({ ...t, active: true })));
  };

  return (
    <div
      className="card-dark"
      style={{
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0E0E0E',
        padding: '16px 20px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D0D0D0',
              flexShrink: 0,
            }}
          >
            <Sliders size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                What-If Score Simulator
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Interactive Projection
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#888888', margin: 0 }}>
              Toggle prospective upgrades on and off to simulate your calibrated score impact in real-time.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px',
              backgroundColor: '#161616',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              padding: '6px 12px',
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#888888' }}>
              Current: <strong style={{ color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{baseScore}</strong>
            </span>
            <span style={{ color: '#555555' }}>&rarr;</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: projectedBand.color }}>
              Projected: <strong style={{ fontSize: '0.86rem', fontVariantNumeric: 'tabular-nums' }}>{projectedScore}</strong>
            </span>
            {activeGain > 0 && (
              <span
                style={{
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '1px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#10B981',
                }}
              >
                +{activeGain}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#CCCCCC',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            {isOpen ? 'Collapse' : 'Simulate Fixes \u2192'}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Toggles Tray */}
      {isOpen && (
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#888888' }}>
            <span>Select fixes to test hypothetical score elevation:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ background: 'transparent', border: 'none', color: '#A0A0A0', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.74rem' }}
              >
                Select All
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={handleReset}
                style={{ background: 'transparent', border: 'none', color: '#A0A0A0', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.74rem' }}
              >
                Reset
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
            {toggles.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: item.active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: item.active ? 'rgba(16, 185, 129, 0.1)' : '#141414',
                  color: item.active ? '#FFFFFF' : '#B0B0B0',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'hidden' }}>
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={() => handleToggle(item.id)}
                    style={{ accentColor: '#10B981', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.76rem', fontWeight: item.active ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: item.active ? '#10B981' : '#222222',
                    color: item.active ? '#000000' : '#888888',
                    fontVariantNumeric: 'tabular-nums',
                    marginLeft: '8px',
                    flexShrink: 0,
                  }}
                >
                  +{item.gain} pts
                </span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.76rem', color: '#888888' }}>
              Target Band: <strong style={{ color: projectedBand.color }}>{projectedBand.label}</strong>
            </span>

            <button
              type="button"
              onClick={() => onNavigateTab('optimizer')}
              className="btn btn-red"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <span>Apply in Resume Optimizer</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
