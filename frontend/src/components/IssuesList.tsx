import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  FileSearch,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface IssuesListProps {
  criticalFlaws: (string | any)[];
  strengths: (string | any)[];
  atsIssues: (string | any)[];
  recommendations: (string | any)[];
  minorFlaws: (string | any)[];
  missingInfo: (string | any)[];
}

export const IssuesList: React.FC<IssuesListProps> = ({
  criticalFlaws,
  strengths,
  atsIssues,
  recommendations,
  minorFlaws,
  missingInfo,
}) => {
  const [activeTab, setActiveTab] = useState<string>('critical');

  const tabs = [
    {
      id: 'critical',
      label: 'Critical Flaws',
      count: criticalFlaws.length,
      icon: <AlertOctagon size={16} color="var(--danger)" />,
      badgeColor: 'badge-danger',
    },
    {
      id: 'strengths',
      label: 'Strengths',
      count: strengths.length,
      icon: <CheckCircle2 size={16} color="var(--success)" />,
      badgeColor: 'badge-success',
    },
    {
      id: 'ats',
      label: 'ATS Analysis',
      count: atsIssues.length,
      icon: <FileSearch size={16} color="var(--accent-cyan)" />,
      badgeColor: 'badge-cyan',
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      count: recommendations.length,
      icon: <Sparkles size={16} color="#818cf8" />,
      badgeColor: 'badge-primary',
    },
    {
      id: 'minor',
      label: 'Minor Flaws',
      count: minorFlaws.length,
      icon: <AlertTriangle size={16} color="var(--warning)" />,
      badgeColor: 'badge-warning',
    },
    {
      id: 'missing',
      label: 'Missing Info',
      count: missingInfo.length,
      icon: <HelpCircle size={16} color="#94a3b8" />,
      badgeColor: 'badge-primary',
    },
  ];

  const getListForTab = (tabId: string): { items: any[]; type: string } => {
    switch (tabId) {
      case 'critical':
        return { items: criticalFlaws, type: 'critical' };
      case 'strengths':
        return { items: strengths, type: 'strength' };
      case 'ats':
        return { items: atsIssues, type: 'ats' };
      case 'recommendations':
        return { items: recommendations, type: 'recommendation' };
      case 'minor':
        return { items: minorFlaws, type: 'minor' };
      case 'missing':
        return { items: missingInfo, type: 'missing' };
      default:
        return { items: [], type: '' };
    }
  };

  const { items, type } = getListForTab(activeTab);

  const getCardStyle = (itemType: string) => {
    switch (itemType) {
      case 'critical':
        return {
          bg: 'var(--danger-bg)',
          border: 'rgba(239, 68, 68, 0.25)',
          iconColor: 'var(--danger)',
          icon: <AlertOctagon size={18} color="var(--danger)" />,
        };
      case 'strength':
        return {
          bg: 'var(--success-bg)',
          border: 'rgba(16, 185, 129, 0.25)',
          iconColor: 'var(--success)',
          icon: <CheckCircle2 size={18} color="var(--success)" />,
        };
      case 'ats':
        return {
          bg: 'var(--cyan-bg)',
          border: 'rgba(6, 182, 212, 0.25)',
          iconColor: 'var(--accent-cyan)',
          icon: <FileSearch size={18} color="var(--accent-cyan)" />,
        };
      case 'recommendation':
        return {
          bg: 'rgba(129, 140, 248, 0.08)',
          border: 'rgba(129, 140, 248, 0.25)',
          iconColor: '#818cf8',
          icon: <Sparkles size={18} color="#818cf8" />,
        };
      case 'minor':
        return {
          bg: 'var(--warning-bg)',
          border: 'rgba(245, 158, 11, 0.25)',
          iconColor: 'var(--warning)',
          icon: <AlertTriangle size={18} color="var(--warning)" />,
        };
      case 'missing':
        return {
          bg: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.1)',
          iconColor: '#cbd5e1',
          icon: <HelpCircle size={18} color="#cbd5e1" />,
        };
      default:
        return {
          bg: 'transparent',
          border: 'var(--border-subtle)',
          iconColor: '#ffffff',
          icon: null,
        };
    }
  };

  const currentStyle = getCardStyle(type);

  return (
    <div className="glass-card" style={{ padding: '28px', marginTop: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
          Diagnostic Findings & Recommendations
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Detailed audit organized by priority. Focus on Critical Flaws and ATS parsing first.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--surface-active)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-active)' : 'transparent'}`,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.86rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`badge ${tab.badgeColor}`}
                style={{ fontSize: '0.72rem', padding: '1px 6px', marginLeft: '4px' }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}>
            No items recorded in this section.
          </div>
        ) : (
          items.map((item, idx) => {
            const displayText =
              typeof item === 'string'
                ? item
                : item?.issue
                ? `${item.issue}${item.explanation ? ': ' + item.explanation : ''}`
                : JSON.stringify(item);

            return (
              <div
                key={idx}
                style={{
                  background: currentStyle.bg,
                  border: `1px solid ${currentStyle.border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {currentStyle.icon}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#f8fafc', lineHeight: 1.5 }}>
                  {displayText}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
