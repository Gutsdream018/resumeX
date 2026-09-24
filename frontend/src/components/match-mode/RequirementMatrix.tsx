import React, { useState } from 'react';
import { RequirementMatchItem } from './types';
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Sparkles, Filter, ChevronRight, Info, ShieldAlert } from 'lucide-react';

interface RequirementMatrixProps {
  requirements: RequirementMatchItem[];
  onOptimizeSection?: (section: string, requirementText: string) => void;
}

export const RequirementMatrix: React.FC<RequirementMatrixProps> = ({
  requirements,
  onOptimizeSection,
}) => {
  const [filter, setFilter] = useState<'all' | 'MATCHED' | 'PARTIAL' | 'MISSING'>('all');
  const [selectedReq, setSelectedReq] = useState<RequirementMatchItem | null>(null);

  const matchedCount = requirements.filter((r) => r.status === 'MATCHED').length;
  const partialCount = requirements.filter((r) => r.status === 'PARTIAL').length;
  const missingCount = requirements.filter((r) => r.status === 'MISSING').length;

  const filtered = requirements.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status: RequirementMatchItem['status'], strength: RequirementMatchItem['evidenceStrength']) => {
    if (status === 'MATCHED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            color: '#4ADE80',
          }}
        >
          <CheckCircle2 size={12} />
          <span>MATCHED</span>
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            color: '#FACC15',
          }}
        >
          <AlertTriangle size={12} />
          <span>PARTIAL</span>
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 9px',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#F87171',
        }}
      >
        <XCircle size={12} />
        <span>MISSING</span>
      </span>
    );
  };

  const getImportanceBadge = (importance: RequirementMatchItem['importance']) => {
    if (importance === 'MUST_HAVE') {
      return (
        <span
          style={{
            fontSize: '0.66rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(227, 27, 43, 0.18)',
            color: '#FF5C6C',
            border: '1px solid rgba(227, 27, 43, 0.4)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          MUST HAVE
        </span>
      );
    }
    if (importance === 'HIGH') {
      return (
        <span
          style={{
            fontSize: '0.66rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#E5E5E5',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          HIGH
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '0.66rem',
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.04)',
          color: '#A3A3A3',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {importance}
      </span>
    );
  };

  return (
    <div
      className="card-dark"
      style={{
        background: '#111111',
        border: '1px solid #242424',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Header & Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <span>Requirement Fit Matrix</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#8E8E8E',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {requirements.length} Evaluated
            </span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8E8E8E', marginTop: '4px', margin: 0 }}>
            Every target job requirement verified against explicit resume citations and evidence strength.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: filter === 'all' ? '#2A2A2A' : '#141414',
              color: filter === 'all' ? '#FFFFFF' : '#A3A3A3',
              border: filter === 'all' ? '1px solid #444' : '1px solid #222',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All ({requirements.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('MATCHED')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: filter === 'MATCHED' ? 'rgba(34, 197, 94, 0.15)' : '#141414',
              color: filter === 'MATCHED' ? '#4ADE80' : '#A3A3A3',
              border: filter === 'MATCHED' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #222',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ✓ Matched ({matchedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PARTIAL')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: filter === 'PARTIAL' ? 'rgba(234, 179, 8, 0.15)' : '#141414',
              color: filter === 'PARTIAL' ? '#FACC15' : '#A3A3A3',
              border: filter === 'PARTIAL' ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid #222',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ⚠ Partial ({partialCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('MISSING')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: filter === 'MISSING' ? 'rgba(239, 68, 68, 0.15)' : '#141414',
              color: filter === 'MISSING' ? '#F87171' : '#A3A3A3',
              border: filter === 'MISSING' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #222',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ✕ Missing ({missingCount})
          </button>
        </div>
      </div>

      {/* Interactive Table */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #222' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#161616', borderBottom: '1px solid #282828', color: '#9E9E9E' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Job Requirement</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Importance</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Match Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Resume Evidence Citation</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#737373' }}>
                  No requirements found in this category.
                </td>
              </tr>
            ) : (
              filtered.map((req, idx) => {
                const isSelected = selectedReq?.id === req.id;
                return (
                  <tr
                    key={req.id || idx}
                    onClick={() => setSelectedReq(req)}
                    style={{
                      borderBottom: '1px solid #1F1F1F',
                      background: isSelected ? 'rgba(227, 27, 43, 0.08)' : idx % 2 === 0 ? '#111111' : '#0D0D0D',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#181818';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? '#111111' : '#0D0D0D';
                    }}
                  >
                    {/* Requirement text */}
                    <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 600, maxWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{req.requirementText}</span>
                      </div>
                    </td>

                    {/* Importance */}
                    <td style={{ padding: '14px 14px' }}>
                      {getImportanceBadge(req.importance)}
                    </td>

                    {/* Match Status */}
                    <td style={{ padding: '14px 14px' }}>
                      {getStatusBadge(req.status, req.evidenceStrength)}
                    </td>

                    {/* Resume Evidence */}
                    <td style={{ padding: '14px 16px', color: '#C0C0C0', maxWidth: '340px' }}>
                      {req.evidenceQuote ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#E0E0E0', fontStyle: 'italic' }}>
                            "{req.evidenceQuote.length > 85 ? req.evidenceQuote.substring(0, 85) + '...' : req.evidenceQuote}"
                          </span>
                          {req.sourceSection && (
                            <span style={{ fontSize: '0.68rem', color: '#888888' }}>
                              Source: <strong style={{ color: '#AAA' }}>{req.sourceSection.toUpperCase()}</strong>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: '#737373', fontStyle: 'italic' }}>
                          No supporting evidence found in current resume
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {req.status !== 'MATCHED' && onOptimizeSection ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOptimizeSection(req.suggestedSection || 'skills', req.requirementText);
                          }}
                          style={{
                            background: 'rgba(227, 27, 43, 0.15)',
                            border: '1px solid rgba(227, 27, 43, 0.4)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E31B2B';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(227, 27, 43, 0.15)';
                          }}
                        >
                          <Sparkles size={11} />
                          <span>Optimize</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReq(req);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid #2E2E2E',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: '#A1A1AA',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Info size={11} />
                          <span>Details</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Requirement Detail Drawer/Modal */}
      {selectedReq && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: '#161616',
            border: '1px solid #333333',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF' }}>
                {selectedReq.requirementText}
              </span>
              {getStatusBadge(selectedReq.status, selectedReq.evidenceStrength)}
              {getImportanceBadge(selectedReq.importance)}
            </div>

            <button
              type="button"
              onClick={() => setSelectedReq(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '6px' }}>
            {/* Why It Matters */}
            <div style={{ background: '#0D0D0D', padding: '12px', borderRadius: '8px', border: '1px solid #242424' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                Why This Matters
              </span>
              <p style={{ fontSize: '0.8rem', color: '#DDD', margin: '4px 0 0' }}>
                {selectedReq.whyItMatters || 'Evaluated against candidate qualifications and job description criteria.'}
              </p>
            </div>

            {/* Evidence & Limitation */}
            <div style={{ background: '#0D0D0D', padding: '12px', borderRadius: '8px', border: '1px solid #242424' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                Evidence Assessment ({selectedReq.evidenceStrength.replace('_', ' ').toUpperCase()})
              </span>
              <p style={{ fontSize: '0.8rem', color: selectedReq.evidenceQuote ? '#4ADE80' : '#F87171', margin: '4px 0 0', fontStyle: 'italic' }}>
                {selectedReq.evidenceQuote ? `"${selectedReq.evidenceQuote}"` : 'No explicit evidence found in current resume.'}
              </p>
            </div>
          </div>

          {/* Action recommendation */}
          {selectedReq.status !== 'MATCHED' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(227, 27, 43, 0.08)',
                border: '1px solid rgba(227, 27, 43, 0.25)',
                marginTop: '4px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color="#FF5C6C" />
                <span style={{ fontSize: '0.78rem', color: '#F0F0F0' }}>
                  {selectedReq.actionRecommendation || `Highlight ${selectedReq.requirementText} only if you possess actual hands-on experience.`}
                </span>
              </div>

              {onOptimizeSection && (
                <button
                  type="button"
                  onClick={() => onOptimizeSection(selectedReq.suggestedSection || 'skills', selectedReq.requirementText)}
                  className="btn btn-red"
                  style={{ padding: '6px 14px', fontSize: '0.76rem', fontWeight: 700 }}
                >
                  <span>Open in Resume Optimizer</span>
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
