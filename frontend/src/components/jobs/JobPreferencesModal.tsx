import React, { useState, useEffect } from 'react';
import { CandidatePreferences } from '../../types';
import { X, SlidersHorizontal, MapPin, Briefcase, DollarSign, Globe, Check } from 'lucide-react';

interface JobPreferencesModalProps {
  isOpen: boolean;
  preferences: CandidatePreferences;
  onClose: () => void;
  onSave: (updated: CandidatePreferences) => void;
  isLoading?: boolean;
}

export const JobPreferencesModal: React.FC<JobPreferencesModalProps> = ({
  isOpen,
  preferences,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [targetRole, setTargetRole] = useState(preferences.targetRole || '');
  const [location, setLocation] = useState(preferences.location || '');
  const [workplaceType, setWorkplaceType] = useState<CandidatePreferences['workplaceType']>(
    preferences.workplaceType || 'any'
  );
  const [salaryMin, setSalaryMin] = useState<number | undefined>(preferences.salaryMin);
  const [countryCode, setCountryCode] = useState(preferences.countryCode || 'in');

  useEffect(() => {
    if (isOpen) {
      setTargetRole(preferences.targetRole || '');
      setLocation(preferences.location || '');
      setWorkplaceType(preferences.workplaceType || 'any');
      setSalaryMin(preferences.salaryMin);
      setCountryCode(preferences.countryCode || 'in');
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      targetRole: targetRole.trim() || undefined,
      location: location.trim() || undefined,
      workplaceType,
      salaryMin: salaryMin && salaryMin > 0 ? Number(salaryMin) : undefined,
      countryCode: countryCode.toLowerCase(),
    });
  };

  const countries = [
    { code: 'in', label: 'India (IN)' },
    { code: 'us', label: 'United States (US)' },
    { code: 'gb', label: 'United Kingdom (GB)' },
    { code: 'ca', label: 'Canada (CA)' },
    { code: 'au', label: 'Australia (AU)' },
    { code: 'sg', label: 'Singapore (SG)' },
    { code: 'de', label: 'Germany (DE)' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-modal-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.76)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          background: '#0F0F0F',
          border: '1px solid #282828',
          borderRadius: '18px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1E1E1E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(227, 27, 43, 0.12)',
                border: '1px solid rgba(227, 27, 43, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E31B2B',
              }}
            >
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h3
                id="preferences-modal-title"
                style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}
              >
                Job Discovery Preferences
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#888888', margin: 0 }}>
                Prefilled from your parsed resume. Tailor to adjust matched jobs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Target Role */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#CCCCCC',
                marginBottom: '6px',
              }}
            >
              <Briefcase size={14} color="#E31B2B" />
              Target Role / Job Title
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer, Mechanical Engineer"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#161616',
                border: '1px solid #2A2A2A',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Location & Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#CCCCCC',
                  marginBottom: '6px',
                }}
              >
                <MapPin size={14} color="#E31B2B" />
                City / Region
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore, Mumbai, Remote"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#161616',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#CCCCCC',
                  marginBottom: '6px',
                }}
              >
                <Globe size={14} color="#E31B2B" />
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#161616',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Workplace Type Toggle */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#CCCCCC',
                marginBottom: '8px',
              }}
            >
              Workplace Type
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                background: '#141414',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid #242424',
              }}
            >
              {(['any', 'remote', 'hybrid', 'onsite'] as const).map((type) => {
                const isSelected = workplaceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWorkplaceType(type)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      background: isSelected ? '#E31B2B' : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#888888',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum Salary (Optional) */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#CCCCCC',
                marginBottom: '6px',
              }}
            >
              <DollarSign size={14} color="#10B981" />
              Minimum Annual Salary (Optional)
            </label>
            <input
              type="number"
              value={salaryMin || ''}
              onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 600000 or 80000"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#161616',
                border: '1px solid #2A2A2A',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #1E1E1E',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#1A1A1A',
                border: '1px solid #282828',
                color: '#A0A0A0',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-red"
              style={{
                padding: '8px 20px',
                fontSize: '0.86rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} />
              <span>{isLoading ? 'Saving...' : 'Apply & Search'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
