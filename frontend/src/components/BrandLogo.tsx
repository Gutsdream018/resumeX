import React from 'react';

export const BRAND = {
  name: 'ResumeX',
  styledName: 'Resume',
  accentLetter: 'X',
  tagline: 'Your Resume. Reviewed for Real Impact.',
  subtitle: 'Professional Resume Critique & ATS Diagnostic Platform',
  proBadge: 'PRO',
  proPlan: 'ResumeX Pro',
};

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  showBadge?: boolean;
  showIcon?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  accentColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = false,
  showIcon = true,
  onClick,
  className = '',
  style = {},
  accentColor = '#E31B2B',
}) => {
  // Dimensions based on size preset
  const dimensions = {
    sm: {
      box: '26px',
      icon: 11,
      fontSize: '1rem',
      badgeFont: '0.6rem',
      badgePadding: '1px 5px',
      gap: '8px',
    },
    md: {
      box: '34px',
      icon: 14,
      fontSize: '1.2rem',
      badgeFont: '0.66rem',
      badgePadding: '2px 6px',
      gap: '10px',
    },
    lg: {
      box: '42px',
      icon: 18,
      fontSize: '1.5rem',
      badgeFont: '0.72rem',
      badgePadding: '3px 8px',
      gap: '12px',
    },
    responsive: {
      box: 'clamp(28px, 4vw, 36px)',
      icon: 14,
      fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)',
      badgeFont: '0.65rem',
      badgePadding: '2px 6px',
      gap: '10px',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`resumex-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dimensions.gap,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {/* Precision Geometric Red Icon with Stylized X */}
      {showIcon && (
        <div
          className="resumex-icon-box"
          style={{
            width: dimensions.box,
            height: dimensions.box,
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #990B16 0%, #C1121F 40%, #E31B2B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(227, 27, 43, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle high-tech highlight sheen */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '45%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          {/* Stylized X Mark */}
          <svg
            width={dimensions.icon}
            height={dimensions.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          className="resumex-wordmark"
          style={{
            fontSize: dimensions.fontSize,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'baseline',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
        >
          {BRAND.styledName}
          <span
            style={{
              color: accentColor,
              fontWeight: 900,
              textShadow: '0 0 14px rgba(227, 27, 43, 0.65)',
              display: 'inline-block',
              marginLeft: '0.5px',
            }}
          >
            {BRAND.accentLetter}
          </span>
        </span>
      </div>

      <style>{`
        .resumex-brand-logo:hover .resumex-icon-box {
          box-shadow: 0 0 22px rgba(227, 27, 43, 0.7) !important;
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
};
