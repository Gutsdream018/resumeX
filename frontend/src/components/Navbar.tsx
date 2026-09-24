import React, { useState } from 'react';
import { ArrowRight, Menu, X, ShieldCheck, User, LogOut } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { AuthUser } from './AuthModal';

interface NavbarProps {
  onReset: () => void;
  hasResults: boolean;
  onOpenUpload: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenMatchMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onReset,
  hasResults,
  onOpenUpload,
  onNavigateSection,
  onOpenAuth,
  currentUser,
  onLogout,
  onOpenMatchMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (hasResults) {
      onReset();
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    if (onNavigateSection) onNavigateSection(sectionId);
  };

  return (
    <header
      style={{
        borderBottom: '1px solid #242424',
        backgroundColor: 'rgba(7, 7, 7, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
        }}
      >
        {/* Left: Minimal Red Symbol + ResumeX */}
        <BrandLogo
          size="responsive"
          onClick={onReset}
        />

        {/* Center / Right: Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => handleNavClick('features')}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A9A9A',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9A')}
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A9A9A',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9A')}
          >
            How it works
          </button>
          <button
            onClick={() => handleNavClick('ats-checker')}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A9A9A',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9A')}
          >
            ATS Checker
          </button>
          <button
            onClick={() => handleNavClick('pricing')}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A9A9A',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9A9A9A')}
          >
            Pricing
          </button>

          {/* Adaptive Orbiting Rainbow Circle around Match Mode */}
          <button
            onClick={() => {
              if (onOpenMatchMode) onOpenMatchMode();
              else handleNavClick('features');
            }}
            className="match-mode-rainbow-btn"
            style={{
              position: 'relative',
              borderRadius: '9999px',
              padding: '1.5px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              overflow: 'hidden',
              clipPath: 'inset(0 round 9999px)',
              WebkitClipPath: 'inset(0 round 9999px)',
              isolation: 'isolate',
            }}
          >
            {/* Spinning Rainbow Conic Ring */}
            <span
              className="rainbow-spin-circle"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-150%',
                left: '-150%',
                width: '400%',
                height: '400%',
                background: 'conic-gradient(from 0deg, #FF0055, #FF5500, #FFCC00, #00FF66, #00CCFF, #7700FF, #FF00AA, #FF0055)',
                animation: 'rainbow-orbit-spin 3.2s linear infinite',
                borderRadius: '9999px',
              }}
            />

            {/* Inner Dark Pill Content */}
            <span
              className="match-mode-inner-content"
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 13px',
                borderRadius: '9999px',
                background: '#0D0D0D',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              <span>Match Mode</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FF0055, #FF5500)',
                  color: '#FFFFFF',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  lineHeight: 1.2,
                }}
              >
                NEW
              </span>
            </span>
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid #282828',
                  borderRadius: '9999px',
                  padding: '3px 10px 3px 6px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#E31B2B',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#FFF',
                  }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E5E5E5' }}>
                  {currentUser.name.split(' ')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Log out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#777',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  padding: '6px',
                  borderRadius: '6px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E31B2B')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#777')}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => onOpenAuth('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A3A3A3',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  padding: '6px 8px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A3A3A3')}
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#E31B2B';
                  e.currentTarget.style.background = 'rgba(227, 27, 43, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333333';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={onOpenUpload}
            className="btn btn-red"
            style={{
              padding: '9px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <span>Review My Resume</span>
            <ArrowRight size={15} />
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          style={{
            display: 'none',
            background: '#141414',
            border: '1px solid #242424',
            color: '#F5F5F5',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid #242424',
            backgroundColor: '#0D0D0D',
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1F1F1F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E31B2B', display: 'grid', placeItems: 'center', color: '#FFF', fontSize: '0.75rem', fontWeight: 800 }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: '#FFF', fontSize: '0.9rem', fontWeight: 600 }}>{currentUser.name}</span>
              </div>
              <button onClick={onLogout} style={{ background: 'none', border: 'none', color: '#E31B2B', fontSize: '0.8rem', cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '6px 0' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                style={{
                  padding: '9px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  background: '#141414',
                  color: '#FFF',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                style={{
                  padding: '9px',
                  borderRadius: '6px',
                  border: '1px solid #E31B2B',
                  background: 'rgba(227, 27, 43, 0.15)',
                  color: '#FFF',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </div>
          )}

          <button
            onClick={() => handleNavClick('features')}
            style={{
              background: 'none',
              border: 'none',
              color: '#F5F5F5',
              fontSize: '0.95rem',
              textAlign: 'left',
              padding: '8px 0',
            }}
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            style={{
              background: 'none',
              border: 'none',
              color: '#F5F5F5',
              fontSize: '0.95rem',
              textAlign: 'left',
              padding: '8px 0',
            }}
          >
            How it works
          </button>
          <button
            onClick={() => handleNavClick('ats-checker')}
            style={{
              background: 'none',
              border: 'none',
              color: '#F5F5F5',
              fontSize: '0.95rem',
              textAlign: 'left',
              padding: '8px 0',
            }}
          >
            ATS Checker
          </button>
          <button
            onClick={() => handleNavClick('pricing')}
            style={{
              background: 'none',
              border: 'none',
              color: '#F5F5F5',
              fontSize: '0.95rem',
              textAlign: 'left',
              padding: '8px 0',
            }}
          >
            Pricing
          </button>
          {/* Mobile Match Mode Button with Rainbow Orbit */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenMatchMode) onOpenMatchMode();
              else handleNavClick('features');
            }}
            className="match-mode-rainbow-btn"
            style={{
              position: 'relative',
              borderRadius: '9999px',
              padding: '1.5px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              width: '100%',
              margin: '6px 0',
              clipPath: 'inset(0 round 9999px)',
              WebkitClipPath: 'inset(0 round 9999px)',
              isolation: 'isolate',
            }}
          >
            <span
              className="rainbow-spin-circle"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-150%',
                left: '-150%',
                width: '400%',
                height: '400%',
                background: 'conic-gradient(from 0deg, #FF0055, #FF5500, #FFCC00, #00FF66, #00CCFF, #7700FF, #FF00AA, #FF0055)',
                animation: 'rainbow-orbit-spin 3.2s linear infinite',
              }}
            />
            <span
              className="match-mode-inner-content"
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: '9999px',
                background: '#0D0D0D',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 600,
                width: '100%',
              }}
            >
              <span>Match Mode</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FF0055, #FF5500)',
                  color: '#FFFFFF',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  lineHeight: 1.2,
                }}
              >
                NEW
              </span>
            </span>
          </button>

          <button
            onClick={onOpenUpload}
            className="btn btn-red"
            style={{
              marginTop: '8px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <span>Review My Resume</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes rainbow-orbit-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .match-mode-rainbow-btn {
          filter: drop-shadow(0 0 6px rgba(255, 0, 100, 0.45)) drop-shadow(0 0 10px rgba(0, 204, 255, 0.3));
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
        }
        .match-mode-rainbow-btn:hover {
          transform: scale(1.04);
          filter: drop-shadow(0 0 12px rgba(255, 0, 100, 0.8)) drop-shadow(0 0 18px rgba(0, 204, 255, 0.6));
        }
        .match-mode-rainbow-btn:hover .rainbow-spin-circle {
          animation-duration: 1.6s !important;
        }
        .match-mode-rainbow-btn:hover .match-mode-inner-content {
          background: #141414 !important;
        }
        @media (max-width: 820px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
