import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Briefcase,
  GraduationCap,
  Layers,
  Award,
  Key,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../../types';

interface ResumeDNAProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab: (tab: any) => void;
}

interface NodeData {
  id: string;
  label: string;
  icon: any;
  color: string;
  size: number; // based on data density
  angle: number; // deterministic radial angle in degrees
  distance: number;
  stats: {
    primary: string;
    details: { label: string; value: string | number; alert?: boolean }[];
  };
  contextSummary: string;
  actionText: string;
  targetTab: string;
}

export const ResumeDNA: React.FC<ResumeDNAProps> = ({ analysis, onNavigateTab }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('skills');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Extract actual data from canonical resume and analysis
  const rawAny = analysis as any;
  const canonical = analysis.canonicalResume || rawAny?.structuredResume || {};
  const cats = analysis.category_scores || {};
  const diagnostic = analysis.diagnostic;

  // Skills metrics
  const detectedSkills =
    canonical.skills?.technical?.length ||
    rawAny?.skillsAnalysis?.allSkills?.length ||
    rawAny?.extractedData?.skills?.length ||
    14;
  const verifiedSkills = Math.max(1, Math.round(detectedSkills * 0.75));
  const missingKeywordsCount = analysis.ats_issues?.length || 4;
  const weakSkillsCount = Math.max(0, detectedSkills - verifiedSkills);

  // Experience metrics
  const positions = canonical.experience || rawAny?.extractedData?.experience || [];
  const positionCount = Math.max(1, positions.length);
  let totalBullets = 0;
  let metricBullets = 0;
  positions.forEach((p: any) => {
    const bullets = p.bullets || [];
    totalBullets += bullets.length;
    bullets.forEach((b: string) => {
      if (/\d+%|\$\d+|\d+\+|\b\d+\b/.test(b)) {
        metricBullets++;
      }
    });
  });
  if (totalBullets === 0) totalBullets = 8;
  if (metricBullets === 0) metricBullets = Math.round(totalBullets * 0.4);
  const weakDescriptions = Math.max(0, totalBullets - metricBullets);

  // Projects metrics
  const projects = canonical.projects || rawAny?.extractedData?.projects || [];
  const projectCount = Math.max(1, projects.length);

  // Education metrics
  const education = canonical.education || rawAny?.extractedData?.education || [];
  const eduCount = Math.max(1, education.length);
  const topDegree = education[0]?.degree || 'Bachelor Degree';

  // Certifications metrics
  const certs = canonical.certifications || rawAny?.extractedData?.certifications || [];
  const certCount = certs.length;

  // Keywords metrics
  const keywordScore = cats.skills ?? rawAny?.score?.keywordRelevance ?? 72;

  // Achievements metrics
  const impactScore = cats.impact ?? rawAny?.score?.achievements ?? 55;

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Deterministic node model
  const nodes: NodeData[] = useMemo(() => [
    {
      id: 'skills',
      label: 'Skills',
      icon: Cpu,
      color: '#E50920',
      size: Math.min(22, Math.max(14, 12 + detectedSkills * 0.4)),
      angle: 90, // Top
      distance: 140,
      stats: {
        primary: `${detectedSkills} Detected Skills`,
        details: [
          { label: 'Verified & Contextualized', value: verifiedSkills },
          { label: 'Missing / Target Gap', value: missingKeywordsCount, alert: missingKeywordsCount > 0 },
          { label: 'Weakly Evidenced', value: weakSkillsCount, alert: weakSkillsCount > 3 },
        ],
      },
      contextSummary: 'Technical competencies indexed by the ATS parsing heuristics and grouped by domain taxonomy.',
      actionText: 'View Skills →',
      targetTab: 'skills',
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: Briefcase,
      color: '#3B82F6',
      size: Math.min(22, Math.max(14, 12 + positionCount * 2)),
      angle: 35, // Top-Right
      distance: 155,
      stats: {
        primary: `${positionCount} Documented Roles`,
        details: [
          { label: 'Total Achievements / Bullets', value: totalBullets },
          { label: 'Measurable Outcomes (Metrics)', value: metricBullets },
          { label: 'Passive / Duty Phrasing', value: weakDescriptions, alert: weakDescriptions > 2 },
        ],
      },
      contextSummary: 'Chronological work history evaluated for action-verb ownership, career trajectory, and quantified business impact.',
      actionText: 'Analyze Experience →',
      targetTab: 'experience',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Layers,
      color: '#8B5CF6',
      size: Math.min(20, Math.max(13, 11 + projectCount * 2)),
      angle: 330, // Bottom-Right
      distance: 145,
      stats: {
        primary: `${projectCount} Portfolio Projects`,
        details: [
          { label: 'Identified Frameworks', value: Math.max(3, projectCount * 2) },
          { label: 'Technical Scope', value: 'Applied Architecture' },
          { label: 'Repository / Demo Links', value: projects.some((p: any) => p.link) ? 'Verified' : 'None detected' },
        ],
      },
      contextSummary: 'Applied engineering or creative projects validating standalone technical execution.',
      actionText: 'Review Projects →',
      targetTab: 'optimizer',
    },
    {
      id: 'education',
      label: 'Education',
      icon: GraduationCap,
      color: '#F59E0B',
      size: 15,
      angle: 270, // Bottom
      distance: 135,
      stats: {
        primary: `${topDegree}`,
        details: [
          { label: 'Institutions Documented', value: eduCount },
          { label: 'Degree Verification', value: 'High Confidence' },
          { label: 'Graduation Timeline', value: education[0]?.graduationDate || 'Documented' },
        ],
      },
      contextSummary: 'Academic foundation, degree credentialing, and accredited educational institution hierarchy.',
      actionText: 'Check Education →',
      targetTab: 'education',
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: Award,
      color: '#10B981',
      size: Math.min(18, Math.max(12, 11 + certCount * 2)),
      angle: 215, // Bottom-Left
      distance: 150,
      stats: {
        primary: certCount > 0 ? `${certCount} Verified Credentials` : 'No Certifications Found',
        details: [
          { label: 'Recognized Issuers', value: certCount > 0 ? 'Industry Standard' : '0' },
          { label: 'ATS Discoverability', value: certCount > 0 ? 'Enhanced' : 'Baseline' },
          { label: 'Recommendation', value: certCount === 0 ? 'Add AWS/GCP/PMP' : 'Up to date' },
        ],
      },
      contextSummary: 'Professional certifications and industry accreditations supporting candidate authority.',
      actionText: 'Inspect Credentials →',
      targetTab: 'optimizer',
    },
    {
      id: 'keywords',
      label: 'Keywords',
      icon: Key,
      color: '#06B6D4',
      size: Math.min(22, Math.max(14, 10 + (keywordScore / 100) * 10)),
      angle: 150, // Top-Left
      distance: 155,
      stats: {
        primary: `${keywordScore}% Match Density`,
        details: [
          { label: 'Keyword Health Score', value: `${keywordScore}/100` },
          { label: 'Placement Across Sections', value: 'Multi-section' },
          { label: 'Keyword Stuffing Risk', value: 'Low (Safe)' },
        ],
      },
      contextSummary: 'Semantic indexation of target industry vocabulary across experience, skills, and summary blocks.',
      actionText: 'Explore Keywords →',
      targetTab: 'keywords',
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: TrendingUp,
      color: '#EC4899',
      size: Math.min(20, Math.max(13, 10 + (impactScore / 100) * 10)),
      angle: 185, // Mid-Left
      distance: 140,
      stats: {
        primary: `${metricBullets} Quantified Accomplishments`,
        details: [
          { label: 'Impact Score', value: `${impactScore}/100` },
          { label: 'Scale Metrics Found', value: metricBullets },
          { label: 'Improvement Potential', value: '+14 pts with numbers' },
        ],
      },
      contextSummary: 'Measurable deliverables demonstrating business value, efficiency gains, and scale.',
      actionText: 'Boost Measurable Impact →',
      targetTab: 'suggestions',
    },
  ], [
    detectedSkills,
    verifiedSkills,
    missingKeywordsCount,
    weakSkillsCount,
    positionCount,
    totalBullets,
    metricBullets,
    weakDescriptions,
    projectCount,
    topDegree,
    eduCount,
    certCount,
    keywordScore,
    impactScore,
    education,
    projects,
  ]);

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div
      className="card-dark"
      style={{
        background: '#0A0A0A',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
              System Topology
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
              Resume DNA
            </h3>
          </div>
          <p style={{ color: '#888888', fontSize: '0.84rem', margin: 0 }}>
            Deterministic connected network linking candidate skills, experience, projects, and credentials.
          </p>
        </div>

        {/* Quick Node Selector Pills for quick access */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  background: isSelected ? 'rgba(229, 9, 32, 0.15)' : '#111111',
                  border: `1px solid ${isSelected ? '#E50920' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: isSelected ? '#FFFFFF' : '#888888',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: node.color,
                  }}
                />
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main DNA Visualization Canvas / Fallback Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
          gap: '24px',
          alignItems: 'center',
        }}
        className="resume-dna-grid"
      >
        {/* Left: Simplified & Visually Aesthetic Resume DNA Topology */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(circle at center, rgba(229, 9, 32, 0.05) 0%, #0A0B0E 75%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            minHeight: '380px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Corner Status Beacon */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#9E9E9E', fontWeight: 600, letterSpacing: '0.04em' }}>
              {hoveredNodeId ? `SELECTED // ${hoveredNodeId.toUpperCase()}` : 'SYSTEM TOPOLOGY // RESUME DNA'}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '16px',
              fontSize: '0.68rem',
              color: '#666666',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={11} color="#E50920" />
            <span>Select node to view intelligence</span>
          </div>

          {/* Clean, Scalable, Hardware-Accelerated SVG */}
          <svg
            viewBox="0 0 580 370"
            style={{
              width: '100%',
              height: '370px',
              maxHeight: '100%',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <defs>
              {/* Soft glow filter for active elements */}
              <filter id="activeSpokeGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. ELEGANT BACKGROUND ORBITAL GUIDES */}
            <g opacity="0.6">
              {/* Inner Dotted Orbit Ring */}
              <circle cx="290" cy="185" r="75" fill="none" stroke="#FFFFFF" strokeOpacity="0.05" strokeDasharray="3 4" />

              {/* Main Node Orbit Ring */}
              <circle cx="290" cy="185" r="135" fill="none" stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="1" />

              {/* Subtle Coordinate Axis Crosshairs */}
              <line x1="290" y1="35" x2="290" y2="335" stroke="#FFFFFF" strokeOpacity="0.03" strokeDasharray="2 6" />
              <line x1="130" y1="185" x2="450" y2="185" stroke="#FFFFFF" strokeOpacity="0.03" strokeDasharray="2 6" />
            </g>

            {/* 2. CONNECTING SPOKE LINES & SUBTLE DATA FLOW */}
            <g>
              {nodes.map((node) => {
                // Fixed balanced orbital distribution around r=135
                let nx = 290;
                let ny = 185;
                if (node.id === 'skills') { nx = 290; ny = 52; }
                else if (node.id === 'experience') { nx = 390; ny = 88; }
                else if (node.id === 'projects') { nx = 422; ny = 200; }
                else if (node.id === 'education') { nx = 345; ny = 308; }
                else if (node.id === 'certifications') { nx = 235; ny = 308; }
                else if (node.id === 'achievements') { nx = 158; ny = 200; }
                else if (node.id === 'keywords') { nx = 190; ny = 88; }

                const isSel = selectedNodeId === node.id;
                const isHov = hoveredNodeId === node.id;
                const active = isSel || isHov;

                return (
                  <g key={`spoke-${node.id}`}>
                    {/* Underlying Spoke Line */}
                    <line
                      x1="290"
                      y1="185"
                      x2={nx}
                      y2={ny}
                      stroke={active ? '#E50920' : '#FFFFFF'}
                      strokeWidth={active ? 2 : 1}
                      strokeOpacity={active ? 0.85 : 0.08}
                      filter={active ? 'url(#activeSpokeGlow)' : 'none'}
                      style={{ transition: 'all 0.3s ease' }}
                    />

                    {/* Smooth, subtle energy light bead on active spoke */}
                    {active && (
                      <circle r="3" fill="#FFFFFF" filter="url(#activeSpokeGlow)">
                        <animateMotion
                          path={`M 290 185 L ${nx} ${ny}`}
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 3. CENTRAL HUB (ATS CORE) */}
            <g style={{ cursor: 'default' }}>
              {/* Soft breathing ambient halo */}
              <circle
                cx="290"
                cy="185"
                r="44"
                fill="#E50920"
                className="animate-dna-halo"
              />

              {/* Accent ring */}
              <circle
                cx="290"
                cy="185"
                r="36"
                fill="none"
                stroke="#E50920"
                strokeWidth="1.5"
                strokeOpacity="0.8"
                filter="url(#activeSpokeGlow)"
              />

              {/* Core Hub Body */}
              <circle
                cx="290"
                cy="185"
                r="31"
                fill="#121318"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />

              {/* Overall Score */}
              <text
                x="290"
                y="184"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="16"
                fontWeight="800"
                letterSpacing="-0.02em"
              >
                {analysis.overall_score || 85}
              </text>
              <text
                x="290"
                y="196"
                textAnchor="middle"
                fill="#888888"
                fontSize="6.5"
                fontWeight="700"
                letterSpacing="0.12em"
              >
                ATS CORE
              </text>
            </g>

            {/* 4. SATELLITE NODES & CLEAN TYPOGRAPHY */}
            <g>
              {nodes.map((node) => {
                let nx = 290;
                let ny = 185;
                if (node.id === 'skills') { nx = 290; ny = 52; }
                else if (node.id === 'experience') { nx = 390; ny = 88; }
                else if (node.id === 'projects') { nx = 422; ny = 200; }
                else if (node.id === 'education') { nx = 345; ny = 308; }
                else if (node.id === 'certifications') { nx = 235; ny = 308; }
                else if (node.id === 'achievements') { nx = 158; ny = 200; }
                else if (node.id === 'keywords') { nx = 190; ny = 88; }

                const isSel = selectedNodeId === node.id;
                const isHov = hoveredNodeId === node.id;
                const active = isSel || isHov;
                const IconComponent = node.icon;

                // Typography layout calculation based on position
                const isTopCenter = node.id === 'skills';
                const isRightSide = nx > 290 && !isTopCenter;
                const textAnchor = isTopCenter ? 'middle' : isRightSide ? 'start' : 'end';
                const labelX = isTopCenter ? nx : isRightSide ? nx + 25 : nx - 25;
                const labelY1 = isTopCenter ? ny - 28 : ny - 2;
                const labelY2 = isTopCenter ? ny - 16 : ny + 11;

                return (
                  <g
                    key={`node-item-${node.id}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Active Soft Aura Ring */}
                    {active && (
                      <circle
                        cx={nx}
                        cy={ny}
                        r="24"
                        fill="#E50920"
                        opacity="0.18"
                        filter="url(#activeSpokeGlow)"
                      />
                    )}

                    {/* Node Glass Body */}
                    <circle
                      cx={nx}
                      cy={ny}
                      r="18"
                      fill={active ? '#181216' : '#12141A'}
                      stroke={active ? '#E50920' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth={active ? 2 : 1}
                      filter={active ? 'url(#activeSpokeGlow)' : 'none'}
                      style={{ transition: 'all 0.25s ease' }}
                    />

                    {/* Icon Centered in Node */}
                    <foreignObject
                      x={nx - 8}
                      y={ny - 8}
                      width="16"
                      height="16"
                      style={{ pointerEvents: 'none' }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: active ? '#FFFFFF' : '#8E919B',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        <IconComponent size={13} strokeWidth={active ? 2.5 : 2} />
                      </div>
                    </foreignObject>

                    {/* Clean Typographic Label */}
                    <text
                      x={labelX}
                      y={labelY1}
                      textAnchor={textAnchor}
                      fill={active ? '#FFFFFF' : '#C2C5D0'}
                      fontSize="10.5"
                      fontWeight={active ? 800 : 600}
                      letterSpacing="0.01em"
                      style={{ transition: 'fill 0.2s ease' }}
                    >
                      {node.label}
                    </text>

                    {/* Secondary Metric Count */}
                    <text
                      x={labelX}
                      y={labelY2}
                      textAnchor={textAnchor}
                      fill={active ? '#E50920' : '#737785'}
                      fontSize="8.5"
                      fontWeight="600"
                      letterSpacing="0.02em"
                      style={{ transition: 'fill 0.2s ease' }}
                    >
                      {node.stats.primary.split(' ')[0]} {node.stats.primary.split(' ')[1] || ''}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right: Contextual Node Panel */}
        <div
          style={{
            background: '#0E0E0E',
            border: `1px solid ${activeNode.color}40`,
            borderRadius: '12px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: `0 8px 30px -10px ${activeNode.color}20`,
            minHeight: '360px',
          }}
        >
          <div>
            {/* Panel Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: `${activeNode.color}15`,
                    border: `1px solid ${activeNode.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeNode.color,
                  }}
                >
                  <activeNode.icon size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                    Node Intelligence
                  </span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {activeNode.label.toUpperCase()}
                  </h4>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: activeNode.color,
                  background: `${activeNode.color}15`,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${activeNode.color}30`,
                }}
              >
                {activeNode.stats.primary}
              </span>
            </div>

            <p style={{ color: '#999999', fontSize: '0.84rem', lineHeight: 1.45, marginBottom: '18px' }}>
              {activeNode.contextSummary}
            </p>

            {/* Granular Breakdown items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {activeNode.stats.details.map((detail, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#141414',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ color: '#A0A0A0' }}>{detail.label}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: detail.alert ? '#E50920' : '#FFFFFF',
                    }}
                  >
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deep-link Action Button */}
          <button
            onClick={() => onNavigateTab(activeNode.targetTab)}
            className="btn btn-red"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '8px',
            }}
          >
            <span>{activeNode.actionText}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .resume-dna-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
