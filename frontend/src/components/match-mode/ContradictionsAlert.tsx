import React from 'react';
import { ContradictionItem } from './types';
import { AlertTriangle, MapPin, Clock, Award, ShieldAlert } from 'lucide-react';

interface ContradictionsAlertProps {
  contradictions: ContradictionItem[];
}

export const ContradictionsAlert: React.FC<ContradictionsAlertProps> = ({ contradictions }) => {
  if (!contradictions || contradictions.length === 0) return null;

  const getIcon = (area: ContradictionItem['area']) => {
    switch (area) {
      case 'Location':
        return <MapPin size={16} color="#FACC15" />;
      case 'Seniority':
      case 'Experience Duration':
        return <Clock size={16} color="#F87171" />;
      default:
        return <AlertTriangle size={16} color="#FACC15" />;
    }
  };

  return (
    <div
      style={{
        background: 'rgba(234, 179, 8, 0.06)',
        border: '1px solid rgba(234, 179, 8, 0.25)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={18} color="#FACC15" />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FACC15', margin: 0 }}>
          Alignment Differences & Qualifications Notice ({contradictions.length})
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {contradictions.map((c, idx) => (
          <div
            key={c.id || idx}
            style={{
              background: '#121212',
              border: '1px solid #282828',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getIcon(c.area)}
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>
                  {c.area} Discrepancy
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: c.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: c.severity === 'high' ? '#F87171' : '#FACC15',
                }}
              >
                {c.severity} Priority
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#888' }}>Job Expectation: </span>
                <span style={{ color: '#DDD' }}>{c.jobExpectation}</span>
              </div>
              <div>
                <span style={{ color: '#888' }}>Resume Evidence: </span>
                <span style={{ color: '#DDD' }}>{c.resumeEvidence}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#9E9E9E', margin: '4px 0 0', fontStyle: 'italic' }}>
              {c.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
