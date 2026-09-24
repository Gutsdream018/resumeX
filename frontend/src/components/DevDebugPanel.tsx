import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { ResumeAnalysisResult } from '../types';

interface DevDebugPanelProps {
  analysis: ResumeAnalysisResult | null;
  pipelineStage?: string;
  error?: string | null;
}

export const DevDebugPanel: React.FC<DevDebugPanelProps> = ({
  analysis,
  pipelineStage = 'completed',
  error = null,
}) => {
  // Only available in development mode
  if (!(import.meta as any).env?.DEV) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);

  const rawAny = analysis as any;
  const sections = rawAny?.sections || {};
  const detectedSectionCount = Object.keys(sections).filter((k) => sections[k]).length;
  const charCount = analysis?.metadata?.char_count ?? 0;
  const museStatus = rawAny?.aiAnalysis?.museStatus || (rawAny?.metadata?.analysis_mode === 'ai_live' ? 'success' : 'fallback');
  const finalScore = analysis?.overall_score ?? rawAny?.score?.overall ?? 0;

  const steps = [
    { label: 'Upload', done: !!analysis || pipelineStage !== 'idle' },
    { label: 'Extraction', done: !!analysis || ['structure', 'ats', 'scoring', 'completed'].includes(pipelineStage) },
    { label: 'Structuring', done: !!analysis || ['ats', 'scoring', 'completed'].includes(pipelineStage) },
    { label: 'Rule analysis', done: !!analysis || ['scoring', 'completed'].includes(pipelineStage) },
    { label: 'Muse analysis', done: !!analysis && museStatus !== 'disabled' },
    { label: 'Scoring', done: !!analysis },
    { label: 'Final response', done: !!analysis && !error },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        background: '#0a0a0a',
        border: '1px solid #333333',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.85)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '11px',
        color: '#e2e8f0',
        maxWidth: '360px',
        width: isOpen ? '340px' : 'auto',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          background: '#161616',
          borderTopLeftRadius: '7px',
          borderTopRightRadius: '7px',
          borderBottomLeftRadius: isOpen ? '0' : '7px',
          borderBottomRightRadius: isOpen ? '0' : '7px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={13} color="#E31B2B" />
          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>DEV PIPELINE DEBUG</span>
          {analysis && (
            <span
              style={{
                background: '#064e3b',
                color: '#34d399',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              Score: {finalScore}
            </span>
          )}
        </div>
        <div>{isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
      </div>

      {isOpen && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ color: '#888888', marginBottom: '4px', fontWeight: 600 }}>Pipeline status:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {steps.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {s.done ? (
                    <CheckCircle size={12} color="#10B981" />
                  ) : (
                    <XCircle size={12} color="#64748b" />
                  )}
                  <span style={{ color: s.done ? '#f1f5f9' : '#64748b' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #222222', paddingTop: '8px' }}>
            <div style={{ color: '#888888', marginBottom: '4px', fontWeight: 600 }}>Diagnostics:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Extracted characters:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{charCount}</span>

              <span style={{ color: '#94a3b8' }}>Detected sections:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{detectedSectionCount}</span>

              <span style={{ color: '#94a3b8' }}>Rules executed:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>5 (Deterministic)</span>

              <span style={{ color: '#94a3b8' }}>Muse status:</span>
              <span
                style={{
                  color: museStatus === 'success' ? '#10B981' : '#f59e0b',
                  fontWeight: 700,
                }}
              >
                {museStatus}
              </span>

              <span style={{ color: '#94a3b8' }}>Final score:</span>
              <span style={{ color: '#E31B2B', fontWeight: 800 }}>{finalScore}/100</span>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 8px',
                borderRadius: '4px',
                color: '#f87171',
              }}
            >
              Error: {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
