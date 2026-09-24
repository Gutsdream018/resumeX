import React from 'react';
import {
  Undo2,
  Redo2,
  Sparkles,
  CheckCircle2,
  Download,
  Save,
  History,
  ShieldCheck,
  Loader2,
  Lamp,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';

export type ResumeTemplatePreset =
  | 'ats_classic'
  | 'modern_pro'
  | 'minimal'
  | 'technical'
  | 'engineering'
  | 'student';

export type DocumentTheme = 'light' | 'dark';

interface FullPageOptimizerHeaderProps {
  baselineScore: number;
  currentScore: number;
  contentScore: number;
  readabilityScore: number;
  jobMatchScore?: number;
  hasUnsavedChanges: boolean;
  isAnalyzing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  docTheme: DocumentTheme;
  templatePreset: ResumeTemplatePreset;
  pendingImprovementsCount: number;
  isDrawerOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDocThemeChange: (theme: DocumentTheme) => void;
  onTemplateChange: (template: ResumeTemplatePreset) => void;
  onAnalyzeChanges: () => void;
  onSave: () => void;
  onOpenHistory: () => void;
  onOpenAtsCheck: () => void;
  onToggleDrawer: () => void;
  onOpenExportModal: () => void;
}

export const FullPageOptimizerHeader: React.FC<FullPageOptimizerHeaderProps> = ({
  baselineScore,
  currentScore,
  contentScore,
  readabilityScore,
  jobMatchScore,
  hasUnsavedChanges,
  isAnalyzing,
  canUndo,
  canRedo,
  docTheme,
  templatePreset,
  pendingImprovementsCount,
  isDrawerOpen,
  onUndo,
  onRedo,
  onDocThemeChange,
  onTemplateChange,
  onAnalyzeChanges,
  onSave,
  onOpenHistory,
  onOpenAtsCheck,
  onToggleDrawer,
  onOpenExportModal,
}) => {
  const scoreDelta = currentScore - baselineScore;

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#0D0D0D',
        borderBottom: '1px solid #222222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 1. Left section: Branding + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '5px',
              backgroundColor: '#E31B2B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.85rem',
              color: '#FFFFFF',
              boxShadow: '0 0 10px rgba(227, 27, 43, 0.4)',
            }}
          >
            R
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                ResumeX
              </span>
              <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>
                / Resume Optimizer
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
              {hasUnsavedChanges ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', color: '#F59E0B' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                  Unsaved edits
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', color: '#10B981' }}>
                  <CheckCircle2 size={10} color="#10B981" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Center section: Compact Score Cards */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="header-score-cards">
        {/* Main ATS Score Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#141414',
            padding: '4px 11px',
            borderRadius: '6px',
            border: '1px solid #262626',
          }}
        >
          <span style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>
            ATS SCORE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {scoreDelta !== 0 ? (
              <>
                <span style={{ fontSize: '0.8rem', color: '#888', textDecoration: 'line-through' }}>
                  {baselineScore}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#666' }}>→</span>
                <span
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    color: currentScore >= 75 ? '#10B981' : currentScore >= 60 ? '#F59E0B' : '#E31B2B',
                  }}
                >
                  {currentScore}
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  +{scoreDelta}
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    color: currentScore >= 75 ? '#10B981' : currentScore >= 60 ? '#F59E0B' : '#E31B2B',
                  }}
                >
                  {currentScore}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#666' }}>/100</span>
              </>
            )}
          </div>
        </div>

        {/* Content Score */}
        <div
          style={{
            padding: '3px 8px',
            borderRadius: '5px',
            backgroundColor: '#141414',
            border: '1px solid #222222',
            fontSize: '0.7rem',
            color: '#AAA',
          }}
        >
          <span style={{ color: '#777' }}>CONTENT: </span>
          <strong style={{ color: '#FFF' }}>{contentScore}</strong>
        </div>

        {/* Readability Score */}
        <div
          style={{
            padding: '3px 8px',
            borderRadius: '5px',
            backgroundColor: '#141414',
            border: '1px solid #222222',
            fontSize: '0.7rem',
            color: '#AAA',
          }}
        >
          <span style={{ color: '#777' }}>READABILITY: </span>
          <strong style={{ color: '#FFF' }}>{readabilityScore}</strong>
        </div>

        {jobMatchScore !== undefined && (
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              backgroundColor: '#141414',
              border: '1px solid #222222',
              fontSize: '0.7rem',
              color: '#AAA',
            }}
          >
            <span style={{ color: '#777' }}>JOB MATCH: </span>
            <strong style={{ color: '#10B981' }}>{jobMatchScore}%</strong>
          </div>
        )}
      </div>

      {/* 3. Right section: Tools & Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd+Z)"
            style={{
              padding: '5px 7px',
              backgroundColor: canUndo ? '#181818' : 'transparent',
              border: '1px solid #262626',
              borderRadius: '4px',
              color: canUndo ? '#FFFFFF' : '#444444',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Undo2 size={12} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            style={{
              padding: '5px 7px',
              backgroundColor: canRedo ? '#181818' : 'transparent',
              border: '1px solid #262626',
              borderRadius: '4px',
              color: canRedo ? '#FFFFFF' : '#444444',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Redo2 size={12} />
          </button>
        </div>

        {/* History */}
        <button
          onClick={onOpenHistory}
          title="View Version History"
          style={{
            padding: '5px 9px',
            backgroundColor: '#161616',
            border: '1px solid #262626',
            borderRadius: '5px',
            color: '#BBB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
          }}
        >
          <History size={12} />
          <span>History</span>
        </button>

        {/* Document Theme Lamp Toggle */}
        <button
          onClick={() => onDocThemeChange(docTheme === 'light' ? 'dark' : 'light')}
          title={docTheme === 'light' ? 'Switch to Dark Paper Mode' : 'Switch to White Paper Mode'}
          style={{
            padding: '5px 9px',
            backgroundColor: docTheme === 'light' ? 'rgba(245, 158, 11, 0.12)' : '#161616',
            border: docTheme === 'light' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #262626',
            borderRadius: '5px',
            color: docTheme === 'light' ? '#F59E0B' : '#AAA',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <Lamp size={14} color={docTheme === 'light' ? '#F59E0B' : '#9CA3AF'} />
        </button>

        {/* Format Preset Selector */}
        <select
          value={templatePreset}
          onChange={(e) => onTemplateChange(e.target.value as ResumeTemplatePreset)}
          style={{
            backgroundColor: '#161616',
            border: '1px solid #282828',
            borderRadius: '5px',
            color: '#DDD',
            padding: '5px 8px',
            fontSize: '0.72rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="modern_pro">Modern Pro</option>
          <option value="ats_classic">ATS Classic</option>
          <option value="minimal">Minimalist</option>
          <option value="technical">Technical</option>
          <option value="engineering">Engineering</option>
          <option value="student">Student / Entry</option>
        </select>

        {/* ATS Check */}
        <button
          onClick={onOpenAtsCheck}
          title="Run ATS format & readability check"
          style={{
            padding: '5px 9px',
            backgroundColor: '#161616',
            border: '1px solid #282828',
            borderRadius: '5px',
            color: '#DDD',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <ShieldCheck size={13} color="#10B981" />
          <span>ATS Check</span>
        </button>

        {/* Analyze Changes button */}
        <button
          onClick={onAnalyzeChanges}
          disabled={isAnalyzing}
          style={{
            padding: '5px 12px',
            backgroundColor: isAnalyzing ? '#222' : 'rgba(227, 27, 43, 0.12)',
            border: '1px solid rgba(227, 27, 43, 0.35)',
            borderRadius: '5px',
            color: isAnalyzing ? '#888' : '#FF4D4D',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {isAnalyzing ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Changes'}</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          title="Save resume changes"
          style={{
            padding: '5px 10px',
            backgroundColor: '#1A1A1A',
            border: '1px solid #333',
            borderRadius: '5px',
            color: '#FFFFFF',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Save size={12} />
          <span>Save</span>
        </button>

        {/* Export */}
        <button
          onClick={onOpenExportModal}
          style={{
            padding: '5px 12px',
            backgroundColor: '#E31B2B',
            border: 'none',
            borderRadius: '5px',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 8px rgba(227, 27, 43, 0.3)',
          }}
        >
          <Download size={13} />
          <span>Export</span>
        </button>

        {/* Toggle AI Drawer button */}
        <button
          onClick={onToggleDrawer}
          style={{
            padding: '5px 10px',
            backgroundColor: isDrawerOpen ? 'rgba(227, 27, 43, 0.2)' : '#1A1A1A',
            border: isDrawerOpen ? '1px solid #E31B2B' : '1px solid #333',
            borderRadius: '5px',
            color: isDrawerOpen ? '#FFF' : '#AAA',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title={isDrawerOpen ? 'Close AI Optimizer Drawer' : 'Open AI Optimizer Drawer'}
        >
          <Sparkles size={12} color="#E31B2B" />
          <span>AI Panel</span>
          {pendingImprovementsCount > 0 && (
            <span style={{ backgroundColor: '#E31B2B', color: '#FFF', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '8px', fontWeight: 800 }}>
              {pendingImprovementsCount}
            </span>
          )}
        </button>
      </div>

      <style>{`
        @media (max-width: 1180px) {
          .header-score-cards {
            display: none !important;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
