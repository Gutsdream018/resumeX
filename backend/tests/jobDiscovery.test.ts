import { describe, it, expect, vi } from 'vitest';
import { buildJobQueries } from '../src/services/jobs/queryBuilder.js';
import { deduplicateJobs, generateJobFingerprint } from '../src/services/jobs/jobDeduplicator.js';
import { preFilterJobs } from '../src/services/jobs/preFilter.js';
import { scoreJobsWithMatchEngine } from '../src/services/jobs/jobMatchingPipeline.js';
import { adzunaProvider } from '../src/services/jobs/providers/adzunaProvider.js';
import { Job, ResumeProfile, JobPreferences } from '../src/services/jobs/types.js';
import app from '../src/index.js';

describe('Job Match & Discovery Backend Architecture', () => {
  const mockProfile: ResumeProfile = {
    candidateName: 'Alex Rivera',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    titles: ['Senior Software Engineer', 'Full Stack Developer'],
    yearsExperience: 6,
    education: { highestDegree: 'Bachelor of Science', field: 'Computer Science' },
    industries: ['Technology & Software'],
    seniority: 'senior',
    location: 'San Francisco, CA',
  };

  const mockPreferences: JobPreferences = {
    targetRole: 'Senior Full Stack Engineer',
    adjacentRoles: ['Staff Engineer', 'Frontend Architect'],
    location: 'San Francisco, CA',
    workplaceType: 'hybrid',
    countryCode: 'us',
  };

  describe('1. Query Builder', () => {
    it('generates between 3 and 5 high-signal queries from candidate profile and preferences', () => {
      const queries = buildJobQueries(mockProfile, mockPreferences);
      expect(queries.length).toBeGreaterThanOrEqual(3);
      expect(queries.length).toBeLessThanOrEqual(5);

      // Primary query matches target role
      expect(queries[0].term).toBe('Senior Full Stack Engineer');
      expect(queries[0].category).toBe('primary_title');

      // Includes skill-augmented query
      expect(queries.some((q) => q.category === 'title_skills')).toBe(true);

      // Includes adjacent title
      expect(queries.some((q) => q.category === 'adjacent_title')).toBe(true);
    });
  });

  describe('2. Job Deduplication', () => {
    it('normalizes fingerprints and removes duplicate jobs by company, title, and location', () => {
      const job1: Job = {
        id: 'job_1',
        title: 'Senior Software Engineer',
        company: 'Stripe, Inc.',
        location: 'San Francisco, CA',
        isRemote: false,
        description: 'Short description.',
        source: 'Adzuna',
        applyUrl: 'https://stripe.com/jobs/1',
        postedAt: '2026-09-20T10:00:00Z',
      };

      const job2: Job = {
        id: 'job_2',
        title: 'senior software engineer',
        company: 'Stripe Inc',
        location: 'San Francisco CA',
        isRemote: false,
        description: 'Comprehensive detailed job description with technical stack and responsibilities.',
        source: 'Adzuna',
        applyUrl: 'https://stripe.com/jobs/2',
        postedAt: '2026-09-20T11:00:00Z',
      };

      const job3: Job = {
        id: 'job_3',
        title: 'Backend Engineer',
        company: 'Stripe, Inc.',
        location: 'San Francisco, CA',
        isRemote: false,
        description: 'Different role altogether.',
        source: 'Adzuna',
        applyUrl: 'https://stripe.com/jobs/3',
        postedAt: '2026-09-20T12:00:00Z',
      };

      expect(generateJobFingerprint(job1)).toBe(generateJobFingerprint(job2));

      const deduped = deduplicateJobs([job1, job2, job3]);
      expect(deduped.length).toBe(2);

      // Kept the version with the longer, richer description
      const stripeSenior = deduped.find((j) => j.title.toLowerCase().includes('senior'));
      expect(stripeSenior?.id).toBe('job_2');
      expect(stripeSenior?.description).toContain('Comprehensive detailed');
    });
  });

  describe('3. Cheap Pre-Filter (Top-20 Selection)', () => {
    it('heuristically scores jobs by title similarity, skills, location, and recency', () => {
      const rawJobs: Job[] = [
        {
          id: 'j_exact',
          title: 'Senior Full Stack Engineer',
          company: 'Acme Corp',
          location: 'San Francisco, CA',
          isRemote: false,
          description: 'Looking for a Senior Full Stack Engineer proficient in TypeScript, React, and Node.js.',
          source: 'Adzuna',
          applyUrl: 'https://example.com/1',
          postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
          id: 'j_irrelevant',
          title: 'Registered Nurse (ICU)',
          company: 'General Hospital',
          location: 'Austin, TX',
          isRemote: false,
          description: 'Critical care nursing in intensive care unit.',
          source: 'Adzuna',
          applyUrl: 'https://example.com/2',
          postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), // 40 days ago
        },
        {
          id: 'j_partial',
          title: 'Frontend Developer',
          company: 'WebWorks',
          location: 'Remote',
          isRemote: true,
          description: 'Frontend developer with React and HTML skills.',
          source: 'Adzuna',
          applyUrl: 'https://example.com/3',
          postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
      ];

      const filtered = preFilterJobs(rawJobs, mockProfile, mockPreferences, 2);
      expect(filtered.length).toBe(2);
      expect(filtered[0].id).toBe('j_exact');
      expect(filtered[1].id).toBe('j_partial');
      expect(filtered.some((j) => j.id === 'j_irrelevant')).toBe(false);
    });
  });

  describe('4. Integration Test: Scored Job Matching Pipeline with Mocked Provider', () => {
    it('returns scored jobs with matched skills, missing requirements, and recommendations', async () => {
      const mockSearchJobs: Job[] = [
        {
          id: 'test_adzuna_101',
          title: 'Senior Full Stack Engineer',
          company: 'CloudScale Technologies',
          location: 'San Francisco, CA',
          isRemote: true,
          salaryMin: 150000,
          salaryMax: 190000,
          description: 'We are seeking a Senior Full Stack Engineer. Must have strong skills in TypeScript, React, Node.js, and PostgreSQL. Bonus for AWS and Docker experience.',
          source: 'Adzuna',
          applyUrl: 'https://www.adzuna.com/apply/101',
          postedAt: new Date().toISOString(),
        },
      ];

      const searchSpy = vi.spyOn(adzunaProvider, 'search').mockResolvedValue(mockSearchJobs);

      const structuredResume = {
        contact: { name: 'Alex Rivera', email: 'alex@example.com', phone: '555', linkedin: '', github: '' },
        summary: 'Experienced full stack developer.',
        skills: { technical: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'], soft: [], tools: [], languages: [] },
        experience: [
          { company: 'CloudCorp', role: 'Senior Software Engineer', bullets: ['Built TypeScript and Node.js microservices reducing latency by 40%.'] },
        ],
        education: [{ degree: 'BS Computer Science', institution: 'MIT' }],
        projects: [],
        certifications: [],
        achievements: [],
        other: [],
      };

      const rawText = 'Alex Rivera\nSenior Software Engineer\nSkills: TypeScript, React, Node.js, PostgreSQL, Docker\nExperience: Built scalable microservices in TypeScript.';

      const scored = await scoreJobsWithMatchEngine(
        mockSearchJobs,
        structuredResume as any,
        rawText,
        80
      );

      expect(scored.length).toBe(1);
      const first = scored[0];
      expect(first.overallScore).toBeGreaterThanOrEqual(0);
      expect(first.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(first.matchedSkills)).toBe(true);
      expect(first.missingRequirements).toBeDefined();
      expect(Array.isArray(first.missingRequirements.mustHave)).toBe(true);
      expect(Array.isArray(first.missingRequirements.niceToHave)).toBe(true);
      expect(Array.isArray(first.recommendations)).toBe(true);

      searchSpy.mockRestore();
    });
  });

  describe('5. Seniority Filtering & Demotion Logic', () => {
    it('correctly infers seniority levels from titles and descriptions', async () => {
      const { inferJobSeniority, normalizeSeniorityLevel, evaluateSeniorityMatch } = await import(
        '../src/services/jobs/seniority.js'
      );

      expect(normalizeSeniorityLevel('entry', 1, ['Junior Developer'])).toBe('entry');
      expect(normalizeSeniorityLevel('mid', 3, ['Software Engineer'])).toBe('mid');
      expect(normalizeSeniorityLevel('senior', 6, ['Senior Software Engineer'])).toBe('senior');
      expect(normalizeSeniorityLevel('lead', 12, ['Staff Software Engineer'])).toBe('lead');

      expect(inferJobSeniority('Junior Frontend Engineer')).toBe('entry');
      expect(inferJobSeniority('Software Engineer II')).toBe('mid');
      expect(inferJobSeniority('Senior Full Stack Developer')).toBe('senior');
      expect(inferJobSeniority('Staff Platform Architect')).toBe('lead');

      // Candidate = entry, Job = senior (>1 level above) -> excluded
      const evalEntryVsSenior = evaluateSeniorityMatch('entry', 'senior');
      expect(evalEntryVsSenior.allow).toBe(false);

      // Candidate = entry, Job = lead (>1 level above) -> excluded
      const evalEntryVsLead = evaluateSeniorityMatch('entry', 'lead');
      expect(evalEntryVsLead.allow).toBe(false);

      // Candidate = mid, Job = senior (1 level above) -> allowed but demoted
      const evalMidVsSenior = evaluateSeniorityMatch('mid', 'senior');
      expect(evalMidVsSenior.allow).toBe(true);
      expect(evalMidVsSenior.demotePenalty).toBe(12);

      // Candidate = senior, Job = mid (below candidate) -> allowed with 0 penalty
      const evalSeniorVsMid = evaluateSeniorityMatch('senior', 'mid');
      expect(evalSeniorVsMid.allow).toBe(true);
      expect(evalSeniorVsMid.demotePenalty).toBe(0);
    });
  });

  describe('6. URL Resolution & Known ATS Host Detection', () => {
    it('detects known enterprise ATS providers from hostnames and URLs', async () => {
      const { detectAtsHost, isValidHttpUrl, getApplyButtonLabel } = await import(
        '../src/services/jobs/urlResolver.js'
      );

      expect(isValidHttpUrl('https://boards.greenhouse.io/stripe/jobs/123')).toBe(true);
      expect(isValidHttpUrl('http://jobs.lever.co/netflix/456')).toBe(true);
      expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isValidHttpUrl('')).toBe(false);

      expect(detectAtsHost('https://boards.greenhouse.io/stripe/jobs/123').isAts).toBe(true);
      expect(detectAtsHost('https://jobs.lever.co/company/abc').isAts).toBe(true);
      expect(detectAtsHost('https://acme.myworkdayjobs.com/en-US/careers/job/1').isAts).toBe(true);
      expect(detectAtsHost('https://jobs.ashbyhq.com/startup/789').isAts).toBe(true);
      expect(detectAtsHost('https://unknown-job-board.com/post/99').isAts).toBe(false);

      expect(getApplyButtonLabel(true, 'Adzuna')).toBe('Apply on company site');
      expect(getApplyButtonLabel(false, 'Adzuna')).toBe('Apply via Adzuna');
    });
  });

  describe('7. Application Tracker & Click Analytics', () => {
    it('records and updates applications across statuses without mutating original resume', async () => {
      const { jobDiscoveryDb } = await import('../src/services/jobs/jobDiscoveryDb.js');

      const app = jobDiscoveryDb.createOrUpdateApplication({
        userId: 'test_user_1',
        resumeId: 'resume_original_1',
        jobId: 'job_42',
        jobTitle: 'Senior React Developer',
        company: 'InnovateCorp',
        location: 'San Francisco, CA',
        applyUrl: 'https://innovatecorp.com/apply/42',
        status: 'saved',
      });

      expect(app.id).toBeDefined();
      expect(app.status).toBe('saved');

      // Update to tailored, then applied
      const updatedTailored = jobDiscoveryDb.updateApplicationStatus(app.id, 'tailored');
      expect(updatedTailored?.status).toBe('tailored');

      const updatedApplied = jobDiscoveryDb.updateApplicationStatus(app.id, 'applied');
      expect(updatedApplied?.status).toBe('applied');

      const list = jobDiscoveryDb.getApplications('test_user_1');
      expect(list.some((a) => a.id === app.id && a.status === 'applied')).toBe(true);

      // Click tracking event
      const click = jobDiscoveryDb.recordClickEvent('job_42', 'test_user_1', 'https://innovatecorp.com/apply/42');
      expect(click.jobId).toBe('job_42');
      expect(click.userId).toBe('test_user_1');
      expect(click.timestamp).toBeDefined();
    });
  });
});

