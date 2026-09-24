import React from 'react';
import {
  LayoutDashboard,
  Target,
  FileSearch,
  Key,
  Briefcase,
  GraduationCap,
  Sparkles,
  Lightbulb,
  FileCheck2,
  Settings,
  HelpCircle,
  ArrowLeft,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export type DashboardTab =
  | 'overview'
  | 'ats-score'
  | 'resume-analysis'
  | 'optimizer'
  | 'keywords'
  | 'experience'
  | 'education'
  | 'skills'
  | 'suggestions'
  | 'job-match'
  | 'sections';

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onReset: () => void;
  onCloseMobile?: () => void;
  overallScore?: number;
}

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onTabChange,
  onReset,
  onCloseMobile,
  overallScore,
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    {
      id: 'ats-score',
      label: 'ATS Score',
      icon: <Target size={18} />,
      badge: overallScore !== undefined ? String(overallScore) : undefined,
    },
    { id: 'resume-analysis', label: 'Document Critique', icon: <FileSearch size={18} /> },
    { id: 'optimizer', label: 'Resume Optimizer', icon: <Sparkles size={18} color="#E31B2B" />, badge: 'AI' },
    { id: 'keywords', label: 'Keywords', icon: <Key size={18} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={18} /> },
    { id: 'education', label: 'Education', icon: <GraduationCap size={18} /> },
    { id: 'skills', label: 'Skills', icon: <Sparkles size={18} /> },
    { id: 'suggestions', label: 'Revisions', icon: <Lightbulb size={18} />, badge: 'Fixes' },
    { id: 'sections', label: 'Section Analysis', icon: <FileCheck2 size={18} /> },
    { id: 'job-match', label: 'Match Mode', icon: <Target size={18} />, badge: 'NEW' },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0D0D0D',
        borderRight: '1px solid #242424',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '100vh',
        padding: '24px 16px',
        flexShrink: 0,
      }}
      className="dashboard-sidebar-container"
    >
      <div>
        {/* Top: Logo + Mobile Close */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px 24px',
            borderBottom: '1px solid #1E1E1E',
            marginBottom: '20px',
          }}
        >
          <BrandLogo
            size="sm"
            onClick={onReset}
          />

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9A9A9A',
                cursor: 'pointer',
                display: 'none',
              }}
              className="mobile-close-btn"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(227, 27, 43, 0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(227, 27, 43, 0.35)' : 'transparent'}`,
                  color: isActive ? '#FFFFFF' : '#9A9A9A',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#141414';
                    e.currentTarget.style.color = '#F5F5F5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9A9A9A';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Red Active Indicator Bar */}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '0',
                        top: '20%',
                        bottom: '20%',
                        width: '3.5px',
                        backgroundColor: '#E31B2B',
                        borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 8px #E31B2B',
                      }}
                    />
                  )}
                  <span style={{ color: isActive ? '#E31B2B' : '#737373', display: 'flex' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isActive ? '#C1121F' : '#1C1C1C',
                      color: isActive ? '#FFFFFF' : '#9A9A9A',
                      border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.2)' : '#2A2A2A'}`,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 20% Dark Space Buffer Below Changing Tab List */}
        <div
          aria-hidden="true"
          style={{
            height: 'clamp(28px, 6vh, 56px)',
            width: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Bottom Area: Settings, Help, Exit */}
      <div style={{ borderTop: '1px solid #1E1E1E', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => alert('Settings: Diagnostic thresholds set to Recruiter Standard ATS 2026.')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: '#737373',
            fontSize: '0.84rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <button
          onClick={() => alert('Need assistance? Help documentation is available 24/7.')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: '#737373',
            fontSize: '0.84rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F5F5F5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
        >
          <HelpCircle size={16} />
          <span>Help & Rubrics</span>
        </button>

        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: '#141414',
            border: '1px solid #242424',
            color: '#F5F5F5',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            marginTop: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#E31B2B';
            e.currentTarget.style.color = '#E31B2B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#242424';
            e.currentTarget.style.color = '#F5F5F5';
          }}
        >
          <ArrowLeft size={16} />
          <span>Upload Another Resume</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </aside>
  );
};
