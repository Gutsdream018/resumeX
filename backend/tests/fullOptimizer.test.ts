import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSharedContext,
  optimizeBulletStatement,
  optimizeSummarySection,
  optimizeExperienceSection,
  optimizeSkillsSection,
  optimizeEducationSection,
  applyOptimizationsToResume,
  executeFullOptimization,
} from '../src/engine/optimizer/fullOptimizationEngine.js';
import { fullOptimizationService } from '../src/services/optimizer/fullOptimizationService.js';
import { CanonicalResume } from '../src/engine/ingestion/types.js';
import { FullOptimizationJob } from '../src/engine/optimizer/fullOptimizerTypes.js';

const mockSampleResume: CanonicalResume = {
  document: { type: 'TEXT_PDF', pageCount: 1, extractionConfidence: 0.95 },
  contact: {
    name: 'Alex Rivera',
    title: 'Senior Software Engineer',
    email: 'alex.rivera@example.com',
    phone: '(555) 019-2834',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexrivera',
    github: 'github.com/alexrivera',
    portfolio: null,
  },
  summary: 'Experienced developer building web services and distributed systems.',
  experience: [
    {
      company: 'TechFlow Systems',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2022-01',
      endDate: 'Present',
      isCurrent: true,
      bullets: [
        'Responsible for backend microservices in Node.js and TypeScript.',
        'Helped with PostgreSQL database performance tuning reducing latency by 35% across 500,000 active users.',
        'Worked on Redis caching layer to handle peak traffic.',
      ],
      technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
    },
    {
      company: 'CloudScale Inc',
      title: 'Software Engineer',
      location: 'Austin, TX',
      startDate: '2020-03',
      endDate: '2021-12',
      isCurrent: false,
      bullets: [
        'Assisted in deploying Docker containers to AWS infrastructure.',
        'Handled customer bug fixes and implemented REST APIs.',
      ],
      technologies: ['Docker', 'AWS', 'REST APIs'],
    },
  ],
  projects: [
    {
      name: 'Distributed Task Queue',
      description: 'Built a resilient task queue using Redis and Go.',
      technologies: ['Go', 'Redis', 'Docker'],
      bullets: ['Implemented leader election algorithm for cluster worker nodes.'],
    },
  ],
  skills: {
    technical: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Go'],
    frameworks: ['Express', 'React'],
    databases: ['PostgreSQL', 'Redis'],
    tools: ['Git', 'Docker'],
    domain: ['Microservices', 'Distributed Systems'],
    soft: ['Leadership', 'System Design'],
  },
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of California, Berkeley',
      graduationDate: '2020',
      gpa: '3.8',
    },
  ],
  certifications: [],
  achievements: [],
};

const mockJobDescription = `
Senior Backend Engineer at Stripe
Requirements:
- 5+ years building scalable microservices in Node.js, TypeScript or Go.
- Strong experience with PostgreSQL and Redis caching.
- Deep expertise in Kubernetes (K8s) and GraphQL orchestration.
- Proven experience with Kafka event-driven architectures.
`;

describe('Full Resume Optimization Engine (Phase 1)', () => {
  it('builds shared context across sections and extracts supported vs unsupported requirements in tailored mode', () => {
    const context = buildSharedContext(mockSampleResume, 'tailored', mockJobDescription, 'Senior Backend Engineer', 'Stripe');

    expect(context.candidateName).toBe('Alex Rivera');
    expect(context.mode).toBe('tailored');
    expect(context.targetJob).toBeDefined();

    // Supported keywords should be present in candidate resume
    expect(context.targetJob?.supportedKeywords).toContain('TypeScript');
    expect(context.targetJob?.supportedKeywords).toContain('PostgreSQL');

    // Unsupported requirements must be listed as gaps and NOT claimed in resume
    expect(context.targetJob?.unsupportedGaps).toContain('Kubernetes');
    expect(context.targetJob?.unsupportedGaps).toContain('GraphQL');
  });

  it('restructures bullets using Google XYZ and power action verbs', () => {
    const context = buildSharedContext(mockSampleResume, 'ats_general');
    const bullet = mockSampleResume.experience[0].bullets[0]; // "Responsible for backend microservices in Node.js and TypeScript."

    const optimized = optimizeBulletStatement(bullet, 'experience', 'TechFlow Systems', context, true);

    expect(optimized.originalText).toBe(bullet);
    // Should replace "Responsible for" with a strong power verb
    expect(optimized.newText).not.toMatch(/^responsible for/i);
    expect(optimized.newText).toMatch(/Spearheads and delivers|Architected|Engineered/i);
    expect(optimized.reason).toBeDefined();
    expect(optimized.evidence).toBeDefined();
  });

  it('ZERO HALLUCINATION: preserves existing metrics and inserts [X%] or [N users] placeholders when metrics are absent', () => {
    const context = buildSharedContext(mockSampleResume, 'ats_general');

    // Bullet WITH metrics: "35% across 500,000 active users"
    const bulletWithMetrics = mockSampleResume.experience[0].bullets[1];
    const optWithMetrics = optimizeBulletStatement(bulletWithMetrics, 'experience', 'TechFlow', context, false);
    expect(optWithMetrics.newText).toContain('35%');
    expect(optWithMetrics.newText).toContain('500,000 active users');
    expect(optWithMetrics.needsUserNumber).toBe(false);

    // Bullet WITHOUT metrics: "Worked on Redis caching layer to handle peak traffic."
    const bulletWithoutMetrics = mockSampleResume.experience[0].bullets[2];
    const optWithoutMetrics = optimizeBulletStatement(bulletWithoutMetrics, 'experience', 'TechFlow', context, false);
    expect(optWithoutMetrics.needsUserNumber).toBe(true);
    // Must contain explicit placeholder [X%] or [N users]
    const hasPlaceholder = optWithoutMetrics.placeholders.some((p) => p === '[X%]' || p === '[N users]');
    expect(hasPlaceholder).toBe(true);
    expect(optWithoutMetrics.newText).toMatch(/\[X%\]|\[N users\]/);
  });

  it('PROTECTED FIELDS IMMUTABILITY: preserves candidate name, companies, titles, dates, and degrees byte-identically', () => {
    const context = buildSharedContext(mockSampleResume, 'ats_general');
    const expResult = optimizeExperienceSection(mockSampleResume, context);
    const summaryResult = optimizeSummarySection(mockSampleResume, context);
    const skillsResult = optimizeSkillsSection(mockSampleResume, context);
    const eduResult = optimizeEducationSection(mockSampleResume, context);

    const optimized = applyOptimizationsToResume(mockSampleResume, {
      summary: summaryResult,
      experience: expResult,
      projects: { section: 'projects', title: 'Projects', status: 'completed', bullets: [] },
      skills: skillsResult,
      education: eduResult,
    });

    // Contact info must be 100% byte identical
    expect(optimized.contact.name).toBe(mockSampleResume.contact.name);
    expect(optimized.contact.email).toBe(mockSampleResume.contact.email);
    expect(optimized.contact.phone).toBe(mockSampleResume.contact.phone);

    // Experience company names, titles, and dates must be byte identical
    expect(optimized.experience[0].company).toBe('TechFlow Systems');
    expect(optimized.experience[0].title).toBe('Senior Software Engineer');
    expect(optimized.experience[0].startDate).toBe('2022-01');
    expect(optimized.experience[0].endDate).toBe('Present');

    // Education degree and institution must be byte identical
    expect(optimized.education[0].degree).toBe('B.S. in Computer Science');
    expect(optimized.education[0].institution).toBe('University of California, Berkeley');
    expect(optimized.education[0].graduationDate).toBe('2020');
  });

  it('runs complete async optimization pipeline and streams progress events', async () => {
    const job: FullOptimizationJob = {
      jobId: 'test_job_1',
      userId: 'test_user',
      mode: 'tailored',
      targetJobDescription: mockJobDescription,
      targetJobTitle: 'Senior Backend Engineer',
      targetCompany: 'Stripe',
      status: 'queued',
      progressPercent: 0,
      completedSections: [],
      sections: {
        summary: { section: 'summary', title: 'Summary', status: 'unchanged', bullets: [] },
        experience: { section: 'experience', title: 'Experience', status: 'unchanged', bullets: [] },
        projects: { section: 'projects', title: 'Projects', status: 'unchanged', bullets: [] },
        skills: { section: 'skills', title: 'Skills', status: 'unchanged', bullets: [] },
        education: { section: 'education', title: 'Education', status: 'unchanged', bullets: [] },
      },
      allBullets: [],
      unsupportedJobGaps: [],
      keywordsAdded: [],
      placeholdersCount: 0,
      initialAtsScore: 54,
      estimatedOptimizedScore: 54,
      scoreDelta: 0,
      initialMatchScore: 45,
      originalResume: mockSampleResume,
      optimizedResume: mockSampleResume,
      startedAt: Date.now(),
    };

    const streamEvents: string[] = [];
    await executeFullOptimization(job, (evt) => {
      streamEvents.push(evt.type);
    });

    expect(job.status).toBe('completed');
    expect(job.progressPercent).toBe(100);
    expect(job.completedSections.length).toBe(5);
    expect(job.allBullets.length).toBeGreaterThan(0);
    expect(job.scoreDelta).toBeGreaterThan(0);
    expect(job.estimatedOptimizedScore).toBeGreaterThan(54);

    // Unsupported gaps must be identified
    expect(job.unsupportedJobGaps).toContain('Kubernetes');

    // Verify stream events sequence
    expect(streamEvents).toContain('job_started');
    expect(streamEvents).toContain('section_started');
    expect(streamEvents).toContain('section_completed');
    expect(streamEvents).toContain('job_completed');
  });

  it('enforces deterministic caching so identical inputs yield instantaneous cached results', async () => {
    const key1 = fullOptimizationService.computeCacheKey(mockSampleResume, 'ats_general');
    const key2 = fullOptimizationService.computeCacheKey(mockSampleResume, 'ats_general');
    expect(key1).toBe(key2);

    const keyDifferent = fullOptimizationService.computeCacheKey(mockSampleResume, 'tailored', 'Different Job');
    expect(key1).not.toBe(keyDifferent);
  });
});
