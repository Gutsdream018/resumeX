import React, { useEffect, useRef } from 'react';

/**
 * Configuration options for the AI Constellation Particle System & Shooting Stars.
 * Tailored for ResumeX: near-black backdrop, soft white/light-gray stars,
 * occasional subtle crimson red (#C1121F / #E31B2B) accents.
 */
export interface ParticleBackgroundConfig {
  desktopCount: number;
  laptopCount: number;
  tabletCount: number;
  mobileCount: number;
  crimsonRatio: number; // Fraction of particles that use the crimson theme accent
  mouseRadius: number;
  mouseRepelForce: number;
  connectionDistance: number;
  connectionMaxOpacity: number;
  burstParticleCount: number;
  ctaBoostRadius: number;

  // Shooting Star Configurations
  shootingStarEnabled: boolean;
  minDelay: number; // Min ms before next shooting star wave (e.g. 2500)
  maxDelay: number; // Max ms before next shooting star wave (e.g. 5000)
  minDuration: number; // Min flight duration in ms (e.g. 600)
  maxDuration: number; // Max flight duration in ms (e.g. 1100)
  minConcurrent: number; // Minimum simultaneous shooting stars (e.g. 2)
  maxConcurrent: number; // Maximum simultaneous shooting stars (e.g. 4)
  trailLength: number; // Length of the trailing tail in px (e.g. 120)
  opacity: number; // Peak opacity of the shooting star (e.g. 0.85)
}

const DEFAULT_CONFIG: ParticleBackgroundConfig = {
  desktopCount: 105,
  laptopCount: 82,
  tabletCount: 60,
  mobileCount: 42,
  crimsonRatio: 0.11, // ~11% crimson accent stars
  mouseRadius: 130,
  mouseRepelForce: 0.45,
  connectionDistance: 90,
  connectionMaxOpacity: 0.12,
  burstParticleCount: 8,
  ctaBoostRadius: 180,

  // Shooting Star defaults: 2 to 4 simultaneous shooting stars
  shootingStarEnabled: true,
  minDelay: 2500,
  maxDelay: 5000,
  minDuration: 650,
  maxDuration: 1150,
  minConcurrent: 2,
  maxConcurrent: 4,
  trailLength: 120,
  opacity: 0.85,
};

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  isCrimson: boolean;
  isHighlight: boolean;
  sparkTimer: number; // Transient brightening counter
  offsetX: number;
  offsetY: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isCrimson: boolean;
  alpha: number;
  decay: number;
}

interface ShootingStar {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  length: number;
  speed: number;
  angle: number;
  startTime: number;
  duration: number;
  peakOpacity: number;
  hasCrimsonTail: boolean;
  headRadius: number;
}

interface ParticleBackgroundProps {
  config?: Partial<ParticleBackgroundConfig>;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ config: customConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfg = { ...DEFAULT_CONFIG, ...customConfig };

  const mousePos = useRef<{ x: number; y: number; active: boolean }>({ x: -9999, y: -9999, active: false });
  const isHoveringCTA = useRef<boolean>(false);
  const reducedMotion = useRef<boolean>(false);
  const burstParticles = useRef<BurstParticle[]>([]);
  const shootingStars = useRef<ShootingStar[]>([]);
  const nextShootingStarTime = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check accessibility prefers-reduced-motion
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = motionMediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
      if (e.matches) {
        shootingStars.current = [];
        burstParticles.current = [];
      }
    };
    motionMediaQuery.addEventListener('change', handleMotionChange);

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    // Schedule the first shooting star to appear shortly after initial mount (1.5s - 3s)
    nextShootingStarTime.current = performance.now() + 1500 + Math.random() * 1500;

    const getTargetParticleCount = (w: number): number => {
      if (w > 1200) return cfg.desktopCount;
      if (w > 900) return cfg.laptopCount;
      if (w > 600) return cfg.tabletCount;
      return cfg.mobileCount;
    };

    const createParticle = (w: number, h: number): Particle => {
      const typeRoll = Math.random();
      let radius: number;
      let isHighlight = false;

      // Sizing distribution:
      // Tiny (1-2px): ~65%
      // Small (2-3px): ~25%
      // Occasional highlight (3-3.8px): ~10%
      if (typeRoll < 0.65) {
        radius = 0.75 + Math.random() * 0.75;
      } else if (typeRoll < 0.90) {
        radius = 1.3 + Math.random() * 0.5;
      } else {
        radius = 1.8 + Math.random() * 0.45;
        isHighlight = true;
      }

      // Slower, subtle drifting (0.04 - 0.16 px/frame)
      const speed = 0.04 + Math.random() * 0.12;
      const angle = Math.random() * Math.PI * 2;

      const x = Math.random() * w;
      const y = Math.random() * h;

      return {
        x,
        y,
        originX: x,
        originY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        baseOpacity: isHighlight ? 0.35 + Math.random() * 0.45 : 0.18 + Math.random() * 0.45,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.012 + Math.random() * 0.024,
        isCrimson: Math.random() < cfg.crimsonRatio,
        isHighlight,
        sparkTimer: 0,
        offsetX: 0,
        offsetY: 0,
      };
    };

    const initParticles = () => {
      const count = getTargetParticleCount(width);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(width, height));
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      // Cap devicePixelRatio to 2 to maintain steady 60 FPS on high-DPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse movement listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion.current) return;
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      mousePos.current.active = true;
    };

    const handleMouseLeave = () => {
      mousePos.current.active = false;
      mousePos.current.x = -9999;
      mousePos.current.y = -9999;
    };

    // Click burst on empty background
    const handleClick = (e: MouseEvent) => {
      if (reducedMotion.current) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Only trigger if clicking on backdrop or non-interactive space
      const isInteractive = Boolean(
        target.closest(
          'button, a, input, textarea, select, [role="button"], .card, .card-dark, .upload-card, nav, footer, .modal, [data-no-particle-burst]'
        )
      );

      if (isInteractive) return;

      const clickX = e.clientX;
      const clickY = e.clientY;

      // Spawn 6 to 9 tiny burst particles
      const count = Math.floor(5 + Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.9 + Math.random() * 2.1;
        burstParticles.current.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 0.8 + Math.random() * 1.4,
          isCrimson: Math.random() < 0.25, // 25% crimson sparks
          alpha: 0.85,
          decay: 0.022 + Math.random() * 0.018, // Fades completely in ~500-750ms
        });
      }
    };

    // CTA hover detection
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.btn-red, .btn-primary, button.btn, [data-cta="primary"]')) {
        isHoveringCTA.current = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.btn-red, .btn-primary, button.btn, [data-cta="primary"]')) {
        isHoveringCTA.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    // Spawn 2 to 4 Shooting Stars Simultaneously
    const spawnShootingStarsWave = (now: number) => {
      // Pick 2 to 4 simultaneous stars for this wave
      const count = Math.floor(
        cfg.minConcurrent + Math.random() * (cfg.maxConcurrent - cfg.minConcurrent + 1)
      );

      // Distinct spawn regions across the screen so they travel through different areas
      const regions: ('top-left' | 'top-right' | 'top-center' | 'left' | 'right')[] = [
        'top-left',
        'top-right',
        'top-center',
        'left',
        'right',
      ];
      // Shuffle regions
      for (let i = regions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [regions[i], regions[j]] = [regions[j], regions[i]];
      }

      for (let i = 0; i < count; i++) {
        if (shootingStars.current.length >= cfg.maxConcurrent + 2) break;

        const region = regions[i % regions.length];
        const duration = cfg.minDuration + Math.random() * (cfg.maxDuration - cfg.minDuration);
        const travelDist = 420 + Math.random() * 360; // 420px to 780px travel distance
        const speed = travelDist / duration;
        const length = cfg.trailLength * (0.8 + Math.random() * 0.4);
        const hasCrimsonTail = Math.random() < 0.35; // 35% subtle crimson tail
        const headRadius = 1.35 + Math.random() * 0.65;

        let startX: number;
        let startY: number;
        let angle: number;

        if (region === 'top-left') {
          startX = Math.random() * (width * 0.45);
          startY = -20 - Math.random() * 25;
          angle = Math.PI * (0.18 + Math.random() * 0.12); // diagonally down-right (~32° to 54°)
        } else if (region === 'top-right') {
          startX = width * 0.55 + Math.random() * (width * 0.45);
          startY = -20 - Math.random() * 25;
          angle = Math.PI * (0.70 + Math.random() * 0.12); // diagonally down-left (~126° to 148°)
        } else if (region === 'top-center') {
          startX = width * 0.3 + Math.random() * (width * 0.4);
          startY = -20 - Math.random() * 25;
          angle = Math.random() < 0.5
            ? Math.PI * (0.22 + Math.random() * 0.12)
            : Math.PI * (0.66 + Math.random() * 0.12);
        } else if (region === 'left') {
          startX = -20 - Math.random() * 15;
          startY = Math.random() * (height * 0.65);
          angle = Math.PI * (0.13 + Math.random() * 0.12); // down-right (~23° to 45°)
        } else {
          // right edge
          startX = width + 20 + Math.random() * 15;
          startY = Math.random() * (height * 0.65);
          angle = Math.PI * (0.75 + Math.random() * 0.12); // down-left (~135° to 157°)
        }

        // Natural micro-stagger between stars in the same wave (0 to 120ms) for an organic meteoric cascade
        const microStagger = i * (20 + Math.random() * 35);

        shootingStars.current.push({
          startX,
          startY,
          currentX: startX,
          currentY: startY,
          length,
          speed,
          angle,
          startTime: now + microStagger,
          duration,
          peakOpacity: cfg.opacity * (0.85 + Math.random() * 0.15),
          hasCrimsonTail,
          headRadius,
        });
      }

      // Schedule next wave (2.5s–5.0s)
      nextShootingStarTime.current = now + cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
    };

    // Main Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isMotionReduced = reducedMotion.current;
      const mouse = mousePos.current;
      const hoveringCTA = isHoveringCTA.current;
      const now = performance.now();

      // 1. Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!isMotionReduced) {
          // Drifting
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges smoothly
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Twinkle oscillation
          p.twinklePhase += p.twinkleSpeed;

          // Subtle Mouse Reaction (Gentle repulsion / displacement)
          let targetOffsetX = 0;
          let targetOffsetY = 0;

          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const radius = hoveringCTA ? cfg.ctaBoostRadius : cfg.mouseRadius;

            if (distSq < radius * radius && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / radius) * cfg.mouseRepelForce * 18;
              targetOffsetX = (dx / dist) * force;
              targetOffsetY = (dy / dist) * force;
            }
          }

          // Spring damp offsets for ultra-smooth movement
          p.offsetX += (targetOffsetX - p.offsetX) * 0.08;
          p.offsetY += (targetOffsetY - p.offsetY) * 0.08;

          // Occasional subtle transient spark (briefly brighten and fade)
          if (p.sparkTimer > 0) {
            p.sparkTimer -= 1;
          } else if (Math.random() < 0.001) {
            // ~0.1% chance per frame to spark
            p.sparkTimer = 45; // ~750ms spark
          }
        }

        // Calculate final opacity
        const twinkleFactor = Math.sin(p.twinklePhase) * 0.25;
        let opacity = Math.max(0.08, Math.min(0.95, p.baseOpacity + twinkleFactor));

        // Spark boost
        if (p.sparkTimer > 0) {
          const sparkFactor = Math.sin((p.sparkTimer / 45) * Math.PI);
          opacity = Math.min(1.0, opacity + sparkFactor * 0.45);
        }

        // CTA Hover brightness boost if near cursor
        if (hoveringCTA && mouse.active) {
          const dx = p.x + p.offsetX - mouse.x;
          const dy = p.y + p.offsetY - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < cfg.ctaBoostRadius * cfg.ctaBoostRadius) {
            const dist = Math.sqrt(distSq);
            const boost = (1 - dist / cfg.ctaBoostRadius) * 0.35;
            opacity = Math.min(1.0, opacity + boost);
          }
        }

        const renderX = p.x + p.offsetX;
        const renderY = p.y + p.offsetY;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2);

        if (p.isCrimson) {
          ctx.fillStyle = `rgba(227, 27, 43, ${opacity.toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(235, 238, 245, ${opacity.toFixed(3)})`;
        }
        ctx.fill();

        // Subtle soft glow halo for highlights or active sparks
        if ((p.isHighlight || p.sparkTimer > 0) && opacity > 0.45) {
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.radius * 2.2, 0, Math.PI * 2);
          if (p.isCrimson) {
            ctx.fillStyle = `rgba(227, 27, 43, ${(opacity * 0.22).toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${(opacity * 0.18).toFixed(3)})`;
          }
          ctx.fill();
        }
      }

      // 2. Subtle Constellation Connections (only near the cursor)
      if (!isMotionReduced && mouse.active) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          const p1X = p1.x + p1.offsetX;
          const p1Y = p1.y + p1.offsetY;

          // Only calculate if p1 is near the mouse
          const dxMouse = p1X - mouse.x;
          const dyMouse = p1Y - mouse.y;
          if (dxMouse * dxMouse + dyMouse * dyMouse > cfg.mouseRadius * cfg.mouseRadius) {
            continue;
          }

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const p2X = p2.x + p2.offsetX;
            const p2Y = p2.y + p2.offsetY;

            const dx = p1X - p2X;
            const dy = p1Y - p2Y;
            const distSq = dx * dx + dy * dy;

            if (distSq < cfg.connectionDistance * cfg.connectionDistance) {
              const dist = Math.sqrt(distSq);
              const mouseDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
              const mouseFade = 1 - mouseDist / cfg.mouseRadius;
              const lineFade = (1 - dist / cfg.connectionDistance) * mouseFade;

              const lineOpacity = Math.max(0, Math.min(cfg.connectionMaxOpacity, lineFade * cfg.connectionMaxOpacity));

              if (lineOpacity > 0.01) {
                ctx.beginPath();
                ctx.moveTo(p1X, p1Y);
                ctx.lineTo(p2X, p2Y);
                if (p1.isCrimson || p2.isCrimson) {
                  ctx.strokeStyle = `rgba(227, 27, 43, ${lineOpacity.toFixed(3)})`;
                } else {
                  ctx.strokeStyle = `rgba(240, 240, 245, ${lineOpacity.toFixed(3)})`;
                }
                ctx.lineWidth = 0.65;
                ctx.stroke();
              }
            }
          }
        }
      }

      // 3. Render Click Bursts
      if (!isMotionReduced && burstParticles.current.length > 0) {
        for (let i = burstParticles.current.length - 1; i >= 0; i--) {
          const bp = burstParticles.current[i];
          bp.x += bp.vx;
          bp.y += bp.vy;
          bp.vx *= 0.94; // Decelerate gently
          bp.vy *= 0.94;
          bp.alpha -= bp.decay;

          if (bp.alpha <= 0.02) {
            burstParticles.current.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
          if (bp.isCrimson) {
            ctx.fillStyle = `rgba(227, 27, 43, ${bp.alpha.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(245, 245, 250, ${bp.alpha.toFixed(3)})`;
          }
          ctx.fill();
        }
      }

      // 4. Render Rare Shooting Stars
      if (cfg.shootingStarEnabled && !isMotionReduced) {
        // Spawn trigger check
        if (now >= nextShootingStarTime.current) {
          spawnShootingStarsWave(now);
        }

        for (let i = shootingStars.current.length - 1; i >= 0; i--) {
          const star = shootingStars.current[i];
          const elapsed = now - star.startTime;

          // If star is micro-staggered and hasn't launched yet, skip for this frame
          if (elapsed < 0) {
            continue;
          }

          if (elapsed >= star.duration) {
            shootingStars.current.splice(i, 1);
            continue;
          }

          const progress = elapsed / star.duration;
          star.currentX = star.startX + Math.cos(star.angle) * (star.speed * elapsed);
          star.currentY = star.startY + Math.sin(star.angle) * (star.speed * elapsed);

          // Fast fade-in (first 18%), hold, smooth fade-out (last 32%)
          let alpha = star.peakOpacity;
          if (progress < 0.18) {
            alpha = (progress / 0.18) * star.peakOpacity;
          } else if (progress > 0.68) {
            alpha = (1 - (progress - 0.68) / 0.32) * star.peakOpacity;
          }
          alpha = Math.max(0, Math.min(1, alpha));

          if (alpha <= 0.01) continue;

          // Tail extends backwards along star.angle
          const tailX = star.currentX - Math.cos(star.angle) * star.length;
          const tailY = star.currentY - Math.sin(star.angle) * star.length;

          // Soft fading linear gradient trail along the line of flight
          const trailGrad = ctx.createLinearGradient(tailX, tailY, star.currentX, star.currentY);
          if (star.hasCrimsonTail) {
            trailGrad.addColorStop(0, 'rgba(227, 27, 43, 0)');
            trailGrad.addColorStop(0.35, `rgba(227, 27, 43, ${(alpha * 0.35).toFixed(3)})`);
            trailGrad.addColorStop(0.75, `rgba(255, 235, 240, ${(alpha * 0.75).toFixed(3)})`);
            trailGrad.addColorStop(1, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
          } else {
            trailGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            trailGrad.addColorStop(0.35, `rgba(220, 225, 240, ${(alpha * 0.22).toFixed(3)})`);
            trailGrad.addColorStop(0.75, `rgba(245, 248, 255, ${(alpha * 0.7).toFixed(3)})`);
            trailGrad.addColorStop(1, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
          }

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.currentX, star.currentY);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = 1.35;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Bright star head
          ctx.beginPath();
          ctx.arc(star.currentX, star.currentY, star.headRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
          ctx.fill();

          // Delicate head micro-glow
          ctx.beginPath();
          ctx.arc(star.currentX, star.currentY, star.headRadius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = star.hasCrimsonTail
            ? `rgba(227, 27, 43, ${(alpha * 0.25).toFixed(3)})`
            : `rgba(255, 255, 255, ${(alpha * 0.2).toFixed(3)})`;
          ctx.fill();
        }
      }

      // Next frame
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [
    cfg.desktopCount,
    cfg.laptopCount,
    cfg.tabletCount,
    cfg.mobileCount,
    cfg.crimsonRatio,
    cfg.mouseRadius,
    cfg.mouseRepelForce,
    cfg.connectionDistance,
    cfg.connectionMaxOpacity,
    cfg.burstParticleCount,
    cfg.ctaBoostRadius,
    cfg.shootingStarEnabled,
    cfg.minDelay,
    cfg.maxDelay,
    cfg.minDuration,
    cfg.maxDuration,
    cfg.minConcurrent,
    cfg.maxConcurrent,
    cfg.trailLength,
    cfg.opacity,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        display: 'block',
      }}
    />
  );
};
export default ParticleBackground;
