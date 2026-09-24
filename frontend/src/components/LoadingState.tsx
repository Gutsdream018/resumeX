import React, { useEffect, useState } from 'react';
import { Check, Cpu } from 'lucide-react';

interface LoadingStep {
  label: string;
  detail: string;
}

const ANALYSIS_STEPS: LoadingStep[] = [
  { label: 'Extracting resume content', detail: 'Parsing document text layers & layout typography' },
  { label: 'Detecting sections & chronology', detail: 'Classifying Experience, Education, Skills, and Projects' },
  { label: 'Auditing ATS readability', detail: 'Checking table structures, fonts, headers & parseability' },
  { label: 'Benchmarking keyword coverage', detail: 'Evaluating industry skills, technologies & density' },
  { label: 'Analyzing measurable impact', detail: 'Assessing quantifiable metrics and leadership outcomes' },
  { label: 'Generating tailored recommendations', detail: 'Synthesizing actionable fixes & recruiter insights' },
];

export const LoadingState: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 750);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = activeStepIndex < ANALYSIS_STEPS.length - 1
    ? Math.round(((activeStepIndex + 1) / ANALYSIS_STEPS.length) * 90)
    : 94;

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '0 16px',
      }}
    >
      <div
        className="card-dark"
        style={{
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(227, 27, 43, 0.15)',
          border: '1px solid #242424',
          position: 'relative',
        }}
      >
        {/* Animated Diagnostic Indicator */}
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '22px' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '20px',
              background: 'radial-gradient(circle, rgba(227, 27, 43, 0.35) 0%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#141414',
              border: '1px solid #C1121F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(227, 27, 43, 0.4)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span
              style={{
                width: '18px',
                height: '18px',
                borderTop: '3px solid #FFFFFF',
                borderLeft: '3px solid #FFFFFF',
                transform: 'rotate(-45deg)',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Heading */}
        <h3
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          Reviewing your resume...
        </h3>

        <p style={{ color: '#9A9A9A', fontSize: '0.92rem', marginBottom: '28px' }}>
          Benchmarking against enterprise ATS parsers and technical hiring standards.
        </p>

        {/* Red Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#9A9A9A',
              marginBottom: '6px',
            }}
          >
            <span style={{ color: '#F5F5F5' }}>Diagnostic Pipeline</span>
            <span style={{ color: '#E31B2B', fontWeight: 700 }}>{progressPercent}%</span>
          </div>
          <div className="progress-bar-track" style={{ height: '6px' }}>
            <div
              className="progress-bar-fill-red"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Status Checklist */}
        <div
          style={{
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#0D0D0D',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #242424',
          }}
        >
          {ANALYSIS_STEPS.map((step, idx) => {
            const isFinished = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;
            const isPending = idx > activeStepIndex;

            return (
              <div
                key={step.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: isPending ? 0.35 : 1,
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Indicator Icon */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    background: isFinished
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isCurrent
                      ? 'rgba(227, 27, 43, 0.2)'
                      : '#1A1A1A',
                    color: isFinished ? '#10B981' : isCurrent ? '#E31B2B' : '#666666',
                    border: isFinished
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isCurrent
                      ? '1px solid #E31B2B'
                      : '1px solid #2B2B2B',
                  }}
                >
                  {isFinished ? (
                    <Check size={12} strokeWidth={3} />
                  ) : isCurrent ? (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#E31B2B',
                        boxShadow: '0 0 6px #E31B2B',
                      }}
                    />
                  ) : (
                    <span>○</span>
                  )}
                </div>

                {/* Step Text */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isFinished ? '#FFFFFF' : isCurrent ? '#FFFFFF' : '#888888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{step.label}</span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#E31B2B',
                          background: 'rgba(227, 27, 43, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(227, 27, 43, 0.3)',
                        }}
                      >
                        In Progress...
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <div style={{ fontSize: '0.75rem', color: '#9A9A9A', marginTop: '2px' }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
