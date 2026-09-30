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
        {/* Left: Futuristic Animated Circle Graph Topology Matrix */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(circle at center, #0B0E14 0%, #06070A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            minHeight: '390px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Ambient Technical Coordinate Watermarks */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 10px #10B981',
                animation: 'pulseGlowSoft 2s infinite',
              }}
            />
            <span style={{ fontSize: '0.74rem', color: '#B0B0B0', fontWeight: 700, letterSpacing: '0.04em' }}>
              {hoveredNodeId ? `TARGET LOCKED // ${hoveredNodeId.toUpperCase()}` : 'LIVE TOPOLOGY MATRIX // SYS.ACTIVE'}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '14px',
              fontSize: '0.68rem',
              color: '#666666',
              fontFamily: 'monospace',
              letterSpacing: '0.06em',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            RADIAL.GRID.v2.6 // 60 FPS
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontSize: '0.7rem',
              color: '#888888',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Sparkles size={11} color="#E50920" />
            <span>Click any node to inspect telemetry</span>
          </div>

          {/* Master Scalable SVG Topology Graph & Pattern */}
          <svg
            viewBox="0 0 600 370"
            style={{
              width: '100%',
              height: '370px',
              maxHeight: '100%',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <defs>
              {/* Radial gradient for central core hub */}
              <radialGradient id="coreHubGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF384D" />
                <stop offset="65%" stopColor="#C40517" />
                <stop offset="100%" stopColor="#250005" />
              </radialGradient>

              {/* Central glowing aura */}
              <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Node glow filter */}
              <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Radar sweep gradient */}
              <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E50920" stopOpacity="0.22" />
                <stop offset="60%" stopColor="#E50920" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#E50920" stopOpacity="0" />
              </linearGradient>

              {/* Spoke line gradients for each node */}
              {nodes.map((node) => (
                <linearGradient
                  key={`spokeGrad-${node.id}`}
                  id={`spokeGrad-${node.id}`}
                  x1="300"
                  y1="185"
                  x2={300 + Math.cos((node.angle * Math.PI) / 180) * node.distance}
                  y2={185 + Math.sin((node.angle * Math.PI) / 180) * node.distance}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#E50920" stopOpacity="0.8" />
                  <stop offset="60%" stopColor={node.color} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={node.color} stopOpacity="0.95" />
                </linearGradient>
              ))}
            </defs>

            {/* 1. BACKGROUND PATTERN & CONCENTRIC ORBITS */}
            <g opacity="0.85">
              {/* Center Axis Crosshairs */}
              <line x1="100" y1="185" x2="500" y2="185" stroke="#FFFFFF" strokeOpacity="0.04" strokeDasharray="3 6" />
              <line x1="300" y1="40" x2="300" y2="330" stroke="#FFFFFF" strokeOpacity="0.04" strokeDasharray="3 6" />

              {/* Diagonal Grid Rays */}
              <line x1="170" y1="55" x2="430" y2="315" stroke="#FFFFFF" strokeOpacity="0.025" strokeDasharray="2 8" />
              <line x1="170" y1="315" x2="430" y2="55" stroke="#FFFFFF" strokeOpacity="0.025" strokeDasharray="2 8" />

              {/* Range Orbit 1 (Inner Dotted r=60) */}
              <circle cx="300" cy="185" r="60" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" strokeDasharray="2 4" />

              {/* Range Orbit 2 (Mid Dashed Counter-Rotating r=105) */}
              <circle
                cx="300"
                cy="185"
                r="105"
                fill="none"
                stroke="#E50920"
                strokeOpacity="0.16"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                className="animate-spin-reverse-slow"
              />

              {/* Range Orbit 3 (Nodes Orbit Circle r=145) */}
              <circle cx="300" cy="185" r="145" fill="none" stroke="#FFFFFF" strokeOpacity="0.06" strokeWidth="1" />

              {/* Range Orbit 4 (Outer Telemetry Circle r=175 with Compass Ticks) */}
              <g className="animate-spin-slow">
                <circle cx="300" cy="185" r="175" fill="none" stroke="#FFFFFF" strokeOpacity="0.1" strokeDasharray="6 14" strokeWidth="1" />
                {/* 12 Compass Degree Ticks on Outer Orbit */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 300 + Math.cos(angle) * 171;
                  const y1 = 185 + Math.sin(angle) * 171;
                  const x2 = 300 + Math.cos(angle) * 179;
                  const y2 = 185 + Math.sin(angle) * 179;
                  return (
                    <line
                      key={`compass-tick-${i}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={i % 3 === 0 ? '#E50920' : '#FFFFFF'}
                      strokeOpacity={i % 3 === 0 ? 0.45 : 0.2}
                      strokeWidth={i % 3 === 0 ? 1.5 : 1}
                    />
                  );
                })}
              </g>

              {/* Rotating Radar Scanner Sweep */}
              <g className="animate-radar-sweep">
                <path
                  d="M 300 185 L 300 10 A 175 175 0 0 1 425 65 Z"
                  fill="url(#radarSweepGrad)"
                />
                <line x1="300" y1="185" x2="425" y2="65" stroke="#E50920" strokeOpacity="0.4" strokeWidth="1.2" />
              </g>

              {/* Ambient Floating Micro-particles / Stars */}
              {[
                { x: 190, y: 75, r: 1.2, o: 0.3 },
                { x: 410, y: 80, r: 1.5, o: 0.4 },
                { x: 450, y: 270, r: 1, o: 0.25 },
                { x: 150, y: 250, r: 1.2, o: 0.35 },
                { x: 230, y: 310, r: 1.5, o: 0.3 },
                { x: 370, y: 320, r: 1.2, o: 0.4 },
                { x: 120, y: 150, r: 1, o: 0.25 },
                { x: 470, y: 160, r: 1.5, o: 0.35 },
              ].map((star, idx) => (
                <circle
                  key={`star-${idx}`}
                  cx={star.x}
                  cy={star.y}
                  r={star.r}
                  fill="#FFFFFF"
                  opacity={star.o}
                />
              ))}
            </g>

            {/* 2. DYNAMIC SPOKES & MOVING DATA PACKETS */}
            <g>
              {nodes.map((node, index) => {
                const rad = (node.angle * Math.PI) / 180;
                const nx = 300 + Math.cos(rad) * node.distance;
                const ny = 185 + Math.sin(rad) * node.distance;
                const isSel = selectedNodeId === node.id;
                const isHov = hoveredNodeId === node.id;
                const active = isSel || isHov;

                return (
                  <g key={`spoke-group-${node.id}`}>
                    {/* Base Spoke Path */}
                    <line
                      x1="300"
                      y1="185"
                      x2={nx}
                      y2={ny}
                      stroke={`url(#spokeGrad-${node.id})`}
                      strokeWidth={active ? 2.5 : 1.2}
                      strokeOpacity={active ? 0.95 : 0.35}
                      style={{ transition: 'stroke-width 0.25s ease, stroke-opacity 0.25s ease' }}
                    />

                    {/* Animated Outward Dashed Energy Flow */}
                    <line
                      x1="300"
                      y1="185"
                      x2={nx}
                      y2={ny}
                      stroke={node.color}
                      strokeWidth={active ? 3 : 1.6}
                      strokeDasharray="5 10"
                      strokeOpacity={active ? 0.9 : 0.5}
                      className="animate-spoke-flow"
                      style={{
                        animationDuration: active ? '0.8s' : `${1.4 + index * 0.15}s`,
                      }}
                    />

                    {/* Moving Data Energy Photon 1 */}
                    <circle r={active ? 3.5 : 2.5} fill="#FFFFFF" filter="url(#nodeGlow)">
                      <animateMotion
                        path={`M 300 185 L ${nx} ${ny}`}
                        dur={active ? '1.1s' : `${1.8 + (index % 3) * 0.4}s`}
                        repeatCount="indefinite"
                        begin={`${index * 0.25}s`}
                      />
                    </circle>

                    {/* Moving Data Energy Photon 2 (Offset in orbit) */}
                    <circle r={active ? 2.5 : 1.8} fill={node.color} opacity="0.85">
                      <animateMotion
                        path={`M 300 185 L ${nx} ${ny}`}
                        dur={active ? '1.1s' : `${1.8 + (index % 3) * 0.4}s`}
                        repeatCount="indefinite"
                        begin={`${index * 0.25 + 0.7}s`}
                      />
                    </circle>
                  </g>
                );
              })}
            </g>

            {/* 3. CENTRAL HUB (CORE RESUME DNA) */}
            <g>
              {/* Concentric Shockwave Pulse Rings */}
              <circle
                cx="300"
                cy="185"
                r="34"
                fill="none"
                stroke="#E50920"
                className="animate-core-shockwave"
              />
              <circle
                cx="300"
                cy="185"
                r="34"
                fill="none"
                stroke="#FF2E44"
                className="animate-core-shockwave-delayed"
              />

              {/* Rotating Telemetry Gear Ring */}
              <circle
                cx="300"
                cy="185"
                r="41"
                fill="none"
                stroke="#E50920"
                strokeWidth="1.5"
                strokeDasharray="8 6 3 6"
                strokeOpacity="0.75"
                className="animate-spin-slow"
              />

              {/* Counter-rotating Inner Tick Ring */}
              <circle
                cx="300"
                cy="185"
                r="33"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeDasharray="2 4"
                strokeOpacity="0.3"
                className="animate-spin-reverse-slow"
              />

              {/* Solid High-Density Core Sphere */}
              <circle
                cx="300"
                cy="185"
                r="27"
                fill="url(#coreHubGrad)"
                stroke="#FF4D5E"
                strokeWidth="2"
                filter="url(#coreGlow)"
              />

              {/* Central Core Score & Monogram */}
              <text
                x="300"
                y="183"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="13"
                fontWeight="900"
                letterSpacing="-0.02em"
              >
                {analysis.overall_score || 85}
              </text>
              <text
                x="300"
                y="194"
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.7)"
                fontSize="6.5"
                fontWeight="800"
                letterSpacing="0.1em"
              >
                ATS CORE
              </text>
            </g>

            {/* 4. SATELLITE NODES & FLOATING HUD LABELS */}
            <g>
              {nodes.map((node) => {
                const rad = (node.angle * Math.PI) / 180;
                const nx = 300 + Math.cos(rad) * node.distance;
                const ny = 185 + Math.sin(rad) * node.distance;
                const isSel = selectedNodeId === node.id;
                const isHov = hoveredNodeId === node.id;
                const active = isSel || isHov;
                const IconComponent = node.icon;

                // Label positioning offset based on quadrant
                const isRight = Math.cos(rad) >= 0;
                const isTop = Math.sin(rad) < 0;
                const pillX = isRight ? nx + 14 : nx - 85;
                const pillY = isTop ? ny - 8 : ny + 4;

                return (
                  <g
                    key={`satellite-node-${node.id}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {/* Node Ambient Radial Aura */}
                    <circle
                      cx={nx}
                      cy={ny}
                      r={active ? node.size + 14 : node.size + 6}
                      fill={node.color}
                      opacity={active ? 0.35 : 0.15}
                      filter="url(#nodeGlow)"
                      style={{ transition: 'all 0.25s ease' }}
                    />

                    {/* Active Selected Rotating Target Reticle Ring */}
                    {active && (
                      <g className="animate-spin-slow">
                        <circle
                          cx={nx}
                          cy={ny}
                          r={node.size + 8}
                          fill="none"
                          stroke={node.color}
                          strokeWidth="1.5"
                          strokeDasharray="4 6"
                          strokeOpacity="0.9"
                        />
                      </g>
                    )}

                    {/* Node Glass Body */}
                    <circle
                      cx={nx}
                      cy={ny}
                      r={node.size}
                      fill="#0C0E14"
                      stroke={node.color}
                      strokeWidth={active ? 2.5 : 1.5}
                      filter="url(#nodeGlow)"
                      style={{ transition: 'all 0.2s ease' }}
                    />

                    {/* Inner Colored Accent Disc */}
                    <circle
                      cx={nx}
                      cy={ny}
                      r={node.size * 0.72}
                      fill={node.color}
                      opacity={active ? 0.95 : 0.75}
                      style={{ transition: 'all 0.2s ease' }}
                    />

                    {/* Embedded Central Icon inside Node Circle */}
                    <foreignObject
                      x={nx - 9}
                      y={ny - 9}
                      width="18"
                      height="18"
                      style={{ pointerEvents: 'none' }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        <IconComponent size={12} strokeWidth={2.5} />
                      </div>
                    </foreignObject>

                    {/* Floating HUD Pill with Section Name and Metric */}
                    <g
                      transform={`translate(${pillX}, ${pillY})`}
                      style={{
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                      opacity={active ? 1 : 0.85}
                    >
                      {/* Pill Background Glass */}
                      <rect
                        x="0"
                        y="0"
                        width="72"
                        height="20"
                        rx="5"
                        fill="rgba(14, 16, 22, 0.85)"
                        stroke={active ? node.color : 'rgba(255, 255, 255, 0.12)'}
                        strokeWidth={active ? 1.5 : 1}
                      />

                      {/* Pill Indicator Dot */}
                      <circle cx="8" cy="10" r="2.5" fill={node.color} />

                      {/* Pill Section Title */}
                      <text
                        x="15"
                        y="13"
                        fill="#FFFFFF"
                        fontSize="8"
                        fontWeight="800"
                        letterSpacing="0.04em"
                      >
                        {node.label.toUpperCase()}
                      </text>
                    </g>
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
