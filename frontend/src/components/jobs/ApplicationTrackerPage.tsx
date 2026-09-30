import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../../types';
import { getApplicationsApi, updateApplicationStatusApi, deleteApplicationApi } from '../../services/api';
import {
  FileCheck2,
  Building2,
  MapPin,
  ExternalLink,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface ApplicationTrackerPageProps {
  userId?: string;
  onNavigateTab?: (tab: string) => void;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  saved: {
    label: 'Saved',
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.1)',
    border: 'rgba(156, 163, 175, 0.25)',
  },
  tailored: {
    label: 'Tailored',
    color: '#60A5FA',
    bg: 'rgba(96, 165, 250, 0.1)',
    border: 'rgba(96, 165, 250, 0.25)',
  },
  applied: {
    label: 'Applied',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  interview: {
    label: 'Interviewing',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.25)',
  },
  offer: {
    label: 'Offer Received',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  rejected: {
    label: 'Archived / Rejected',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
  },
};

const ALL_STATUSES: ApplicationStatus[] = [
  'saved',
  'tailored',
  'applied',
  'interview',
  'offer',
  'rejected',
];

export const ApplicationTrackerPage: React.FC<ApplicationTrackerPageProps> = ({
  userId,
  onNavigateTab,
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ApplicationStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await getApplicationsApi(userId);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [userId]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStatusApi(appId, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } : app))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!window.confirm('Are you sure you want to remove this application record?')) return;
    try {
      await deleteApplicationApi(appId);
      setApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (selectedFilter !== 'all' && app.status !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.jobTitle.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusCount = (status: ApplicationStatus) => {
    return applications.filter((a) => a.status === status).length;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Recently';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #202020',
          paddingBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck2 size={18} />
            </div>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Application Tracker
            </h1>
            <span
              style={{
                background: '#141414',
                border: '1px solid #282828',
                color: '#A0A0A0',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {applications.length} TOTAL
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#9A9A9A', margin: 0 }}>
            Track every job match, tailored resume variant, and submission status across your job search lifecycle.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadApplications}
            disabled={isLoading}
            className="btn btn-secondary-dark"
            style={{ fontSize: '0.84rem', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-red-500' : ''} />
            <span>Refresh</span>
          </button>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('jobs')}
              className="btn btn-red"
              style={{ fontSize: '0.84rem', padding: '8px 16px', fontWeight: 700 }}
            >
              <Briefcase size={14} />
              <span>Find More Jobs</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '14px',
          padding: '16px 20px',
        }}
      >
        {/* Status Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedFilter === 'all' ? '1px solid #E31B2B' : '1px solid #282828',
              background: selectedFilter === 'all' ? 'rgba(227, 27, 43, 0.15)' : '#141414',
              color: selectedFilter === 'all' ? '#FFFFFF' : '#888888',
              transition: 'all 0.15s ease',
            }}
          >
            All ({applications.length})
          </button>

          {ALL_STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const isSelected = selectedFilter === status;
            const count = getStatusCount(status);
            return (
              <button
                key={status}
                onClick={() => setSelectedFilter(status)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${cfg.color}` : '1px solid #242424',
                  background: isSelected ? cfg.bg : '#141414',
                  color: isSelected ? '#FFFFFF' : '#888888',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cfg.label}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: '#1E1E1E',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    color: isSelected ? cfg.color : '#777',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search within applications */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={14} color="#777" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role or company..."
            style={{
              width: '100%',
              padding: '7px 12px 7px 34px',
              background: '#141414',
              border: '1px solid #282828',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Applications Table / Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: '76px',
                background: '#0E0E0E',
                border: '1px solid #202020',
                borderRadius: '12px',
                animation: 'pulse 1.8s infinite',
              }}
            />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div
          style={{
            padding: '50px 24px',
            borderRadius: '16px',
            background: '#0D0D0D',
            border: '1px solid #222222',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#161616',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
          >
            <Briefcase size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            {selectedFilter === 'all'
              ? 'No applications tracked yet'
              : `No applications in "${STATUS_CONFIG[selectedFilter].label}"`}
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#888', maxWidth: '420px', margin: 0 }}>
            Jobs you save, tailor, or apply to from the Job Match & Discovery page will automatically appear here.
          </p>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('jobs')}
              className="btn btn-red"
              style={{ marginTop: '8px', fontSize: '0.84rem', padding: '8px 18px' }}
            >
              Explore Matches
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            background: '#0D0D0D',
            border: '1px solid #222222',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 2fr) minmax(140px, 1fr) 160px 140px 100px',
              padding: '12px 20px',
              borderBottom: '1px solid #1E1E1E',
              background: '#111111',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#777',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>Role & Company</span>
            <span>Location</span>
            <span>Status</span>
            <span>Date</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredApplications.map((app) => {
              const currentCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              const isUpdating = updatingId === app.id;

              return (
                <div
                  key={app.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(240px, 2fr) minmax(140px, 1fr) 160px 140px 100px',
                    padding: '16px 20px',
                    borderBottom: '1px solid #1A1A1A',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#121212')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Role Title & Company */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {app.jobTitle}
                      </span>
                      {app.tailoredResumeId && (
                        <span
                          title="Tailored resume variant linked"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.68rem',
                            color: '#60A5FA',
                            background: 'rgba(96, 165, 250, 0.12)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(96, 165, 250, 0.25)',
                          }}
                        >
                          <Sparkles size={10} />
                          Variant
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#999', marginTop: '3px' }}>
                      <Building2 size={13} color="#E31B2B" />
                      <span>{app.company}</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#888' }}>
                    <MapPin size={13} />
                    <span>{app.location || 'Remote'}</span>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <select
                      value={app.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: currentCfg.bg,
                        color: currentCfg.color,
                        border: `1px solid ${currentCfg.border}`,
                        outline: 'none',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st} style={{ background: '#141414', color: '#FFFFFF' }}>
                          {STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#777' }}>
                    <Calendar size={13} />
                    <span>{formatDate(app.appliedAt || app.createdAt)}</span>
                  </div>

                  {/* Actions: View Apply URL & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    {app.applyUrl && app.applyUrl !== '#' && (
                      <a
                        href={app.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Apply Link"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: '#161616',
                          border: '1px solid #282828',
                          color: '#A0A0A0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(app.id)}
                      title="Delete Application"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: '#161616',
                        border: '1px solid #282828',
                        color: '#777',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#777')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
