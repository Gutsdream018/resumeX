import React, { useState } from 'react';
import { X, History, RotateCcw, Check, Calendar, ArrowRight, FileText } from 'lucide-react';
import { RevisionHistoryItem } from '../../types';
import { CanonicalResume } from '../../types';

export interface VersionSnapshot {
  id: string;
  label: string;
  timestamp: string;
  resume: CanonicalResume;
  atsScore: number;
  changesSummary?: string;
  isOriginal?: boolean;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionSnapshot[];
  currentVersionId: string;
  onRestoreVersion: (version: VersionSnapshot) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  onRestoreVersion,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || currentVersionId
  );

  if (!isOpen) return null;

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const currentVersion = versions.find((v) => v.id === currentVersionId) || versions[versions.length - 1];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '96vw',
          height: '75vh',
          backgroundColor: '#121212',
          border: '1px solid #282828',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(227, 27, 43, 0.25)',
          color: '#F5F5F5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#181818',
            borderBottom: '1px solid #262626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(227, 27, 43, 0.12)',
                border: '1px solid rgba(227, 27, 43, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E31B2B',
              }}
            >
              <History size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>
                Version History & Checkpoint Comparison
              </div>
              <div style={{ fontSize: '0.74rem', color: '#888' }}>
                Compare iterations against the original baseline and restore any state
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
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Left Timeline + Right Preview */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left Timeline Sidebar */}
          <div
            style={{
              width: '280px',
              borderRight: '1px solid #242424',
              backgroundColor: '#151515',
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '4px' }}>
              Checkpoints ({versions.length})
            </div>

            {versions.map((ver) => {
              const isSelected = ver.id === selectedVersionId;
              const isCurrent = ver.id === currentVersionId;

              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersionId(ver.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(227, 27, 43, 0.12)' : '#1A1A1A',
                    border: isSelected ? '1px solid #E31B2B' : '1px solid #262626',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#DDD' }}>
                      {ver.label}
                    </span>
                    {ver.isOriginal ? (
                      <span style={{ fontSize: '0.65rem', backgroundColor: '#333', color: '#BBB', padding: '1px 5px', borderRadius: '4px' }}>
                        Baseline
                      </span>
                    ) : isCurrent ? (
                      <span style={{ fontSize: '0.65rem', backgroundColor: '#10B981', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        Current
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.7rem', color: '#888' }}>
                    <Calendar size={11} />
                    <span>{ver.timestamp}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#AAA' }}>Score:</span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: ver.atsScore >= 75 ? '#10B981' : ver.atsScore >= 60 ? '#F59E0B' : '#E31B2B',
                      }}
                    >
                      {ver.atsScore}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Preview Pane */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#0E0E0E' }}>
            {selectedVersion && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #222',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#FFF', fontWeight: 800 }}>
                      {selectedVersion.label}
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: '#888', marginTop: '2px' }}>
                      {selectedVersion.timestamp} • ATS Score: {selectedVersion.atsScore}/100
                    </div>
                  </div>

                  {selectedVersion.id !== currentVersionId && (
                    <button
                      onClick={() => {
                        onRestoreVersion(selectedVersion);
                        onClose();
                      }}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#E31B2B',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Restore This Version</span>
                    </button>
                  )}
                </div>

                {/* Structured Overview of Selected Version */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Summary */}
                  {selectedVersion.resume.summary && (
                    <div style={{ backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #242424' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Professional Summary
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#DDD', lineHeight: 1.4 }}>
                        {selectedVersion.resume.summary}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {selectedVersion.resume.experience && selectedVersion.resume.experience.length > 0 && (
                    <div style={{ backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #242424' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Work Experience ({selectedVersion.resume.experience.length} roles)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedVersion.resume.experience.map((exp: any, i: number) => (
                          <div key={i} style={{ borderLeft: '2px solid #333', paddingLeft: '8px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>
                              {exp.title} • {exp.company}
                            </div>
                            <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.76rem', color: '#AAA' }}>
                              {(exp.bullets || []).map((b: string, bi: number) => (
                                <li key={bi} style={{ marginBottom: '2px' }}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedVersion.resume.skills && (
                    <div style={{ backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #242424' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {(selectedVersion.resume.skills.technical || []).map((s: string, si: number) => (
                          <span key={si} style={{ fontSize: '0.72rem', backgroundColor: '#222', color: '#DDD', padding: '2px 7px', borderRadius: '4px' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
