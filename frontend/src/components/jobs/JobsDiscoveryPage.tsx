import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResumeAnalysisResult,
  ScoredJobMatch,
  JobSearchParams,
  ResumeProfileData,
  CandidatePreferences,
  SuggestedRoleChip,
} from '../../types';
import {
  searchJobsApi,
  updateResumePreferencesApi,
  getSavedJobsApi,
  interactJobApi,
  createApplicationApi,
} from '../../services/api';
import { JobCard } from './JobCard';
import { JobDetailDrawer } from './JobDetailDrawer';
import { JobPreferencesModal } from './JobPreferencesModal';
import { AppliedPromptModal } from './AppliedPromptModal';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Wifi,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  Briefcase,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react';

interface JobsDiscoveryPageProps {
  analysis?: ResumeAnalysisResult | null;
  onTailorJob: (match: ScoredJobMatch) => void;
  onNavigateTab?: (tab: string, meta?: any) => void;
  userId?: string;
}

class JobsDiscoveryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('JobsDiscovery error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '48px 24px',
            borderRadius: '16px',
            background: '#0D0D0D',
            border: '1px solid rgba(227, 27, 43, 0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            margin: '40px auto',
            maxWidth: '600px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(227, 27, 43, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E31B2B',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Job Discovery Encountered an Issue
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#999', margin: 0 }}>
            {this.state.error?.message || 'A temporary issue occurred while rendering job matches.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-red"
            style={{ marginTop: '10px', padding: '8px 20px', fontSize: '0.86rem' }}
          >
            Reload Jobs
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const JobsDiscoveryPageInner: React.FC<JobsDiscoveryPageProps> = ({
  analysis,
  onTailorJob,
  onNavigateTab,
  userId = 'anonymous_user',
}) => {
  // State: Matches, Loading, Errors, Tabs
  const [activeView, setActiveView] = useState<'all' | 'saved'>('all');
  const [matches, setMatches] = useState<ScoredJobMatch[]>([]);
  const [savedMatches, setSavedMatches] = useState<ScoredJobMatch[]>([]);
  const [profile, setProfile] = useState<ResumeProfileData | null>(null);
  const [suggestedRoles, setSuggestedRoles] = useState<SuggestedRoleChip[]>([]);
  const [selectedRoleChip, setSelectedRoleChip] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Filters & Search query
  const [roleQuery, setRoleQuery] = useState<string>('');
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [isRemoteOnly, setIsRemoteOnly] = useState<boolean>(false);
  const [minSalary, setMinSalary] = useState<number | undefined>(undefined);
  const [seniorityFilter, setSeniorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'match' | 'date'>('match');

  // Hidden job IDs
  const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set());

  // Collapsible section toggles
  const [isStrongOpen, setIsStrongOpen] = useState<boolean>(true);
  const [isWorthOpen, setIsWorthOpen] = useState<boolean>(true);
  const [isStretchOpen, setIsStretchOpen] = useState<boolean>(true);

  // Modals & Drawers
  const [selectedMatch, setSelectedMatch] = useState<ScoredJobMatch | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState<boolean>(false);

  // Applied Prompt (visibilitychange) state
  const [lastAppliedJob, setLastAppliedJob] = useState<{ match: ScoredJobMatch; clickedAt: number } | null>(null);
  const [showAppliedPrompt, setShowAppliedPrompt] = useState<boolean>(false);

  // Derive stable resume identifier
  const resumeId = useMemo(() => {
    return analysis?.id || analysis?.fileName || 'default-resume';
  }, [analysis]);

  // Initial Profile & Job Search on load
  const loadJobs = useCallback(
    async (overrideFilters?: Partial<JobSearchParams>) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const payload: JobSearchParams = {
          userId,
          resumeId,
          analysis: analysis || undefined,
          role: overrideFilters?.role !== undefined ? overrideFilters.role : roleQuery || undefined,
          location:
            overrideFilters?.location !== undefined ? overrideFilters.location : locationQuery || undefined,
          isRemote:
            overrideFilters?.isRemote !== undefined ? overrideFilters.isRemote : isRemoteOnly || undefined,
          minSalary:
            overrideFilters?.minSalary !== undefined ? overrideFilters.minSalary : minSalary || undefined,
          country: overrideFilters?.country || profile?.preferences?.countryCode || 'in',
          seniority: seniorityFilter !== 'all' ? seniorityFilter : undefined,
        };

        const response = await searchJobsApi(payload);
        const rawMatches = Array.isArray(response?.matches) ? response.matches : [];
        const fetchedMatches = rawMatches
          .filter((m: any) => m && m.job)
          .map((m: any) => ({
            ...m,
            isSaved: Boolean(m.isSaved),
          }));
        setMatches(fetchedMatches);

        if (response?.suggestedRoles && Array.isArray(response.suggestedRoles)) {
          setSuggestedRoles(response.suggestedRoles);
        }

        if (response?.profile) {
          setProfile(response.profile);
          if (!roleQuery && response.profile.preferences?.targetRole) {
            setRoleQuery(response.profile.preferences.targetRole);
          }
          // Default the city from the profile
          if (!locationQuery) {
            const defaultCity = response.profile.location || response.profile.preferences?.location;
            if (defaultCity) setLocationQuery(defaultCity);
          }
        }
      } catch (err: any) {
        console.error('Job search failed:', err);
        setErrorMessage(
          err.message || 'Unable to fetch matched jobs. Please check your connection and try again.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, resumeId, analysis, roleQuery, locationQuery, isRemoteOnly, minSalary, seniorityFilter, profile]
  );

  // Load Saved Jobs
  const loadSavedJobs = async () => {
    try {
      const savedJobs = await getSavedJobsApi(userId);
      if (!Array.isArray(savedJobs)) return;
      const converted: ScoredJobMatch[] = savedJobs
        .filter((j) => j && j.id)
        .map((j) => ({
          job: j,
          overallScore: 80,
          matchedSkills: [],
          missingRequirements: { mustHave: [], niceToHave: [] },
          recommendations: [],
          limitedDescription: false,
          isSaved: true,
        }));
      setSavedMatches(converted);
    } catch (err) {
      console.warn('Failed to load saved jobs:', err);
    }
  };

  useEffect(() => {
    loadJobs();
    loadSavedJobs();
  }, []);

  // Listen for tab return (visibilitychange) to trigger "Did you apply?" prompt
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastAppliedJob) {
        const timeElapsed = Date.now() - lastAppliedJob.clickedAt;
        // If user returned after at least 3 seconds away
        if (timeElapsed > 3000) {
          setShowAppliedPrompt(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastAppliedJob]);

  // Handle Applied prompt "Yes"
  const handleConfirmApplied = async () => {
    if (!lastAppliedJob) return;
    try {
      await createApplicationApi({
        userId,
        resumeId,
        jobId: lastAppliedJob.match.job.id,
        jobTitle: lastAppliedJob.match.job.title,
        company: lastAppliedJob.match.job.company,
        location: lastAppliedJob.match.job.location,
        applyUrl: lastAppliedJob.match.job.finalUrl || lastAppliedJob.match.job.applyUrl,
        status: 'applied',
      });
    } catch (err) {
      console.error('Failed to mark applied status:', err);
    } finally {
      setShowAppliedPrompt(false);
      setLastAppliedJob(null);
    }
  };

  // Toggle Save Job
  const handleToggleSave = async (match: ScoredJobMatch) => {
    const isCurrentlySaved = match.isSaved;
    const action = isCurrentlySaved ? 'unsave' : 'save';

    // Optimistic UI update
    setMatches((prev) =>
      prev.map((m) => (m.job.id === match.job.id ? { ...m, isSaved: !isCurrentlySaved } : m))
    );

    try {
      await interactJobApi(match.job.id, action, userId, resumeId);
      loadSavedJobs();
    } catch (err) {
      console.error('Failed to update save status:', err);
    }
  };

  // Hide Job
  const handleHideJob = async (match: ScoredJobMatch) => {
    setHiddenJobIds((prev) => new Set([...prev, match.job.id]));
    try {
      await interactJobApi(match.job.id, 'hide', userId, resumeId);
    } catch (err) {
      console.error('Failed to hide job:', err);
    }
  };

  // Suggested role chip toggle
  const handleRoleChipClick = (role: string) => {
    if (selectedRoleChip === role) {
      setSelectedRoleChip(null);
      setRoleQuery('');
      loadJobs({ role: '' });
    } else {
      setSelectedRoleChip(role);
      setRoleQuery(role);
      loadJobs({ role });
    }
  };

  // Navigate to Keywords or Resume Optimizer on missing skill chip click
  const handleSelectMissingSkill = (skill: string) => {
    if (onNavigateTab) {
      onNavigateTab('keywords', { query: skill });
    }
  };

  // Navigate to Resume View on matched skill chip click
  const handleSelectMatchedSkill = (skill: string) => {
    if (onNavigateTab) {
      onNavigateTab('resume-analysis', { highlightSkill: skill });
    }
  };

  // Filtered & Sorted Matches
  const displayedMatches = useMemo(() => {
    let source = (activeView === 'saved' ? savedMatches : matches) || [];

    // Filter out invalid items or hidden jobs
    let result = source.filter((m) => m && m.job && m.job.id && !hiddenJobIds.has(m.job.id));

    // Filter by Remote
    if (isRemoteOnly) {
      result = result.filter((m) => Boolean(m.job?.isRemote));
    }

    // Filter by Seniority
    if (seniorityFilter !== 'all') {
      result = result.filter(
        (m) => m.seniorityTier === seniorityFilter || m.job?.seniority === seniorityFilter
      );
    }

    // Filter by Min Salary
    if (minSalary && minSalary > 0) {
      result = result.filter((m) => (m.job?.salaryMax || m.job?.salaryMin || 0) >= minSalary);
    }

    // Sort
    if (sortBy === 'match') {
      result.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    } else if (sortBy === 'date') {
      result.sort((a, b) => {
        const dateB = b.job?.postedAt ? new Date(b.job.postedAt).getTime() : 0;
        const dateA = a.job?.postedAt ? new Date(a.job.postedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [activeView, savedMatches, matches, hiddenJobIds, isRemoteOnly, seniorityFilter, minSalary, sortBy]);

  // Grouping into Strong Match (70+), Worth a Shot (50-69), and Stretch (<50)
  const strongMatches = useMemo(() => displayedMatches.filter((m) => (m.overallScore || 0) >= 70), [displayedMatches]);
  const worthMatches = useMemo(
    () => displayedMatches.filter((m) => (m.overallScore || 0) >= 50 && (m.overallScore || 0) < 70),
    [displayedMatches]
  );
  const stretchMatches = useMemo(() => displayedMatches.filter((m) => (m.overallScore || 0) < 50), [displayedMatches]);

  // Card click -> open detail drawer
  const handleCardClick = (match: ScoredJobMatch) => {
    setSelectedMatch(match);
    setIsDrawerOpen(true);
  };

  // Tailor action -> trigger parent handoff
  const handleTailorJob = (match: ScoredJobMatch) => {
    setIsDrawerOpen(false);
    onTailorJob(match);
  };

  // Save Preferences Modal
  const handleSavePreferences = async (updated: CandidatePreferences) => {
    setIsSavingPreferences(true);
    try {
      await updateResumePreferencesApi(resumeId, updated);
      if (profile) {
        setProfile({ ...profile, preferences: updated });
      }
      setIsPreferencesOpen(false);

      if (updated.targetRole) setRoleQuery(updated.targetRole);
      if (updated.location) setLocationQuery(updated.location);
      if (updated.workplaceType === 'remote') setIsRemoteOnly(true);
      else setIsRemoteOnly(false);
      if (updated.salaryMin) setMinSalary(updated.salaryMin);

      loadJobs({
        role: updated.targetRole,
        location: updated.location,
        isRemote: updated.workplaceType === 'remote',
        minSalary: updated.salaryMin,
        country: updated.countryCode,
      });
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 animate-fade-in">
      {/* Top Header & Extracted Resume Context */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderBottom: '1px solid #202020',
          paddingBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'rgba(227, 27, 43, 0.15)',
                  border: '1px solid rgba(227, 27, 43, 0.3)',
                  color: '#E31B2B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} />
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
                Job Match & Discovery
              </h1>
              <span
                style={{
                  background: '#E31B2B',
                  color: '#FFFFFF',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                TOP 20 MATCHED
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#9A9A9A', margin: 0 }}>
              Live listings from job boards scored against your verified resume competencies.
            </p>
          </div>

          {/* Quick Actions: Preferences & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsPreferencesOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#141414',
                border: '1px solid #282828',
                color: '#E0E0E0',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#404040';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#282828';
                e.currentTarget.style.color = '#E0E0E0';
              }}
            >
              <SlidersHorizontal size={14} color="#E31B2B" />
              <span>Job Preferences</span>
            </button>

            <button
              onClick={() => {
                setIsRefreshing(true);
                loadJobs();
              }}
              disabled={isLoading || isRefreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#141414',
                border: '1px solid #282828',
                color: '#B0B0B0',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-red-500' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Extracted Profile Snippet Pills */}
        {profile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#111111',
              border: '1px solid #1E1E1E',
              fontSize: '0.8rem',
              color: '#8E8E8E',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#D0D0D0', fontWeight: 600 }}>
              <UserCheck size={13} color="#10B981" />
              Inferred Profile:
            </span>
            {profile.titles?.length > 0 && (
              <span style={{ color: '#FFFFFF', background: '#1A1A1A', padding: '2px 8px', borderRadius: '4px' }}>
                Role: {profile.titles[0]}
              </span>
            )}
            {profile.yearsExperience > 0 && (
              <span style={{ color: '#E0E0E0', background: '#1A1A1A', padding: '2px 8px', borderRadius: '4px' }}>
                Exp: {profile.yearsExperience}+ yrs
              </span>
            )}
            {profile.seniority && (
              <span
                style={{
                  color: '#C084FC',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  fontWeight: 700,
                }}
              >
                Inferred Level: {profile.seniority}
              </span>
            )}
            {profile.location && (
              <span style={{ color: '#E0E0E0', background: '#1A1A1A', padding: '2px 8px', borderRadius: '4px' }}>
                City: {profile.location}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: '#666' }}>
              Derived from skills & titles &bull; Zero company bias
            </span>
          </div>
        )}

        {/* Suggested Role Chips */}
        {suggestedRoles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: 600 }}>Suggested Roles:</span>
            {suggestedRoles.map((chip, cIdx) => {
              const roleName = typeof chip === 'string' ? chip : (chip as any)?.role || '';
              if (!roleName) return null;
              const isActive =
                selectedRoleChip === roleName ||
                (Boolean(roleQuery) && roleQuery.trim().toLowerCase() === roleName.trim().toLowerCase());
              return (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleRoleChipClick(roleName)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isActive ? '1px solid #E31B2B' : '1px solid #282828',
                    background: isActive ? 'rgba(227, 27, 43, 0.15)' : '#141414',
                    color: isActive ? '#FFFFFF' : '#999999',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {roleName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Tabs: All Matches vs Saved Jobs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setActiveView('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeView === 'all' ? '1px solid #E31B2B' : '1px solid #242424',
            background: activeView === 'all' ? 'rgba(227, 27, 43, 0.15)' : '#111111',
            color: activeView === 'all' ? '#FFFFFF' : '#888888',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={14} color={activeView === 'all' ? '#E31B2B' : '#777'} />
          <span>All Matches ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveView('saved')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeView === 'saved' ? '1px solid #E31B2B' : '1px solid #242424',
            background: activeView === 'saved' ? 'rgba(227, 27, 43, 0.15)' : '#111111',
            color: activeView === 'saved' ? '#FFFFFF' : '#888888',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Bookmark size={14} color={activeView === 'saved' ? '#E31B2B' : '#777'} />
          <span>Saved Jobs ({savedMatches.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar: Separated City from Remote */}
      <div
        style={{
          background: '#0D0D0D',
          border: '1px solid #242424',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {/* Target Role Input */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flex: '1 1 200px',
              minWidth: '180px',
            }}
          >
            <Search size={15} color="#777" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
              placeholder="Search target role..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: '#141414',
                border: '1px solid #282828',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Location Input (City) */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flex: '1 1 160px',
              minWidth: '140px',
            }}
          >
            <MapPin size={15} color="#777" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
              placeholder="City..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: '#141414',
                border: '1px solid #282828',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => loadJobs()}
            className="btn btn-red"
            style={{ padding: '8px 16px', fontSize: '0.84rem', fontWeight: 700 }}
          >
            <span>Search</span>
          </button>

          {/* Split Remote Toggle */}
          <button
            type="button"
            onClick={() => setIsRemoteOnly(!isRemoteOnly)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: isRemoteOnly ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #282828',
              background: isRemoteOnly ? 'rgba(16, 185, 129, 0.12)' : '#141414',
              color: isRemoteOnly ? '#34D399' : '#999',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Wifi size={13} />
            <span>Remote Only</span>
          </button>

          {/* Seniority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#777' }}>Level:</span>
            <select
              value={seniorityFilter}
              onChange={(e) => setSeniorityFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                background: '#141414',
                border: '1px solid #282828',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Levels</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Principal</option>
            </select>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#777', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={13} />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'match' | 'date')}
            style={{
              padding: '6px 10px',
              background: '#141414',
              border: '1px solid #282828',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="match">Highest Match Score</option>
            <option value="date">Most Recent First</option>
          </select>
        </div>
      </div>

      {/* Content State: Loading, Error, Empty, or Results */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={`skel_${n}`}
              style={{
                padding: '24px',
                borderRadius: '16px',
                background: '#0D0D0D',
                border: '1px solid #202020',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'pulse 1.8s infinite ease-in-out',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '40%', height: '20px', background: '#1C1C1C', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ width: '25%', height: '14px', background: '#161616', borderRadius: '4px' }} />
                </div>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1A1A1A' }} />
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div
          style={{
            padding: '48px 24px',
            borderRadius: '16px',
            background: '#0D0D0D',
            border: '1px solid rgba(227, 27, 43, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(227, 27, 43, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E31B2B',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            Unable to Load Jobs
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#999', maxWidth: '480px', margin: 0 }}>
            {errorMessage}
          </p>
          <button
            onClick={() => loadJobs()}
            className="btn btn-red"
            style={{ marginTop: '8px', padding: '8px 20px', fontSize: '0.86rem' }}
          >
            <RefreshCw size={14} />
            <span>Retry Search</span>
          </button>
        </div>
      ) : displayedMatches.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            borderRadius: '16px',
            background: '#0D0D0D',
            border: '1px solid #202020',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#161616',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
            }}
          >
            <Briefcase size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            {activeView === 'saved' ? 'No saved jobs yet' : 'No matching jobs found'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#888', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
            {activeView === 'saved'
              ? 'Click the bookmark icon on any job card to save listings here.'
              : 'Try selecting a suggested role chip or clearing the location filter.'}
          </p>
          {activeView === 'all' && (
            <button
              onClick={() => {
                setRoleQuery('');
                setLocationQuery('');
                setIsRemoteOnly(false);
                setSeniorityFilter('all');
                loadJobs({ role: '', location: '', isRemote: false });
              }}
              style={{
                marginTop: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#1A1A1A',
                border: '1px solid #333',
                color: '#FFF',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Collapsible Results Sections: Strong match (70+), Worth a shot (50-69), Stretch (<50) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: Strong Match (70+) */}
          {strongMatches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                onClick={() => setIsStrongOpen(!isStrongOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: '#111111',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Flame size={18} color="#10B981" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Strong Match (70+)
                  </span>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34D399',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {strongMatches.length}
                  </span>
                </div>
                {isStrongOpen ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
              </div>

              {isStrongOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {strongMatches.map((match, idx) => (
                    <JobCard
                      key={match.job.id}
                      match={match}
                      index={idx}
                      userId={userId}
                      onClick={handleCardClick}
                      onTailor={handleTailorJob}
                      onToggleSave={handleToggleSave}
                      onHide={handleHideJob}
                      onSelectMissingSkill={handleSelectMissingSkill}
                      onSelectMatchedSkill={handleSelectMatchedSkill}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Worth a shot (50-69) */}
          {worthMatches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                onClick={() => setIsWorthOpen(!isWorthOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: '#111111',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={18} color="#F59E0B" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Worth a Shot (50-69)
                  </span>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#FBBF24',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {worthMatches.length}
                  </span>
                </div>
                {isWorthOpen ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
              </div>

              {isWorthOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {worthMatches.map((match, idx) => (
                    <JobCard
                      key={match.job.id}
                      match={match}
                      index={idx}
                      userId={userId}
                      onClick={handleCardClick}
                      onTailor={handleTailorJob}
                      onToggleSave={handleToggleSave}
                      onHide={handleHideJob}
                      onSelectMissingSkill={handleSelectMissingSkill}
                      onSelectMatchedSkill={handleSelectMatchedSkill}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Stretch (<50) */}
          {stretchMatches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                onClick={() => setIsStretchOpen(!isStretchOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: '#111111',
                  border: '1px solid rgba(227, 27, 43, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="#E31B2B" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Stretch (&lt;50)
                  </span>
                  <span
                    style={{
                      background: 'rgba(227, 27, 43, 0.15)',
                      border: '1px solid rgba(227, 27, 43, 0.3)',
                      color: '#FF6B75',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {stretchMatches.length}
                  </span>
                </div>
                {isStretchOpen ? <ChevronUp size={18} color="#888" /> : <ChevronDown size={18} color="#888" />}
              </div>

              {isStretchOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {stretchMatches.map((match, idx) => (
                    <JobCard
                      key={match.job.id}
                      match={match}
                      index={idx}
                      userId={userId}
                      onClick={handleCardClick}
                      onTailor={handleTailorJob}
                      onToggleSave={handleToggleSave}
                      onHide={handleHideJob}
                      onSelectMissingSkill={handleSelectMissingSkill}
                      onSelectMatchedSkill={handleSelectMatchedSkill}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Side Detail Drawer */}
      <JobDetailDrawer
        isOpen={isDrawerOpen}
        match={selectedMatch}
        userId={userId}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedMatch(null);
        }}
        onTailor={handleTailorJob}
        onToggleSave={handleToggleSave}
        onHide={handleHideJob}
      />

      {/* Preferences Modal */}
      {profile && (
        <JobPreferencesModal
          isOpen={isPreferencesOpen}
          preferences={profile.preferences || {}}
          onClose={() => setIsPreferencesOpen(false)}
          onSave={handleSavePreferences}
          isLoading={isSavingPreferences}
        />
      )}

      {/* Visibilitychange Applied Prompt */}
      {lastAppliedJob && (
        <AppliedPromptModal
          isOpen={showAppliedPrompt}
          jobTitle={lastAppliedJob.match.job.title}
          company={lastAppliedJob.match.job.company}
          onYesApplied={handleConfirmApplied}
          onNotYet={() => {
            setShowAppliedPrompt(false);
            setLastAppliedJob(null);
          }}
        />
      )}
    </div>
  );
};

export const JobsDiscoveryPage: React.FC<JobsDiscoveryPageProps> = (props) => (
  <JobsDiscoveryErrorBoundary>
    <JobsDiscoveryPageInner {...props} />
  </JobsDiscoveryErrorBoundary>
);
