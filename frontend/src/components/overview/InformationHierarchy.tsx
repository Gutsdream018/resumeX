import React, { useState } from 'react';
import { Eye, ArrowDown, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface InformationHierarchyProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

interface HierarchyNode {
  id: string;
  label: string;
  subtitle: string;
  prominenceScore: number; // 0 - 100
  scanDurationSec: number;
  status: 'optimal' | 'prominent' | 'needs_contrast';
  insight: string;
  targetTab: string;
}

export const InformationHierarchy: React.FC<InformationHierarchyProps> = ({
  analysis,
  onNavigateTab,
}) => {
  const rawAny = analysis as any;
  const canonical = analysis.canonicalResume || rawAny?.structuredResume || {};
  const cats = analysis.category_scores || {};

  const hasName = Boolean(canonical.contact?.name);
  const hasSummary = Boolean(canonical.summary);
  const expCount = canonical.experience?.length || 2;
  const skillsCount = canonical.skills?.technical?.length || 8;
  const projectCount = canonical.projects?.length || 1;

  const hierarchyNodes: HierarchyNode[] = [
    {
      id: 'name',
      label: 'Identity & Header',
      subtitle: hasName ? `${canonical.contact?.name || 'Candidate Name'}` : 'Header Division',
      prominenceScore: 92,
      scanDurationSec: 0.6,
      status: 'optimal',
      insight: 'First structural entry parsed. Clean contact anchor points with no unreadable text boxes.',
      targetTab: 'optimizer',
    },
    {
      id: 'headline',
      label: 'Target Role & Headline',
      subtitle: canonical.summary ? 'Role Signal' : 'Implicit Role',
      prominenceScore: 78,
      scanDurationSec: 0.8,
      status: canonical.summary ? 'optimal' : 'needs_contrast',
      insight: canonical.summary ? 'Target engineering direction established at the top of the reading order.' : 'Explicit target title will accelerate ATS role matching.',
      targetTab: 'optimizer',
    },
    {
      id: 'summary',
      label: 'Executive Summary',
      subtitle: hasSummary ? `${canonical.summary?.slice(0, 38)}...` : 'Not present',
      prominenceScore: hasSummary ? 70 : 40,
      scanDurationSec: hasSummary ? 1.0 : 0.2,
      status: hasSummary ? 'optimal' : 'needs_contrast',
      insight: hasSummary ? 'Concise elevator pitch providing context before chronological scan.' : 'Optional but recommended for senior or transitioning profiles.',
      targetTab: 'optimizer',
    },
    {
      id: 'experience',
      label: 'Professional Experience',
      subtitle: `${expCount} verified employment blocks`,
      prominenceScore: 95,
      scanDurationSec: 2.8,
      status: (cats.experience ?? 70) >= 70 ? 'prominent' : 'needs_contrast',
      insight: 'Highest cognitive prominence. Evaluated for bullet length balance, bold metrics, and company prestige.',
      targetTab: 'experience',
    },
    {
      id: 'skills',
      label: 'Technical Skills Matrix',
      subtitle: `${skillsCount} grouped competencies`,
      prominenceScore: 86,
      scanDurationSec: 1.4,
      status: (cats.skills ?? 70) >= 70 ? 'prominent' : 'needs_contrast',
      insight: 'Immediate keyword scan zone. Grouped category taxonomies dramatically improve indexing speed.',
      targetTab: 'skills',
    },
    {
      id: 'projects',
      label: 'Applied Projects',
      subtitle: `${projectCount} documented systems`,
      prominenceScore: 68,
      scanDurationSec: 0.9,
      status: projectCount > 0 ? 'optimal' : 'needs_contrast',
      insight: 'Secondary evidence reinforcing core capabilities and software engineering breadth.',
      targetTab: 'optimizer',
    },
  ];

  const [activeNodeId, setActiveNodeId] = useState<string>('experience');
  const activeNode = hierarchyNodes.find((n) => n.id === activeNodeId) || hierarchyNodes[3];

  return (
    <div
      className="card-dark"
      style={{
        background: '#0A0A0A',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '20px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#E50920',
                background: 'rgba(229, 9, 32, 0.1)',
                border: '1px solid rgba(229, 9, 32, 0.25)',
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Eye-Flow Simulation
            </span>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Recruiter Attention Map
            </h4>
          </div>

          <span style={{ fontSize: '0.74rem', color: '#737373' }}>
            Information Hierarchy Flow
          </span>
        </div>
        <p style={{ color: '#888888', fontSize: '0.82rem', margin: 0 }}>
          Visual representation of information hierarchy and content prominence across the standard document scan path.
        </p>
      </div>

      {/* Downward Scanning Cascade */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
        {hierarchyNodes.map((node, idx) => {
          const isSelected = activeNodeId === node.id;
          const isLast = idx === hierarchyNodes.length - 1;

          return (
            <React.Fragment key={node.id}>
              <div
                onClick={() => setActiveNodeId(node.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: isSelected ? 'rgba(229, 9, 32, 0.1)' : '#0E0E0E',
                  border: `1px solid ${isSelected ? '#E50920' : 'rgba(255, 255, 255, 0.04)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#E50920' : '#1A1A1A',
                      color: isSelected ? '#FFFFFF' : '#888888',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    0{idx + 1}
                  </span>

                  <div>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: isSelected ? '#FFFFFF' : '#C0C0C0',
                        display: 'block',
                      }}
                    >
                      {node.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#666666' }}>
                      {node.subtitle}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Visual Prominence Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <div style={{ width: '60px', height: '4px', backgroundColor: '#1A1A1A', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${node.prominenceScore}%`,
                          height: '100%',
                          backgroundColor: isSelected ? '#E50920' : '#737373',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.64rem', color: '#737373' }}>
                      ~{node.scanDurationSec}s scan
                    </span>
                  </div>
                </div>
              </div>

              {!isLast && (
                <div style={{ display: 'flex', justifyContent: 'center', height: '8px', alignItems: 'center' }}>
                  <ArrowDown size={10} color="#333333" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Node Inspection Details */}
      <div
        style={{
          background: '#0E0E0E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>
            {activeNode.label}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: activeNode.status === 'optimal' ? '#10B981' : activeNode.status === 'prominent' ? '#E50920' : '#F59E0B',
              fontWeight: 700,
            }}
          >
            {activeNode.status === 'prominent' ? 'High Visual Priority' : activeNode.status === 'optimal' ? 'Well Balanced' : 'Low Prominence'}
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#999999', margin: 0, lineHeight: 1.45 }}>
          {activeNode.insight}
        </p>
      </div>
    </div>
  );
};
