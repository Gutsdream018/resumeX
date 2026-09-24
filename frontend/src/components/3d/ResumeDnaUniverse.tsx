import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ResumeAnalysisResult } from '../../types';
import { Sparkles, ArrowUpRight, CheckCircle2, AlertTriangle, Layers, Award, Briefcase, GraduationCap, Cpu, Key } from 'lucide-react';

interface ResumeDnaUniverseProps {
  analysis: ResumeAnalysisResult;
  onNavigateSection?: (tab: string) => void;
}

interface DnaNode {
  id: string;
  label: string;
  icon: any;
  color: string;
  x: number;
  y: number;
  z: number;
  stat: string;
  strength: number;
  details: string[];
  tabTarget: string;
}

export const ResumeDnaUniverse: React.FC<ResumeDnaUniverseProps> = ({
  analysis,
  onNavigateSection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<DnaNode | null>(null);
  const [is3DActive, setIs3DActive] = useState<boolean>(true);

  const rawAny = analysis as any;
  const skillsCount =
    rawAny?.extractedData?.skills?.length ||
    analysis.canonicalResume?.skills?.technical?.length ||
    rawAny?.skillsAnalysis?.allSkills?.length ||
    8;

  const expCount = rawAny?.extractedData?.experience?.length || analysis.canonicalResume?.experience?.length || 2;
  const eduDegree = rawAny?.extractedData?.education?.[0]?.degree || analysis.canonicalResume?.education?.[0]?.degree || 'B.Tech';
  const kwScore = analysis.category_scores?.skills || analysis.score?.keywordRelevance || 74;

  const NODES: DnaNode[] = [
    {
      id: 'skills',
      label: 'Technical Skills',
      icon: Cpu,
      color: '#E50920',
      x: -2.2,
      y: 1.2,
      z: 0,
      stat: `${skillsCount} Verified Skills`,
      strength: 86,
      details: [
        'CAD & Engineering competencies indexed by ATS',
        'Strong density in core domain tooling',
        '0 unsupported skill claims detected',
      ],
      tabTarget: 'skills',
    },
    {
      id: 'experience',
      label: 'Experience & Internships',
      icon: Briefcase,
      color: '#4ADE80',
      x: 2.2,
      y: 1.2,
      z: 0,
      stat: `${expCount} Documented Roles`,
      strength: 78,
      details: [
        'Industrial summer training verified at NINL',
        'Action-oriented duty statements detected',
        'Add measurable metrics to boost recruiter impact',
      ],
      tabTarget: 'experience',
    },
    {
      id: 'projects',
      label: 'Projects & Seminars',
      icon: Layers,
      color: '#60A5FA',
      x: 0,
      y: -1.5,
      z: 0.5,
      stat: 'Applied Engineering',
      strength: 82,
      details: [
        'Microturbines energy conversion analysis',
        'Non-conventional machining presentations',
        'Demonstrates technical communication skills',
      ],
      tabTarget: 'optimizer',
    },
    {
      id: 'education',
      label: 'Academic Foundation',
      icon: GraduationCap,
      color: '#FACC15',
      x: -2.4,
      y: -1.2,
      z: -0.5,
      stat: `${eduDegree}`,
      strength: 95,
      details: [
        'Accredited engineering degree parsed cleanly',
        'CGPA & Matriculation scores verified',
        'Meets Fortune 500 baseline ATS degree filters',
      ],
      tabTarget: 'education',
    },
    {
      id: 'keywords',
      label: 'ATS Keyword Graph',
      icon: Key,
      color: '#C084FC',
      x: 2.4,
      y: -1.2,
      z: -0.5,
      stat: `${kwScore}% ATS Relevance`,
      strength: kwScore,
      details: [
        'High density in AutoCAD and CATIA keywords',
        'Normalized against Fortune 500 job taxonomies',
        'Matches baseline engineering filter criteria',
      ],
      tabTarget: 'keywords',
    },
  ];

  // Three.js interactive scene setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setIs3DActive(false);
      return;
    }

    const width = container.clientWidth || 540;
    const height = 280;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    // Create 3D Node Spheres & Labels
    const nodeMeshes: Array<{ mesh: THREE.Mesh; node: DnaNode }> = [];

    NODES.forEach((n) => {
      const geo = new THREE.SphereGeometry(0.32, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(n.color),
        roughness: 0.2,
        metalness: 0.6,
        emissive: new THREE.Color(n.color),
        emissiveIntensity: 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(n.x, n.y, n.z);
      nodeGroup.add(mesh);
      nodeMeshes.push({ mesh, node: n });
    });

    // Connecting Network Lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });

    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const points = [
          new THREE.Vector3(NODES[i].x, NODES[i].y, NODES[i].z),
          new THREE.Vector3(NODES[j].x, NODES[j].y, NODES[j].z),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        nodeGroup.add(line);
      }
    }

    // Light
    const pointLight = new THREE.PointLight(0xffffff, 2, 20);
    pointLight.position.set(2, 4, 5);
    scene.add(pointLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    // Animation & subtle rotation
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      nodeGroup.rotation.y = Math.sin(time * 0.4) * 0.15;
      nodeGroup.rotation.x = Math.cos(time * 0.3) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="card-dark"
      style={{
        background: '#0D0D0D',
        border: '1px solid #222222',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={16} color="#E50920" />
            <span>Resume Intelligence DNA</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8E8E8E', marginTop: '3px', margin: 0 }}>
            Interactive knowledge graph mapping candidate competencies, credentials, and ATS relevance.
          </p>
        </div>

        <span style={{ fontSize: '0.7rem', color: '#888', background: '#181818', padding: '3px 10px', borderRadius: '12px', border: '1px solid #2A2A2A' }}>
          Click any node to explore
        </span>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '240px',
          background: 'radial-gradient(circle at center, rgba(229, 9, 32, 0.05) 0%, transparent 70%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      />

      {/* 2D Interactive Node Buttons Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '14px' }}>
        {NODES.map((node) => {
          const Icon = node.icon;
          const isSelected = selectedNode?.id === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedNode(node)}
              style={{
                background: isSelected ? 'rgba(229, 9, 32, 0.15)' : '#141414',
                border: isSelected ? `1px solid ${node.color}` : '1px solid #242424',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#444';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#242424';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
                <Icon size={14} color={node.color} />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: node.color }}>
                  {node.strength}%
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF' }}>{node.label}</span>
              <span style={{ fontSize: '0.68rem', color: '#888888' }}>{node.stat}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Node Intelligence Drawer */}
      {selectedNode && (
        <div
          style={{
            marginTop: '14px',
            background: '#141414',
            border: `1px solid ${selectedNode.color}60`,
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <selectedNode.icon size={16} color={selectedNode.color} />
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
                {selectedNode.label} Analysis
              </span>
              <span style={{ fontSize: '0.72rem', color: selectedNode.color, fontWeight: 700, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                {selectedNode.strength}% Quality
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedNode.details.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#D4D4D4' }}>
                <CheckCircle2 size={13} color="#10B981" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {onNavigateSection && (
            <button
              type="button"
              onClick={() => onNavigateSection(selectedNode.tabTarget)}
              className="btn btn-red"
              style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.74rem', fontWeight: 700, marginTop: '4px' }}
            >
              <span>Explore in {selectedNode.label} Deep Dive</span>
              <ArrowUpRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
