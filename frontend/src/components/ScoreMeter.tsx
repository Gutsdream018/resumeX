import React, { useState, useEffect, useRef } from 'react';

export interface ScoreMeterProps {
  score: number; // 0 to 100
  previousScore?: number;
  size?: number; // width & height in px
  label?: string;
  showSublabel?: boolean;
  animateOnMount?: boolean;
  delta?: number | string; // e.g. "+10" or 10
  statusText?: string;
  showStatusPill?: boolean;
  glow?: boolean;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  previousScore,
  size = 140,
  label = 'ATS Score',
  showSublabel = true,
  animateOnMount = true,
  delta,
  statusText,
  showStatusPill = true,
  glow = true,
}) => {
  const initialValue = previousScore !== undefined ? previousScore : animateOnMount ? 0 : score;
  const [displayScore, setDisplayScore] = useState<number>(initialValue);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const prevScoreRef = useRef<number>(initialValue);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1100; // 1.1s fluid spring-like count-up
    const startValue = prevScoreRef.current;
    const endValue = score;

    setIsAnimating(true);

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);

      setDisplayScore(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
        prevScoreRef.current = endValue;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [score]);

  // Determine stroke color tailored to ATS score standards
  const getStrokeColor = (val: number) => {
    if (val >= 90) return '#34d399'; // Mint Green (Elite / Shortlist top tier)
    if (val >= 78) return '#10b981'; // Emerald (Strong)
    if (val >= 65) return '#f59e0b'; // Amber (Average / Action Needed)
    return '#e31b2b'; // Crimson Red (Critical Red Flags)
  };

  const clampedScore = Math.min(100, Math.max(0, displayScore));
  const strokeColor = getStrokeColor(clampedScore);

  // Calculate coordinates for the live moving tip beacon (tip of the arc)
  // SVG circle starts at (18, 2.0845) which is top (-90 degrees)
  const angleDeg = (clampedScore / 100) * 360 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const r = 15.9155;
  const cx = 18 + r * Math.cos(angleRad);
  const cy = 18 + r * Math.sin(angleRad);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        maxWidth: '100%',
      }}
    >
      {/* Floating Delta Badge if provided */}
      {delta !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-6px',
            zIndex: 10,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
            color: '#FFFFFF',
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.02em',
            animation: 'score-delta-bounce 1.6s ease-in-out infinite alternate',
          }}
        >
          {typeof delta === 'number' && delta > 0 ? `+${delta} PTS` : `${delta}`}
        </div>
      )}

      {/* Radial Gauge Container (Strictly bounded with NO uncontained drop-shadow) */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '50%',
        }}
      >
        <svg
          viewBox="0 0 36 36"
          style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
            display: 'block',
          }}
        >
          {/* Background Track Circle */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3.2"
          />

          {/* Inner Accent Hairline */}
          <circle
            cx="18"
            cy="18"
            r="13.2"
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="0.6"
            strokeDasharray="1, 2"
          />

          {/* Live Moving Animated Active Arc (Contained subtle drop-shadow) */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.2"
            strokeDasharray={`${clampedScore}, 100`}
            strokeLinecap="round"
            style={{
              filter: glow ? `drop-shadow(0 0 3px ${strokeColor}88)` : 'none',
              transition: isAnimating ? 'none' : 'stroke-dasharray 0.3s ease-out, stroke 0.3s ease',
            }}
          />

          {/* Orbiting Live Tracer Beacon at the tip of the stroke (Fixed coordinates, NO transform scale) */}
          {clampedScore > 2 && (
            <g>
              {/* Pulsing Outer Ping using clean opacity pulsation only */}
              <circle
                cx={cx}
                cy={cy}
                r="2.2"
                fill={strokeColor}
                style={{
                  animation: 'score-beacon-pulse 1.4s ease-in-out infinite',
                }}
              />
              {/* Solid White Tip Core */}
              <circle
                cx={cx}
                cy={cy}
                r="1.2"
                fill="#FFFFFF"
                stroke={strokeColor}
                strokeWidth="0.8"
              />
            </g>
          )}
        </svg>

        {/* Live Moving Counter in Center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: `${size * 0.27}px`,
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1,
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '-0.04em',
                textShadow: `0 0 8px ${strokeColor}44`,
              }}
            >
              {clampedScore}
            </span>
          </div>

          {showSublabel && (
            <span
              style={{
                fontSize: `${Math.max(10, size * 0.085)}px`,
                color: '#9A9A9A',
                marginTop: '2px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              / 100
            </span>
          )}
        </div>
      </div>

      {/* Label and Live Status Indicator */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
        }}
      >
        {label && (
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: strokeColor,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        )}

        {showStatusPill && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.64rem',
              color: '#A3A3A3',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: strokeColor,
                boxShadow: `0 0 4px ${strokeColor}`,
                animation: 'score-live-blink 1.2s ease-in-out infinite alternate',
              }}
            />
            <span>{statusText || (isAnimating ? 'CALIBRATING…' : 'LIVE AUDIT')}</span>
          </div>
        )}
      </div>

      {/* Clean Scoped Keyframes without any coordinate displacement */}
      <style>{`
        @keyframes score-beacon-pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.65;
          }
        }
        @keyframes score-live-blink {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes score-delta-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};
