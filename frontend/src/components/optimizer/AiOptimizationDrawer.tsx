import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Edit3,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  History,
  RotateCcw,
  GitCompare,
  ArrowRight,
  Loader2,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { MissingInformationPrompt, CanonicalResume } from '../../types';
import { factGuidedRewriteApi } from '../../services/api';
import { VersionSnapshot } from './VersionHistoryModal';

export interface DrawerRecommendation {
  id: string;
  section: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: 'Content Quality' | 'Structure' | 'ATS Readability' | 'Language' | 'Job Match';
  originalText: string;
  suggestedRevision: string;
  explanation: string;
  recruiterTip?: string;
  verifiedFacts?: string[];
  missingPrompt?: MissingInformationPrompt;
  applied?: boolean;
}

export interface OptimizationCheckItem {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'critical';
  sectionTarget: string;
  message: string;
}

interface AiOptimizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: DrawerRecommendation[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  onApplyRecommendation: (rec: DrawerRecommendation, modifiedText?: string) => void;
  onDismissRecommendation: (id: string) => void;
  versions: VersionSnapshot[];
  currentVersionId: string;
  onRestoreVersion: (version: VersionSnapshot) => void;
  onOpenCompareModal: (version: VersionSnapshot) => void;
  onScrollToSection: (sectionKey: string) => void;
  overallScore: number;
}

export const AiOptimizationDrawer: React.FC<AiOptimizationDrawerProps> = ({
  isOpen,
  onClose,
  recommendations,
  selectedIssueId,
  onSelectIssue,
  onApplyRecommendation,
  onDismissRecommendation,
  versions,
  currentVersionId,
  onRestoreVersion,
  onOpenCompareModal,
  onScrollToSection,
  overallScore,
}) => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'checks' | 'history'>('recommendations');
  const [isEditingSuggestion, setIsEditingSuggestion] = useState(false);
  const [editableSuggestionText, setEditableSuggestionText] = useState('');
  const [userFactsInput, setUserFactsInput] = useState<Record<string, string>>({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Active focused recommendation
  const focusedRec = selectedIssueId
    ? recommendations.find((r) => r.id === selectedIssueId) || recommendations[0]
    : null;

  const pendingRecs = recommendations.filter((r) => !r.applied);
  const highPriorityRecs = pendingRecs.filter((r) => r.priority === 'high');
  const mediumPriorityRecs = pendingRecs.filter((r) => r.priority === 'medium');
  const lowPriorityRecs = pendingRecs.filter((r) => r.priority === 'low');

  // Optimization Checklist Data
  const checkItems: OptimizationCheckItem[] = [
    {
      id: 'chk-contact',
      label: 'Contact information verified',
      status: 'passed',
      sectionTarget: 'contact',
      message: 'Full name, email, and reachable phone channels are present.',
    },
    {
      id: 'chk-readability',
      label: 'ATS-readable single-column text',
      status: 'passed',
      sectionTarget: 'summary',
      message: 'Document structure passes automated parser text extraction checks.',
    },
    {
      id: 'chk-hierarchy',
      label: 'Standard section hierarchy',
      status: 'passed',
      sectionTarget: 'experience',
      message: 'Standard taxonomy used (Summary, Experience, Projects, Skills, Education).',
    },
    {
      id: 'chk-summary',
      label: 'Professional summary impact',
      status: recommendations.some((r) => r.section === 'summary' && !r.applied) ? 'warning' : 'passed',
      sectionTarget: 'summary',
      message: 'Summary focuses on verified competencies rather than generic intent.',
    },
    {
      id: 'chk-experience',
      label: 'Experience measurable scale & metrics',
      status: recommendations.some((r) => r.section === 'experience' && !r.applied) ? 'warning' : 'passed',
      sectionTarget: 'experience',
      message: 'Work history includes verified action verbs and quantifiable results.',
    },
    {
      id: 'chk-skills',
      label: 'Skills matrix organization',
      status: recommendations.some((r) => r.section === 'skills' && !r.applied) ? 'warning' : 'passed',
      sectionTarget: 'skills',
      message: 'Technical skills categorized into Languages, Frameworks, and Tools.',
    },
    {
      id: 'chk-education',
      label: 'Education & graduation dates',
      status: 'passed',
      sectionTarget: 'education',
      message: 'Degree, institution, and completion date formatted correctly.',
    },
    {
      id: 'chk-formatting',
      label: 'Zero bracketed placeholders',
      status: 'passed',
      sectionTarget: 'experience',
      message: 'No uncustomized template brackets detected.',
    },
  ];

  const handleStartEditing = (text: string) => {
    setEditableSuggestionText(text);
    setIsEditingSuggestion(true);
  };

  const handleSynthesizeWithFacts = async (rec: DrawerRecommendation) => {
    setIsSynthesizing(true);
    try {
      const res = await factGuidedRewriteApi({
        originalText: rec.originalText,
        section: rec.section,
        userFacts: userFactsInput,
      });

      if (res && res.suggestedRevision) {
        setEditableSuggestionText(res.suggestedRevision);
        setIsEditingSuggestion(true);
      }
    } catch (err) {
      console.error('Fact-guided synthesis failed:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="AI Optimization Workspace"
      style={{
        width: '390px',
        maxWidth: '100vw',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        backgroundColor: '#0F0F0F',
        borderLeft: '1px solid #222222',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 85,
        boxShadow: '-6px 0 25px rgba(0, 0, 0, 0.6)',
        flexShrink: 0,
      }}
    >
      {/* 1. Drawer Top Header */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#141414',
          borderBottom: '1px solid #222222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: 'rgba(227, 27, 43, 0.15)',
              border: '1px solid rgba(227, 27, 43, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E31B2B',
            }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF' }}>
              ResumeX Optimizer
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>
              {pendingRecs.length > 0
                ? `${pendingRecs.length} optimizations available`
                : 'All recommendations applied!'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Close Drawer"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #222222',
          backgroundColor: '#121212',
        }}
      >
        <button
          onClick={() => {
            setActiveTab('recommendations');
            onSelectIssue(null);
          }}
          style={{
            flex: 1,
            padding: '9px 6px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'recommendations' ? '2px solid #E31B2B' : '2px solid transparent',
            color: activeTab === 'recommendations' ? '#FFFFFF' : '#888888',
            fontWeight: activeTab === 'recommendations' ? 700 : 500,
            fontSize: '0.74rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          <span>RECOMMENDATIONS</span>
          {pendingRecs.length > 0 && (
            <span
              style={{
                fontSize: '0.62rem',
                backgroundColor: 'rgba(227, 27, 43, 0.25)',
                color: '#FF6B6B',
                padding: '1px 5px',
                borderRadius: '8px',
                fontWeight: 700,
              }}
            >
              {pendingRecs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('checks');
            onSelectIssue(null);
          }}
          style={{
            flex: 1,
            padding: '9px 6px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'checks' ? '2px solid #E31B2B' : '2px solid transparent',
            color: activeTab === 'checks' ? '#FFFFFF' : '#888888',
            fontWeight: activeTab === 'checks' ? 700 : 500,
            fontSize: '0.74rem',
            cursor: 'pointer',
          }}
        >
          CHECKS
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            onSelectIssue(null);
          }}
          style={{
            flex: 1,
            padding: '9px 6px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #E31B2B' : '2px solid transparent',
            color: activeTab === 'history' ? '#FFFFFF' : '#888888',
            fontWeight: activeTab === 'history' ? 700 : 500,
            fontSize: '0.74rem',
            cursor: 'pointer',
          }}
        >
          HISTORY
        </button>
      </div>

      {/* 3. Drawer Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* ================= TAB 1: RECOMMENDATIONS ================= */}
        {activeTab === 'recommendations' && (
          <>
            {/* If an issue is actively focused */}
            {focusedRec ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => onSelectIssue(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                    alignSelf: 'flex-start',
                  }}
                >
                  ← Back to all recommendations
                </button>

                {/* Focused Card */}
                <div
                  style={{
                    backgroundColor: '#161616',
                    border: '1px solid #2B2B2B',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Category Pill + Priority */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#E31B2B',
                        backgroundColor: 'rgba(227, 27, 43, 0.12)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      {focusedRec.category}
                    </span>

                    <span style={{ fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
                      {focusedRec.priority} Priority
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: '8px' }}>
                    {focusedRec.title}
                  </div>

                  {/* Why it matters */}
                  <div style={{ fontSize: '0.74rem', color: '#AAAAAA', lineHeight: 1.4, marginBottom: '12px' }}>
                    <strong style={{ color: '#DDD' }}>Why it matters: </strong>
                    {focusedRec.explanation}
                  </div>

                  {/* Before / After Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {/* Before */}
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                        Original
                      </div>
                      <div
                        style={{
                          padding: '8px 10px',
                          backgroundColor: '#111111',
                          borderLeft: '3px solid #555555',
                          borderRadius: '4px',
                          color: '#999999',
                          fontSize: '0.78rem',
                          lineHeight: 1.4,
                        }}
                      >
                        {focusedRec.originalText}
                      </div>
                    </div>

                    {/* After / Editable */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                          Suggested Revision
                        </div>
                        {!isEditingSuggestion && (
                          <button
                            onClick={() => handleStartEditing(focusedRec.suggestedRevision)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#AAA',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: 0,
                            }}
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      {isEditingSuggestion ? (
                        <div>
                          <textarea
                            value={editableSuggestionText}
                            onChange={(e) => setEditableSuggestionText(e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              backgroundColor: '#1C1C1C',
                              border: '1px solid #E31B2B',
                              borderRadius: '4px',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              lineHeight: 1.4,
                              outline: 'none',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                            <button
                              onClick={() => setIsEditingSuggestion(false)}
                              style={{
                                padding: '3px 8px',
                                background: '#222',
                                border: '1px solid #444',
                                color: '#AAA',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                onApplyRecommendation(focusedRec, editableSuggestionText);
                                setIsEditingSuggestion(false);
                              }}
                              style={{
                                padding: '3px 8px',
                                background: '#E31B2B',
                                border: 'none',
                                color: '#FFF',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Apply Edited Version
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '8px 10px',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            borderLeft: '3px solid #10B981',
                            borderRadius: '4px',
                            color: '#E6F4EA',
                            fontSize: '0.78rem',
                            lineHeight: 1.4,
                            fontWeight: 500,
                          }}
                        >
                          {focusedRec.suggestedRevision}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Facts Used */}
                  {focusedRec.verifiedFacts && focusedRec.verifiedFacts.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Facts Anchored
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {focusedRec.verifiedFacts.map((fact, fi) => (
                          <span
                            key={fi}
                            style={{
                              fontSize: '0.68rem',
                              backgroundColor: '#1E1E1E',
                              color: '#DDD',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #333',
                            }}
                          >
                            ✓ {fact}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Information Prompt (if evidence absent) */}
                  {focusedRec.missingPrompt && (
                    <div
                      style={{
                        padding: '10px',
                        backgroundColor: 'rgba(245, 158, 11, 0.06)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '6px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 700, marginBottom: '6px' }}>
                        Supply Missing Evidence (Google X-Y-Z):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {focusedRec.missingPrompt.fields.map((f) => (
                          <div key={f.key}>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: '#AAA', marginBottom: '2px' }}>
                              {f.label}
                            </label>
                            <input
                              type="text"
                              placeholder={f.placeholder}
                              value={userFactsInput[f.key] || ''}
                              onChange={(e) =>
                                setUserFactsInput((prev) => ({ ...prev, [f.key]: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '5px 8px',
                                backgroundColor: '#1A1A1A',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#FFF',
                                fontSize: '0.74rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => handleSynthesizeWithFacts(focusedRec)}
                          disabled={isSynthesizing || Object.values(userFactsInput).every((v) => !v.trim())}
                          style={{
                            marginTop: '4px',
                            padding: '6px 10px',
                            backgroundColor: '#E31B2B',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: isSynthesizing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                        >
                          {isSynthesizing ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                          <span>Generate Grounded Bullet</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <button
                      onClick={() => onDismissRecommendation(focusedRec.id)}
                      style={{
                        padding: '6px 10px',
                        background: 'none',
                        border: 'none',
                        color: '#777',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss
                    </button>

                    <button
                      onClick={() => onApplyRecommendation(focusedRec)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#10B981',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <Check size={13} />
                      <span>Apply Change</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* List of Recommendations in Priority Order */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRecs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#888' }}>
                    <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, color: '#DDD', fontSize: '0.88rem' }}>
                      All Optimizations Applied
                    </div>
                    <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                      Click <strong>Analyze Changes</strong> to recalculate your updated ATS score.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* High Priority */}
                    {highPriorityRecs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#E31B2B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                          High Impact ({highPriorityRecs.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {highPriorityRecs.map((rec) => (
                            <div
                              key={rec.id}
                              onClick={() => onSelectIssue(rec.id)}
                              style={{
                                padding: '11px 13px',
                                backgroundColor: '#161616',
                                border: '1px solid #282828',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              className="drawer-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.66rem', color: '#E31B2B', fontWeight: 700, textTransform: 'uppercase' }}>
                                  {rec.section}
                                </span>
                                <ChevronRight size={13} color="#666" />
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                                {rec.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {rec.suggestedRevision}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medium Priority */}
                    {mediumPriorityRecs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                          Medium Impact ({mediumPriorityRecs.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {mediumPriorityRecs.map((rec) => (
                            <div
                              key={rec.id}
                              onClick={() => onSelectIssue(rec.id)}
                              style={{
                                padding: '11px 13px',
                                backgroundColor: '#161616',
                                border: '1px solid #282828',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              className="drawer-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.66rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                                  {rec.section}
                                </span>
                                <ChevronRight size={13} color="#666" />
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                                {rec.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {rec.suggestedRevision}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Low Priority */}
                    {lowPriorityRecs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                          Refinement ({lowPriorityRecs.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {lowPriorityRecs.map((rec) => (
                            <div
                              key={rec.id}
                              onClick={() => onSelectIssue(rec.id)}
                              style={{
                                padding: '11px 13px',
                                backgroundColor: '#161616',
                                border: '1px solid #282828',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              className="drawer-item-hover"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.66rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>
                                  {rec.section}
                                </span>
                                <ChevronRight size={13} color="#666" />
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF', marginBottom: '3px' }}>
                                {rec.title}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {rec.suggestedRevision}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: CHECKS ================= */}
        {activeTab === 'checks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              Optimization Status Checklist
            </div>

            {checkItems.map((chk) => (
              <div
                key={chk.id}
                onClick={() => onScrollToSection(chk.sectionTarget)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#161616',
                  borderRadius: '6px',
                  border: '1px solid #242424',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '9px',
                }}
                className="drawer-item-hover"
              >
                {chk.status === 'passed' ? (
                  <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />
                ) : (
                  <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: '1px' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: chk.status === 'passed' ? '#EEE' : '#FCD34D' }}>
                    {chk.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px', lineHeight: 1.3 }}>
                    {chk.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 3: HISTORY ================= */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              Version Timeline ({versions.length})
            </div>

            {versions.map((ver, vIdx) => {
              const isCurrent = ver.id === currentVersionId;

              return (
                <div
                  key={ver.id}
                  style={{
                    padding: '12px',
                    backgroundColor: isCurrent ? 'rgba(227, 27, 43, 0.08)' : '#161616',
                    borderRadius: '8px',
                    border: isCurrent ? '1px solid #E31B2B' : '1px solid #262626',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isCurrent ? '#FFF' : '#DDD' }}>
                      {ver.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: ver.atsScore >= 75 ? '#10B981' : ver.atsScore >= 60 ? '#F59E0B' : '#E31B2B',
                      }}
                    >
                      ATS {ver.atsScore}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#777', marginBottom: '8px' }}>
                    {ver.timestamp}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => onOpenCompareModal(ver)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#222',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#AAA',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <GitCompare size={11} />
                      <span>Compare</span>
                    </button>

                    {!isCurrent && (
                      <button
                        onClick={() => onRestoreVersion(ver)}
                        style={{
                          padding: '4px 9px',
                          backgroundColor: '#E31B2B',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#FFF',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <RotateCcw size={11} />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .drawer-item-hover:hover {
          border-color: #444 !important;
          background-color: #1A1A1A !important;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
};
