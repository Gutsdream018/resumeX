import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ResumeAnalysisResult } from '../types';
import { MatchMode } from './match-mode/MatchMode';

interface JobMatchPageProps {
  analysis: ResumeAnalysisResult;
  onNavigateTab?: (tabId: string) => void;
}

export const JobMatchPage: React.FC<JobMatchPageProps> = ({ analysis, onNavigateTab }) => {
  return (
    <div>
      {onNavigateTab && (
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => onNavigateTab('overview')}
            className="match-mode-circle-back-btn"
            title="Back to Overview"
            aria-label="Back to Overview"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#E31B2B';
              e.currentTarget.style.backgroundColor = 'rgba(227, 27, 43, 0.16)';
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(227, 27, 43, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.backgroundColor = '#121212';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.5)';
            }}
          >
            <ArrowLeft size={19} />
          </button>
        </div>
      )}
      <MatchMode
        analysis={analysis}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
