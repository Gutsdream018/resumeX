import crypto from 'crypto';
import { CanonicalResume } from '../../engine/ingestion/types.js';
import {
  FullOptimizationJob,
  FullOptimizationMode,
  FullOptimizationRequest,
  FullOptimizationStreamEvent,
} from '../../engine/optimizer/fullOptimizerTypes.js';
import { executeFullOptimization } from '../../engine/optimizer/fullOptimizationEngine.js';
import { resumeStorage } from '../resume/resumeStorage.js';
import { jobDiscoveryDb } from '../jobs/jobDiscoveryDb.js';

interface RateLimitRecord {
  timestamps: number[];
}

export class FullOptimizationService {
  private jobs: Map<string, FullOptimizationJob> = new Map();
  private subscribers: Map<string, Set<(event: FullOptimizationStreamEvent) => void>> = new Map();
  private cache: Map<string, FullOptimizationJob> = new Map();
  private rateLimits: Map<string, RateLimitRecord> = new Map();

  private readonly RATE_LIMIT_MAX = 15; // 15 full optimizations per window
  private readonly RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

  /**
   * Checks and enforces per-user rate limiting.
   */
  public checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = this.rateLimits.get(clientId);

    if (!record) {
      record = { timestamps: [] };
      this.rateLimits.set(clientId, record);
    }

    // Filter timestamps within current window
    record.timestamps = record.timestamps.filter((t) => now - t < this.RATE_LIMIT_WINDOW_MS);

    if (record.timestamps.length >= this.RATE_LIMIT_MAX) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, this.RATE_LIMIT_WINDOW_MS - (now - oldest));
      return { allowed: false, remaining: 0, resetMs };
    }

    record.timestamps.push(now);
    const remaining = this.RATE_LIMIT_MAX - record.timestamps.length;
    return { allowed: true, remaining, resetMs: this.RATE_LIMIT_WINDOW_MS };
  }

  /**
   * Computes a deterministic cache key based on resume contents, mode, and target job.
   */
  public computeCacheKey(resume: CanonicalResume, mode: FullOptimizationMode, jobDesc?: string): string {
    const resumeStr = JSON.stringify({
      contact: resume.contact,
      summary: resume.summary,
      experience: resume.experience?.map((e) => ({ title: e.title, bullets: e.bullets })),
      projects: resume.projects?.map((p) => ({ name: p.name, bullets: p.bullets })),
      skills: resume.skills,
      education: resume.education,
    });
    const hash = crypto
      .createHash('sha256')
      .update(`${resumeStr}::${mode}::${jobDesc || ''}`)
      .digest('hex');
    return `opt_cache_${hash}`;
  }

  /**
   * Creates and initializes a full optimization job.
   */
  public async createJob(
    request: FullOptimizationRequest,
    clientId: string = 'anon'
  ): Promise<FullOptimizationJob> {
    // 1. Rate limiting check
    const rateCheck = this.checkRateLimit(clientId);
    if (!rateCheck.allowed) {
      throw new Error(
        `Rate limit exceeded: Please wait ${Math.ceil(
          rateCheck.resetMs / 1000
        )}s before starting another full optimization.`
      );
    }

    // 2. Resolve Canonical Resume
    let canonicalResume: CanonicalResume | null = request.canonicalResume || null;
    let initialScore = 54;

    if (!canonicalResume && request.resumeId) {
      const stored = resumeStorage.getResume(request.resumeId);
      if (stored?.analysis?.canonicalResume) {
        canonicalResume = stored.analysis.canonicalResume;
        initialScore = stored.analysis.overall_score || stored.analysis.score?.overall || 54;
      }
    }

    if (!canonicalResume) {
      throw new Error('A valid resumeId or canonicalResume object is required.');
    }

    // 3. Resolve Target Job for Tailored mode
    const mode = request.mode === 'tailored' ? 'tailored' : 'ats_general';
    let targetJobDesc = request.targetJobDescription || '';
    let targetJobTitle = request.targetJobTitle || '';
    let targetCompany = request.targetCompany || '';
    let initialMatchScore = 45;

    if (mode === 'tailored' && request.jobId) {
      const job = jobDiscoveryDb.getJobById(request.jobId);
      if (job) {
        targetJobDesc = job.description || targetJobDesc;
        targetJobTitle = job.title || targetJobTitle;
        targetCompany = job.company || targetCompany;
      }
      if (request.resumeId) {
        const match = jobDiscoveryDb.getJobMatch(request.resumeId, request.jobId);
        if (match) {
          initialMatchScore = match.overallScore;
        }
      }
    }

    // 4. Check Deterministic Cache
    const cacheKey = this.computeCacheKey(canonicalResume, mode, targetJobDesc);
    const cachedJob = this.cache.get(cacheKey);
    if (cachedJob && cachedJob.status === 'completed') {
      const freshJobId = `opt_${crypto.randomBytes(8).toString('hex')}`;
      const cloned = { ...cachedJob, jobId: freshJobId };
      this.jobs.set(freshJobId, cloned);
      return cloned;
    }

    // 5. Create new Job instance
    const jobId = `opt_${crypto.randomBytes(8).toString('hex')}`;
    const newJob: FullOptimizationJob = {
      jobId,
      userId: clientId,
      resumeId: request.resumeId,
      mode,
      targetJobId: request.jobId,
      targetJobTitle,
      targetCompany,
      targetJobDescription: targetJobDesc,
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
      initialAtsScore: initialScore,
      estimatedOptimizedScore: initialScore,
      scoreDelta: 0,
      initialMatchScore: mode === 'tailored' ? initialMatchScore : undefined,
      originalResume: canonicalResume,
      optimizedResume: canonicalResume,
      startedAt: Date.now(),
      isCancelled: false,
    };

    this.jobs.set(jobId, newJob);

    // Asynchronously begin execution
    this.runJob(newJob, cacheKey).catch((err) => {
      console.error(`[FullOptimizationService] Job ${jobId} failed:`, err);
    });

    return newJob;
  }

  /**
   * Executes the optimization job and notifies all SSE subscribers.
   */
  private async runJob(job: FullOptimizationJob, cacheKey: string): Promise<void> {
    const notify = (event: FullOptimizationStreamEvent) => {
      const listeners = this.subscribers.get(job.jobId);
      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener(event);
          } catch (e) {
            // Subscriber error ignored
          }
        });
      }
    };

    try {
      await executeFullOptimization(job, notify);
      if (job.status === 'completed') {
        this.cache.set(cacheKey, job);
      }
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Optimization failed';
      notify({
        type: 'job_failed',
        jobId: job.jobId,
        progressPercent: job.progressPercent,
        error: job.error,
      });
    }
  }

  /**
   * Subscribes a listener to a job's progress stream.
   */
  public subscribe(
    jobId: string,
    listener: (event: FullOptimizationStreamEvent) => void
  ): () => void {
    let set = this.subscribers.get(jobId);
    if (!set) {
      set = new Set();
      this.subscribers.set(jobId, set);
    }
    set.add(listener);

    // Send initial snapshot if job already exists
    const job = this.jobs.get(jobId);
    if (job) {
      listener({
        type: job.status === 'completed' ? 'job_completed' : 'section_progress',
        jobId,
        progressPercent: job.progressPercent,
        currentSection: job.currentSection,
        stats: {
          bulletsCount: job.allBullets.length,
          placeholdersCount: job.placeholdersCount,
          scoreDelta: job.scoreDelta,
          atsScore: job.estimatedOptimizedScore,
        },
        data: job.status === 'completed' ? { optimizedResume: job.optimizedResume } : undefined,
      });
    }

    return () => {
      set?.delete(listener);
      if (set && set.size === 0) {
        this.subscribers.delete(jobId);
      }
    };
  }

  public getJob(jobId: string): FullOptimizationJob | undefined {
    return this.jobs.get(jobId);
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === 'processing' || job.status === 'queued') {
      job.isCancelled = true;
      job.status = 'cancelled';
      const listeners = this.subscribers.get(jobId);
      if (listeners) {
        listeners.forEach((l) =>
          l({
            type: 'job_cancelled',
            jobId,
            progressPercent: job.progressPercent,
          })
        );
      }
      return true;
    }
    return false;
  }
}

export const fullOptimizationService = new FullOptimizationService();
