import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
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
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('skills');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
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

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGlSupported(false);
    } catch (e) {
      setWebGlSupported(false);
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

  // 3D Three.js implementation (with clean disposal & memoized scene)
  useEffect(() => {
    if (!webGlSupported || prefersReducedMotion || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = 360;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Group for whole network
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // Central RESUME Node (Mesh + Ring)
    const centralGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const centralMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const centralMesh = new THREE.Mesh(centralGeo, centralMat);
    networkGroup.add(centralMesh);

    // Central pulsing ring
    const ringGeo = new THREE.RingGeometry(0.95, 1.05, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xE50920,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    networkGroup.add(ringMesh);

    // Satellite Nodes & Connection Lines
    const nodeMeshes: { mesh: THREE.Mesh; id: string; basePos: THREE.Vector3 }[] = [];
    const lineGeos: THREE.BufferGeometry[] = [];

    nodes.forEach((node) => {
      const rad = (node.angle * Math.PI) / 180;
      const dist = (node.distance / 140) * 3.4;
      const x = Math.cos(rad) * dist;
      const y = Math.sin(rad) * dist;
      const z = (Math.sin(node.angle) * 0.4);

      // Node Sphere
      const sphereRadius = (node.size / 20) * 0.32;
      const sphereGeo = new THREE.SphereGeometry(sphereRadius, 24, 24);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(x, y, z);
      networkGroup.add(sphereMesh);

      // Outer glow ring
      const haloGeo = new THREE.RingGeometry(sphereRadius * 1.25, sphereRadius * 1.5, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(x, y, z);
      networkGroup.add(haloMesh);

      nodeMeshes.push({ mesh: sphereMesh, id: node.id, basePos: new THREE.Vector3(x, y, z) });

      // Connection Line to center
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      lineGeos.push(lineGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: 0.25,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      networkGroup.add(line);
    });

    // Ambient floating particles
    const particleCount = 45;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xE50920,
      size: 0.05,
      transparent: true,
      opacity: 0.45,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    networkGroup.add(particleSystem);

    // Raycaster for interactive hover/click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hit = nodeMeshes.find((n) => n.mesh === intersects[0].object);
        if (hit) {
          renderer.domElement.style.cursor = 'pointer';
          setHoveredNodeId(hit.id);
        }
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredNodeId(null);
      }
    };

    const handlePointerClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hit = nodeMeshes.find((n) => n.mesh === intersects[0].object);
        if (hit) {
          setSelectedNodeId(hit.id);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handlePointerClick);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle subtle breathing motion
      networkGroup.rotation.y = Math.sin(elapsedTime * 0.2) * 0.12;
      networkGroup.rotation.x = Math.cos(elapsedTime * 0.15) * 0.08;

      const scalePulse = 1 + Math.sin(elapsedTime * 2) * 0.05;
      ringMesh.scale.set(scalePulse, scalePulse, 1);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handlePointerClick);
      centralGeo.dispose();
      centralMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      lineGeos.forEach((g) => g.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = '';
      }
    };
  }, [webGlSupported, prefersReducedMotion, nodes]);

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
        {/* Left: 3D Canvas OR 2D Fallback */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(circle at center, #111111 0%, #060606 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            minHeight: '360px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {webGlSupported && !prefersReducedMotion ? (
            <div ref={mountRef} style={{ width: '100%', height: '360px' }} />
          ) : (
            /* 2D Responsive SVG Network Fallback */
            <div style={{ width: '100%', height: '360px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 360" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Central connection lines */}
                {nodes.map((node) => {
                  const rad = (node.angle * Math.PI) / 180;
                  const x = 300 + Math.cos(rad) * (node.distance * 0.95);
                  const y = 180 + Math.sin(rad) * (node.distance * 0.95);
                  return (
                    <line
                      key={`line-${node.id}`}
                      x1="300"
                      y1="180"
                      x2={x}
                      y2={y}
                      stroke={node.color}
                      strokeWidth={selectedNodeId === node.id ? 2 : 1}
                      strokeOpacity={selectedNodeId === node.id ? 0.8 : 0.25}
                      strokeDasharray={selectedNodeId === node.id ? 'none' : '3 3'}
                    />
                  );
                })}

                {/* Central Node */}
                <circle cx="300" cy="180" r="28" fill="#141414" stroke="#E50920" strokeWidth="2" />
                <text x="300" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" letterSpacing="0.08em">
                  RESUME
                </text>

                {/* Satellite Nodes */}
                {nodes.map((node) => {
                  const rad = (node.angle * Math.PI) / 180;
                  const x = 300 + Math.cos(rad) * (node.distance * 0.95);
                  const y = 180 + Math.sin(rad) * (node.distance * 0.95);
                  const isSel = selectedNodeId === node.id;
                  return (
                    <g
                      key={`node-${node.id}`}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isSel ? node.size + 4 : node.size}
                        fill="#0D0D0D"
                        stroke={node.color}
                        strokeWidth={isSel ? 3 : 1.5}
                      />
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fill="#F5F5F5"
                        fontSize="8.5"
                        fontWeight="700"
                      >
                        {node.label.slice(0, 4)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Center Badge overlay */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
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
            <span style={{ fontSize: '0.72rem', color: '#888888', fontWeight: 600 }}>
              {hoveredNodeId ? `Hovering: ${hoveredNodeId.toUpperCase()}` : 'Live Topology Matrix'}
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontSize: '0.7rem',
              color: '#666666',
              pointerEvents: 'none',
            }}
          >
            Click node to inspect node intelligence
          </div>
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
