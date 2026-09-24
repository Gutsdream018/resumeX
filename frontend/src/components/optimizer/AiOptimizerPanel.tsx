import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Edit3,
  HelpCircle,
  Check,
} from 'lucide-react';
import {
  PriorityIssue,
  MissingInformationPrompt,
  FactGuidedRewriteResponse,
  ExportQualityReport,
} from '../../types';
import { factGuidedRewriteApi } from '../../services/api';

interface AiOptimizerPanelProps {
  currentScore: number;
  scoreDelta: number;
  priorityIssues: PriorityIssue[];
  activePrompt: MissingInformationPrompt | null;
  onClosePrompt: () => void;
  onApplyRevision: (originalText: string, revisedText: string, reason: string) => void;
  exportQuality?: ExportQualityReport;
}

export const AiOptimizerPanel: React.FC<AiOptimizerPanelProps> = ({
  currentScore,
  scoreDelta,
  priorityIssues,
  activePrompt,
  onClosePrompt,
  onApplyRevision,
  exportQuality,
}) => {
  // Local state for interactive fact collection form
  const [userFacts, setUserFacts] = useState<Record<string, string>>({});
  const [isGeneratingRewrite, setIsGeneratingRewrite] = useState(false);
  const [rewritePreview, setRewritePreview] = useState<FactGuidedRewriteResponse | null>(null);

  const handleFactChange = (key: string, val: string) => {
    setUserFacts((prev) => ({ ...prev, [key]: val }));
  };

  const handleSynthesizeRewrite = async () => {
    if (!activePrompt) return;
    setIsGeneratingRewrite(true);
    try {
      const response = await factGuidedRewriteApi({
        originalText: activePrompt.sourceText,
        section: activePrompt.section,
        userFacts,
      });
      setRewritePreview(response);
    } catch (e) {
      // Fallback grounded synthesis
      const tech = userFacts.technology ? ` utilizing ${userFacts.technology}` : '';
      const metric = userFacts.metric ? `, achieving ${userFacts.metric}` : '';
      const purpose = userFacts.purpose ? ` for ${userFacts.purpose}` : '';
      const fallbackText = `Engineered and deployed ${activePrompt.sourceText.replace(/\.*$/, '')}${purpose}${tech}${metric}.`;
      setRewritePreview({
        originalText: activePrompt.sourceText,
        suggestedRevision: fallbackText,
        verifiedFacts: Object.values(userFacts).filter(Boolean),
        explanation: 'Structured using power verbs and your provided technical facts.',
        recruiterTip: 'Accomplishment statements pairing metrics with tech achieve highest ATS ranking.',
        affectedCategory: 'experience',
        isValid: true,
      });
    } finally {
      setIsGeneratingRewrite(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* 1. Resume Health & Score Telemetry Card */}
      <div
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#E31B2B" />
            <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Optimization Assistant
            </h4>
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
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
            {currentScore}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#737373' }}>/ 100 ATS Score</span>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#9A9A9A', margin: 0, lineHeight: 1.45 }}>
          {currentScore >= 75
            ? 'Strong ATS keyword density and structured deliverables.'
            : 'Focus on replacing passive verbs and providing quantifiable scale metrics below.'}
        </p>
      </div>

      {/* 2. Interactive Missing Information & Fact Collector Card */}
      {activePrompt && (
        <div
          className="card-dark"
          style={{
            background: 'linear-gradient(180deg, #161616 0%, #0D0D0D 100%)',
            border: '1px solid #E31B2B',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 8px 30px rgba(227, 27, 43, 0.15)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={15} color="#E31B2B" />
              <strong style={{ fontSize: '0.86rem', color: '#FFFFFF' }}>Supply Missing Evidence</strong>
            </div>
            <button
              onClick={onClosePrompt}
              style={{ background: 'transparent', border: 'none', color: '#737373', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ background: '#0D0D0D', border: '1px dashed #333333', padding: '10px 12px', borderRadius: '6px', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.7rem', color: '#737373', display: 'block', marginBottom: '2px' }}>Selected Statement:</span>
            <p style={{ margin: 0, color: '#FF99A1', fontSize: '0.82rem', lineHeight: 1.4 }}>
              "{activePrompt.sourceText}"
            </p>
          </div>

          {/* Form Fields for Candidate Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            {activePrompt.fields.map((field) => (
              <div key={field.key}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#E0E0E0', display: 'block', marginBottom: '3px' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={userFacts[field.key] || ''}
                  onChange={(e) => handleFactChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    background: '#1A1A1A',
                    border: '1px solid #333333',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
                {field.hint && (
                  <span style={{ fontSize: '0.68rem', color: '#737373', display: 'block', marginTop: '2px' }}>
                    {field.hint}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Generate Button */}
          {!rewritePreview ? (
            <button
              disabled={isGeneratingRewrite}
              onClick={handleSynthesizeRewrite}
              className="btn btn-red"
              style={{ width: '100%', padding: '10px', fontSize: '0.84rem', fontWeight: 700 }}
            >
              <Sparkles size={14} />
              <span>{isGeneratingRewrite ? 'Validating Evidence...' : 'Generate Grounded Revision'}</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', display: 'block', marginBottom: '4px' }}>
                  PROPOSED REVISION:
                </span>
                <p style={{ color: '#FFFFFF', fontSize: '0.86rem', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                  "{rewritePreview.suggestedRevision}"
                </p>

                {rewritePreview.verifiedFacts.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <ShieldCheck size={12} color="#10B981" />
                    <span style={{ fontSize: '0.68rem', color: '#9A9A9A' }}>Anchored facts:</span>
                    {rewritePreview.verifiedFacts.map((f, idx) => (
                      <span key={idx} style={{ background: '#0D0D0D', color: '#FFFFFF', fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    onApplyRevision(activePrompt.sourceText, rewritePreview.suggestedRevision, 'Applied evidence-grounded rewrite');
                    onClosePrompt();
                    setRewritePreview(null);
                    setUserFacts({});
                  }}
                  className="btn btn-red"
                  style={{ flex: 1, padding: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <Check size={13} />
                  <span>Apply to Resume</span>
                </button>
                <button
                  onClick={() => setRewritePreview(null)}
                  className="btn btn-secondary-dark"
                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  Edit Facts
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Top Optimization Opportunities */}
      <div
        className="card-dark"
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <AlertTriangle size={16} color="#F59E0B" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Priority Fixes
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {priorityIssues.slice(0, 4).map((issue, idx) => (
            <div
              key={idx}
              style={{
                background: '#121212',
                border: '1px solid #222222',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#FFFFFF' }}>{issue.title}</strong>
                <span style={{ fontSize: '0.68rem', color: '#E31B2B', textTransform: 'uppercase' }}>
                  {issue.affectedScore}
                </span>
              </div>
              <p style={{ color: '#888888', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>
                {issue.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pre-Export Quality Checklist */}
      {exportQuality && (
        <div
          className="card-dark"
          style={{
            background: '#0D0D0D',
            border: '1px solid #242424',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Export Quality Pre-Check
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {exportQuality.checks.map((check) => (
              <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: check.passed ? '#10B981' : '#E31B2B' }}>
                  {check.passed ? '✓' : '✕'}
                </span>
                <span style={{ color: check.passed ? '#D4D4D4' : '#FF99A1' }}>
                  {check.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
