import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Briefcase,
  ArrowRight,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BrandLogo } from './BrandLogo';

export interface AuthUser {
  name: string;
  email: string;
  role?: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  isStandalone?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onSuccess,
  isStandalone = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Sync tab when initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialTab, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen || isStandalone) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isStandalone, onClose]);

  // If not open and not standalone, don't render
  if (!isOpen && !isStandalone) return null;

  // Open in separate small window popup
  const openInSeparateWindow = () => {
    const width = 470;
    const height = 720;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;

    const popupUrl = `${window.location.origin}${window.location.pathname}?popup=true&auth=${activeTab}`;
    const popup = window.open(
      popupUrl,
      'ResumeXAuthPopup',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
      if (!isStandalone) {
        onClose();
      }
    }
  };

  // Demo autofill
  const fillDemoAccount = () => {
    setErrorMessage(null);
    if (activeTab === 'login') {
      setEmail('demo.candidate@resumex.ai');
      setPassword('CandidatePro2026!');
    } else {
      setFullName('Alex Morgan');
      setEmail('alex.morgan@resumex.ai');
      setTargetRole('Staff Software Engineer');
      setPassword('CandidatePro2026!');
    }
  };

  // Evaluate password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: 'Empty', color: '#444' };
    if (password.length < 6) return { level: 1, text: 'Weak', color: '#E31B2B' };
    if (password.length < 10) return { level: 2, text: 'Good', color: '#fbbf24' };
    return { level: 3, text: 'Strong', color: '#34d399' };
  };

  const passwordStrength = getPasswordStrength();

  // Handle Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic validation
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (activeTab === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const user: AuthUser = {
        name: activeTab === 'signup' ? fullName.trim() : email.split('@')[0],
        email: email.trim(),
        role: activeTab === 'signup' ? targetRole : 'Job Seeker',
      };

      // Confetti burst for rewarding user
      try {
        confetti({
          particleCount: 65,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#E31B2B', '#ffffff', '#10B981'],
        });
      } catch (err) {
        // Safe confetti fallback
      }

      setSuccessMessage(
        activeTab === 'login'
          ? `Welcome back, ${user.name}!`
          : `Account created successfully! Welcome to ResumeX.`
      );

      // Save to localStorage for persistent session
      localStorage.setItem('resumex_user', JSON.stringify(user));

      // Post message if opened in a popup window
      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'RESUMEX_AUTH_SUCCESS', user }, '*');
        } catch (e) {
          // ignore cross-origin issues
        }
      }

      setTimeout(() => {
        onSuccess(user);
        if (isStandalone && window.opener) {
          window.close();
        } else {
          onClose();
        }
      }, 1100);
    }, 850);
  };

  const handleSocialAuth = (provider: 'Google' | 'GitHub') => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      const user: AuthUser = {
        name: `${provider} Candidate`,
        email: `candidate@${provider.toLowerCase()}.com`,
        role: 'Senior Software Engineer',
      };

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#E31B2B', '#ffffff'],
        });
      } catch (e) {}

      setSuccessMessage(`Authenticated via ${provider}! Welcome to ResumeX.`);
      localStorage.setItem('resumex_user', JSON.stringify(user));

      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'RESUMEX_AUTH_SUCCESS', user }, '*');
        } catch (e) {}
      }

      setTimeout(() => {
        onSuccess(user);
        if (isStandalone && window.opener) {
          window.close();
        } else {
          onClose();
        }
      }, 1000);
    }, 700);
  };

  return (
    <div
      style={{
        position: isStandalone ? 'relative' : 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isStandalone ? '#070707' : 'rgba(0, 0, 0, 0.82)',
        backdropFilter: isStandalone ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: isStandalone ? 'none' : 'blur(10px)',
        padding: '16px',
        minHeight: isStandalone ? '100vh' : 'auto',
      }}
      onClick={isStandalone ? undefined : (e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Sleek Floating Card / Small Tab Window */}
      <div
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: '#0F0F0F',
          borderRadius: '16px',
          border: '1px solid #292929',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(227, 27, 43, 0.16)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'resumex-auth-scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #E31B2B, transparent)',
            boxShadow: '0 0 15px #E31B2B',
          }}
        />

        {/* Top Control Bar with Brand & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 12px',
            borderBottom: '1px solid #1E1E1E',
          }}
        >
          <BrandLogo size="sm" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Open in Separate Small Tab/Window button */}
            {!isStandalone && (
              <button
                type="button"
                onClick={openInSeparateWindow}
                title="Open in separate small window / tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #2A2A2A',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: '#9A9A9A',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                className="auth-secondary-btn"
              >
                <ExternalLink size={12} />
                <span>Small Tab</span>
              </button>
            )}

            {/* Close Button */}
            {!isStandalone && (
              <button
                type="button"
                onClick={onClose}
                title="Close"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #2A2A2A',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: '#9A9A9A',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                className="auth-secondary-btn"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Separate Small Switcher Tabs: Log In & Sign In / Sign Up */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid #1E1E1E',
            background: '#0B0B0B',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            style={{
              padding: '12px 16px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'login' ? 800 : 500,
              color: activeTab === 'login' ? '#FFFFFF' : '#777777',
              background: activeTab === 'login' ? 'rgba(227, 27, 43, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2.5px solid #E31B2B' : '2.5px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Log In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
            }}
            style={{
              padding: '12px 16px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'signup' ? 800 : 500,
              color: activeTab === 'signup' ? '#FFFFFF' : '#777777',
              background: activeTab === 'signup' ? 'rgba(227, 27, 43, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'signup' ? '2.5px solid #E31B2B' : '2.5px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Sign Up / Create</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 22px' }}>
          {/* Header Title & Subtitle */}
          <div style={{ marginBottom: '18px', textAlign: 'center' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              {activeTab === 'login' ? 'Welcome Back' : 'Create ResumeX Account'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#888888', lineHeight: 1.4 }}>
              {activeTab === 'login'
                ? 'Sign in to access your saved resume reviews and ATS scores.'
                : 'Free instant recruiter-calibrated ATS critique & bullet rewrites.'}
            </p>
          </div>

          {/* Social Quick Login Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => handleSocialAuth('Google')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#141414',
                border: '1px solid #2B2B2B',
                color: '#E5E5E5',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="auth-secondary-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.4 0 10.1 0 12s.6 3.6 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialAuth('GitHub')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#141414',
                border: '1px solid #2B2B2B',
                color: '#E5E5E5',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="auth-secondary-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '14px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#222222' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#666666', letterSpacing: '0.06em' }}>
              OR WITH EMAIL
            </span>
            <div style={{ flex: 1, height: '1px', background: '#222222' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Error Banner */}
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(227, 27, 43, 0.12)',
                  border: '1px solid rgba(227, 27, 43, 0.4)',
                  color: '#FF7D88',
                  fontSize: '0.78rem',
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <Check size={14} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Full Name field (Sign Up only) */}
            {activeTab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#A3A3A3', marginBottom: '5px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="#666"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    style={{
                      width: '100%',
                      background: '#131313',
                      border: '1px solid #2B2B2B',
                      borderRadius: '8px',
                      padding: '9px 12px 9px 36px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Target Role field (Sign Up only) */}
            {activeTab === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#A3A3A3', marginBottom: '5px' }}>
                  Target Career Role
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase
                    size={16}
                    color="#666"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    style={{
                      width: '100%',
                      background: '#131313',
                      border: '1px solid #2B2B2B',
                      borderRadius: '8px',
                      padding: '9px 12px 9px 36px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#A3A3A3', marginBottom: '5px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#666"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    background: '#131313',
                    border: '1px solid #2B2B2B',
                    borderRadius: '8px',
                    padding: '9px 12px 9px 36px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#A3A3A3' }}>
                  Password
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to demo account.')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E31B2B',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#666"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: '#131313',
                    border: '1px solid #2B2B2B',
                    borderRadius: '8px',
                    padding: '9px 40px 9px 36px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  className="auth-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#777',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength meter (Sign Up only) */}
              {activeTab === 'signup' && password.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
                    <span style={{ color: '#777' }}>Security level</span>
                    <span style={{ color: passwordStrength.color, fontWeight: 700 }}>{passwordStrength.text}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', height: '3px' }}>
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        style={{
                          flex: 1,
                          borderRadius: '2px',
                          background:
                            step <= passwordStrength.level ? passwordStrength.color : 'rgba(255, 255, 255, 0.1)',
                          transition: 'background 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox row */}
            {activeTab === 'login' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#E31B2B' }}
                />
                <span style={{ fontSize: '0.78rem', color: '#888' }}>Remember this device for 30 days</span>
              </label>
            ) : (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ accentColor: '#E31B2B', marginTop: '2px' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#888', lineHeight: 1.4 }}>
                  I agree to ResumeX Terms of Service and confidential in-memory parsing.
                </span>
              </label>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-red"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.92rem',
                fontWeight: 700,
                marginTop: '4px',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(227, 27, 43, 0.35)',
              }}
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Log In to ResumeX' : 'Create Account & Start'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo Fill Helper */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={fillDemoAccount}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed #333333',
                borderRadius: '6px',
                color: '#9A9A9A',
                fontSize: '0.72rem',
                padding: '5px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s',
              }}
              className="auth-secondary-btn"
            >
              <Sparkles size={11} color="#E31B2B" />
              <span>Click to auto-fill sample credentials</span>
            </button>
          </div>
        </div>

        {/* Card Footer: Toggle between Log In & Sign Up */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1C1C1C',
            background: '#090909',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#777777',
          }}
        >
          {activeTab === 'login' ? (
            <div>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E31B2B',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '2px',
                }}
              >
                Create one now
              </button>
            </div>
          ) : (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E31B2B',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '2px',
                }}
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes resumex-auth-scale-in {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .auth-input:focus {
          border-color: #E31B2B !important;
          box-shadow: 0 0 12px rgba(227, 27, 43, 0.25) !important;
          background: #171717 !important;
        }
        .auth-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: #444444 !important;
          color: #FFFFFF !important;
        }
      `}</style>
    </div>
  );
};
