import React from 'react';
import { Sparkles, Check, ChevronRight } from 'lucide-react';

export type WorkflowStage = 'analyze' | 'diagnose' | 'match' | 'optimize' | 'validate' | 'export';

interface WorkflowBreadcrumbProps {
  currentStage: WorkflowStage;
  onNavigateStage?: (stage: WorkflowStage) => void;
  isCompleted?: boolean;
}

const STAGES: Array<{ id: WorkflowStage; label: string; tabTarget: string }> = [
  { id: 'analyze', label: 'ANALYZE', tabTarget: 'overview' },
  { id: 'diagnose', label: 'DIAGNOSE', tabTarget: 'ats-score' },
  { id: 'match', label: 'MATCH', tabTarget: 'job-match' },
  { id: 'optimize', label: 'OPTIMIZE', tabTarget: 'optimizer' },
  { id: 'validate', label: 'VALIDATE', tabTarget: 'suggestions' },
  { id: 'export', label: 'EXPORT', tabTarget: 'optimizer' },
];

export const WorkflowBreadcrumb: React.FC<WorkflowBreadcrumbProps> = ({
  currentStage,
  onNavigateStage,
}) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(17, 17, 17, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        padding: '3px 8px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {STAGES.map((stage, idx) => {
        const isActive = stage.id === currentStage;
        const isPast = idx < currentIndex;

        return (
          <React.Fragment key={stage.id}>
            <button
              type="button"
              onClick={() => onNavigateStage && onNavigateStage(stage.id)}
              style={{
                background: isActive
                  ? 'rgba(229, 9, 32, 0.18)'
                  : isPast
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(229, 9, 32, 0.4)'
                  : isPast
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid transparent',
                borderRadius: '9999px',
                padding: '3px 10px',
                color: isActive ? '#FFFFFF' : isPast ? '#C4C4C4' : '#666666',
                fontSize: '0.68rem',
                fontWeight: isActive ? 800 : isPast ? 600 : 500,
                letterSpacing: '0.06em',
                cursor: onNavigateStage ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive && onNavigateStage) {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && onNavigateStage) {
                  e.currentTarget.style.color = isPast ? '#C4C4C4' : '#666666';
                  e.currentTarget.style.borderColor = isPast
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'transparent';
                }
              }}
            >
              {isPast && <Check size={10} color="#10B981" />}
              {isActive && (
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#E50920',
                    boxShadow: '0 0 6px #E50920',
                  }}
                />
              )}
              <span>{stage.label}</span>
            </button>

            {idx < STAGES.length - 1 && (
              <ChevronRight
                size={11}
                color={idx < currentIndex ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
