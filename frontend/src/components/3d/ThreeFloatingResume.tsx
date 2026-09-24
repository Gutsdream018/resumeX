import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Target, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface ThreeFloatingResumeProps {
  onCtaClick?: () => void;
}

export const ThreeFloatingResume: React.FC<ThreeFloatingResumeProps> = ({ onCtaClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const container = containerRef.current;
    if (!container || motionQuery.matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 420;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xff3b4e, 2.2);
    dirLight.position.set(5, 5, 4);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 10);
    pointLight.position.set(-4, -3, 3);
    scene.add(pointLight);

    // Main Floating Resume Group
    const resumeGroup = new THREE.Group();
    scene.add(resumeGroup);

    // 3D Card Plane (A4 Document Geometry)
    const cardWidth = 3.2;
    const cardHeight = 4.4;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight, 16, 16);

    // Canvas Texture for high-fidelity resume mockup
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    // Draw dark stylized document
    ctx.fillStyle = '#0F0F0F';
    ctx.fillRect(0, 0, 512, 700);

    // Header Crimson line
    ctx.fillStyle = '#E50920';
    ctx.fillRect(36, 40, 440, 4);

    // Candidate Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ALEXANDER MORGAN', 36, 80);

    ctx.fillStyle = '#888888';
    ctx.font = '13px sans-serif';
    ctx.fillText('Lead Systems & Cloud Engineer | Stanford MS', 36, 105);

    // Summary Section
    ctx.fillStyle = '#333333';
    ctx.fillRect(36, 135, 440, 1);

    ctx.fillStyle = '#B0B0B0';
    ctx.font = '12px sans-serif';
    ctx.fillText('• 7+ years architecting high-throughput distributed microservices.', 36, 160);
    ctx.fillText('• Scaled AWS infrastructure processing 10M+ daily events at p99 < 40ms.', 36, 185);

    // Skills Matrix Section
    ctx.fillStyle = '#333333';
    ctx.fillRect(36, 215, 440, 1);
    ctx.fillStyle = '#E50920';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CORE COMPETENCIES', 36, 238);

    // Skill pills
    const skills = ['React / TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS ECS', 'Kubernetes'];
    let xOffset = 36;
    let yOffset = 260;
    skills.forEach((sk) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(xOffset, yOffset, ctx.measureText(sk).width + 16, 22);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(xOffset, yOffset, ctx.measureText(sk).width + 16, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '11px sans-serif';
      ctx.fillText(sk, xOffset + 8, yOffset + 15);
      xOffset += ctx.measureText(sk).width + 24;
      if (xOffset > 400) {
        xOffset = 36;
        yOffset += 30;
      }
    });

    // Experience Section Mockup lines
    ctx.fillStyle = '#333333';
    ctx.fillRect(36, 340, 440, 1);
    ctx.fillStyle = '#E50920';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PROFESSIONAL EXPERIENCE', 36, 365);

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(36, 390 + i * 45, 180, 8);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(36, 405 + i * 45, 400, 6);
      ctx.fillRect(36, 417 + i * 45, 340, 6);
    }

    const cardTexture = new THREE.CanvasTexture(canvas);
    const cardMat = new THREE.MeshStandardMaterial({
      map: cardTexture,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    resumeGroup.add(cardMesh);

    // Glowing border frame around document
    const edges = new THREE.EdgesGeometry(cardGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xe50920, transparent: true, opacity: 0.7 });
    const edgeLine = new THREE.LineSegments(edges, edgeMat);
    resumeGroup.add(edgeLine);

    // Background floating particle cluster
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff3b4e,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let targetRotX = 0.08;
    let targetRotY = -0.15;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotX = y * 0.25;
      targetRotY = x * 0.35;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth floating oscillation
      resumeGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.12;
      resumeGroup.position.x = Math.cos(elapsedTime * 0.8) * 0.06;

      // Soft damping towards target mouse orientation
      resumeGroup.rotation.x += (targetRotX - resumeGroup.rotation.x) * 0.05;
      resumeGroup.rotation.y += (targetRotY - resumeGroup.rotation.y) * 0.05;

      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        height: '460px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* 2D Fallback if WebGL is disabled or reduced motion */}
      {(!hasWebGL || isReducedMotion) && (
        <div
          style={{
            zIndex: 1,
            width: '320px',
            height: '420px',
            background: '#111111',
            border: '1px solid #282828',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ width: '100%', height: '4px', background: '#E50920', borderRadius: '2px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>ALEXANDER MORGAN</div>
          <div style={{ fontSize: '0.78rem', color: '#888' }}>Lead Systems Engineer</div>
          <div style={{ height: '1px', background: '#222' }} />
          <div style={{ fontSize: '0.75rem', color: '#BBB', lineHeight: 1.5 }}>
            • 7+ years scaling high-throughput distributed microservices.
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {['TypeScript', 'AWS', 'Docker', 'PostgreSQL'].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  background: '#181818',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#EEE',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Floating 2D Intelligence Badges hovering around the 3D card */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '-5%',
          zIndex: 2,
          background: 'rgba(15, 15, 15, 0.88)',
          border: '1px solid rgba(229, 9, 32, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(229, 9, 32, 0.18)',
          animation: 'floatSlow 4s ease-in-out infinite',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FFFFFF' }}>ATS SCORE: 88</span>
        <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 700 }}>+14 pts</span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '16%',
          right: '-6%',
          zIndex: 2,
          background: 'rgba(15, 15, 15, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          animation: 'floatSlow 4.5s ease-in-out infinite 0.5s',
        }}
      >
        <Target size={14} color="#E50920" />
        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FFFFFF' }}>JOB MATCH: 94%</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '-10%',
          zIndex: 2,
          background: 'rgba(15, 15, 15, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          borderRadius: '10px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Sparkles size={12} color="#E50920" />
        <span style={{ fontSize: '0.7rem', color: '#DDD', fontWeight: 600 }}>0 Hallucinations</span>
      </div>

      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};
