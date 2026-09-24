import React from 'react';
import {
  Sparkles,
  RotateCcw,
  RotateCw,
  Eye,
  Download,
  CheckCircle2,
  TrendingUp,
  FileText,
  Layers,
} from 'lucide-react';

export type OptimizationMode =
  | 'general'
  | 'technical'
  | 'engineering'
  | 'software'
  | 'student'
  | 'job_match';

interface OptimizerHeaderProps {
  documentName: string;
  baselineScore: number;
  currentScore: number;
  optimizationProgress: number;
  mode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isCompareMode: boolean;
  onToggleCompare: () => void;
  onOpenExport: () => void;
  isRescoring: boolean;
}

export const OptimizerHeader: React.FC<OptimizerHeaderProps> = ({
  documentName,
  baselineScore,
  currentScore,
  optimizationProgress,
  mode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isCompareMode,
  onToggleCompare,
  onOpenExport,
  isRescoring,
}) => {
  const scoreDelta = currentScore - baselineScore;

  return (
    <div
      style={{
        background: '#0D0D0D',
        border: '1px solid #242424',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Top Line: Title, Mode Selector, Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(227, 27, 43, 0.15)',
              border: '1px solid rgba(227, 27, 43, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="#E31B2B" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                AI Resume Optimizer
              </h2>
              <span className="badge badge-red" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                WORKSPACE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#888888', marginTop: '2px' }}>
              <FileText size={12} color="#737373" />
              <span>{documentName || 'candidate_resume.pdf'}</span>
              <span>•</span>
              <span style={{ color: isRescoring ? '#F59E0B' : '#10B981' }}>
                {isRescoring ? 'Recalculating ATS Score...' : 'Continuous Audit Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Optimization Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#141414', padding: '4px 10px', borderRadius: '8px', border: '1px solid #282828' }}>
            <Layers size={14} color="#E31B2B" />
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as OptimizationMode)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="general" style={{ background: '#141414' }}>Mode: General ATS</option>
              <option value="software" style={{ background: '#141414' }}>Mode: Software / Web</option>
              <option value="engineering" style={{ background: '#141414' }}>Mode: Engineering Core</option>
              <option value="technical" style={{ background: '#141414' }}>Mode: Technical Specialist</option>
              <option value="student" style={{ background: '#141414' }}>Mode: Student / Graduate</option>
              <option value="job_match" style={{ background: '#141414' }}>Mode: Target Job Match</option>
            </select>
          </div>

          {/* Undo / Redo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#141414', padding: '3px', borderRadius: '8px', border: '1px solid #282828' }}>
            <button
              disabled={!canUndo}
              onClick={onUndo}
              title="Undo Revision"
              style={{
                background: 'transparent',
                border: 'none',
                color: canUndo ? '#FFFFFF' : '#444444',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RotateCcw size={14} />
            </button>
            <button
              disabled={!canRedo}
              onClick={onRedo}
              title="Redo Revision"
              style={{
                background: 'transparent',
                border: 'none',
                color: canRedo ? '#FFFFFF' : '#444444',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RotateCw size={14} />
            </button>
          </div>

          {/* Compare View Toggle */}
          <button
            onClick={onToggleCompare}
            className={isCompareMode ? 'btn btn-red' : 'btn btn-secondary-dark'}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <Eye size={14} />
            <span>{isCompareMode ? 'Editor View' : 'Compare Diff'}</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            className="btn btn-red"
            style={{ fontSize: '0.82rem', padding: '7px 16px', fontWeight: 700 }}
          >
            <Download size={14} />
            <span>Export Resume</span>
          </button>
        </div>
      </div>

      {/* Bottom Line: Workflow Steps + Live Score Telemetry */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid #1E1E1E',
          paddingTop: '12px',
        }}
      >
        {/* Step Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 700 }}>
            <CheckCircle2 size={13} />
            <span>1. Analyzed</span>
          </div>
          <span style={{ color: '#333333' }}>→</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E31B2B', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E31B2B' }} />
            <span>2. Optimizing</span>
          </div>
          <span style={{ color: '#333333' }}>→</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888888' }}>
            <span>3. Re-Scored</span>
          </div>
          <span style={{ color: '#333333' }}>→</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888888' }}>
            <span>4. Export Ready</span>
          </div>
        </div>

        {/* Live Score Counter Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#888888' }}>
            <span>Baseline ATS:</span>
            <strong style={{ color: '#FFFFFF', fontSize: '0.92rem' }}>{baselineScore}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#888888' }}>
            <span>Optimized:</span>
            <strong style={{ color: currentScore >= 70 ? '#10B981' : '#F59E0B', fontSize: '1.05rem', fontWeight: 900 }}>
              {currentScore}
            </strong>
          </div>

          {scoreDelta > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10B981',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              <TrendingUp size={11} /> +{scoreDelta} pts
            </span>
          )}

          {/* Optimization Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: '#737373' }}>Progress: {optimizationProgress}%</span>
            <div style={{ width: '60px', height: '6px', background: '#1A1A1A', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${optimizationProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #E31B2B, #10B981)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
