import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  ResumeProfile,
  JobPreferences,
  StoredResumeProfile,
  Job,
  ScoredJobMatch,
  TailoredResumeRecord,
  JobApplication,
  ApplicationStatus,
  JobClickEvent,
} from './types.js';

export class JobDiscoveryDatabase {
  private profiles: Map<string, StoredResumeProfile> = new Map();
  private jobs: Map<string, { job: Job; cachedAt: number; expiresAt: number }> = new Map();
  private matches: Map<string, { match: ScoredJobMatch; createdAt: string }> = new Map();
  private tailoredResumes: Map<string, TailoredResumeRecord> = new Map();
  private savedJobs: Map<string, string[]> = new Map(); // userId -> jobId[]
  private hiddenJobs: Map<string, string[]> = new Map(); // userId -> jobId[]
  private clickEvents: JobClickEvent[] = [];
  private applications: Map<string, JobApplication> = new Map();

  private storageFile: string;
  private defaultTtlHours: number = 24;

  constructor() {
    const dataDir = path.resolve(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // Fallback to in-memory if directory creation fails
      }
    }
    this.storageFile = path.join(dataDir, 'job_discovery.json');
    this.defaultTtlHours = parseInt(process.env.JOB_CACHE_TTL_HOURS || '24', 10);
    this.loadFromDisk();

    // Periodic cleanup every hour
    setInterval(() => this.cleanupExpiredJobs(), 60 * 60 * 1000);
  }

  // --- Resume Profiles ---
  public saveProfile(
    userId: string,
    resumeId: string,
    profile: ResumeProfile,
    preferences: JobPreferences
  ): StoredResumeProfile {
    const key = `${userId}:${resumeId}`;
    const now = new Date().toISOString();
    const existing = this.profiles.get(key);

    const record: StoredResumeProfile = {
      userId,
      resumeId,
      profile,
      preferences,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.profiles.set(key, record);
    this.saveToDisk();
    return record;
  }

  public getProfile(userId: string, resumeId: string): StoredResumeProfile | undefined {
    const key = `${userId}:${resumeId}`;
    return this.profiles.get(key);
  }

  public updatePreferences(
    userId: string,
    resumeId: string,
    preferences: Partial<JobPreferences>
  ): StoredResumeProfile | undefined {
    const key = `${userId}:${resumeId}`;
    const existing = this.profiles.get(key);
    if (!existing) return undefined;

    existing.preferences = { ...existing.preferences, ...preferences };
    existing.updatedAt = new Date().toISOString();
    this.profiles.set(key, existing);
    this.saveToDisk();
    return existing;
  }

  // --- Unified Jobs Cache ---
  public cacheJobs(jobsList: Job[], ttlHours: number = this.defaultTtlHours): void {
    const now = Date.now();
    const expiresAt = now + ttlHours * 60 * 60 * 1000;

    jobsList.forEach((job) => {
      this.jobs.set(job.id, {
        job: { ...job, cachedAt: new Date(now).toISOString() },
        cachedAt: now,
        expiresAt,
      });
    });

    this.saveToDisk();
  }

  public getCachedJobs(query?: string, location?: string): Job[] {
    const now = Date.now();
    const results: Job[] = [];

    const normQ = (query || '').toLowerCase().trim();
    const normLoc = (location || '').toLowerCase().trim();

    for (const [_, entry] of this.jobs.entries()) {
      if (entry.expiresAt > now) {
        const j = entry.job;
        const matchesQ = !normQ || j.title.toLowerCase().includes(normQ) || j.description.toLowerCase().includes(normQ);
        const matchesLoc = !normLoc || j.location.toLowerCase().includes(normLoc) || (normLoc === 'remote' && j.isRemote);

        if (matchesQ && matchesLoc) {
          results.push(j);
        }
      }
    }

    return results;
  }

  public getJobById(id: string): Job | undefined {
    const entry = this.jobs.get(id);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.jobs.delete(id);
      return undefined;
    }
    return entry.job;
  }

  public updateJobLinkStatus(jobId: string, linkInfo: Partial<Job>): void {
    const entry = this.jobs.get(jobId);
    if (entry) {
      entry.job = { ...entry.job, ...linkInfo };
      this.saveToDisk();
    }
  }

  // --- Precomputed Job Matches ---
  public saveJobMatch(match: ScoredJobMatch, resumeVersion: string): void {
    const key = `${resumeVersion}:${match.job.id}`;
    this.matches.set(key, {
      match,
      createdAt: new Date().toISOString(),
    });
    this.saveToDisk();
  }

  public getJobMatch(resumeVersion: string, jobId: string): ScoredJobMatch | undefined {
    const key = `${resumeVersion}:${jobId}`;
    const entry = this.matches.get(key);
    return entry?.match;
  }

  // --- Tailored Resumes ---
  public saveTailoredResume(record: {
    originalResumeId: string;
    jobId: string;
    jobTitle?: string;
    company?: string;
    content: any;
    targetRequirements?: string[];
  }): TailoredResumeRecord {
    const id = `tailored_${crypto.randomBytes(8).toString('hex')}`;
    const item: TailoredResumeRecord = {
      id,
      ...record,
      createdAt: new Date().toISOString(),
    };
    this.tailoredResumes.set(id, item);
    this.saveToDisk();
    return item;
  }

  public getTailoredResumes(originalResumeId: string): TailoredResumeRecord[] {
    const results: TailoredResumeRecord[] = [];
    for (const [_, item] of this.tailoredResumes.entries()) {
      if (item.originalResumeId === originalResumeId) {
        results.push(item);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTailoredResumeById(id: string): TailoredResumeRecord | undefined {
    return this.tailoredResumes.get(id);
  }

  // --- Saved & Hidden Jobs ---
  public saveJobForUser(userId: string, jobId: string): void {
    const current = this.savedJobs.get(userId) || [];
    if (!current.includes(jobId)) {
      this.savedJobs.set(userId, [...current, jobId]);
      this.saveToDisk();
    }
  }

  public unsaveJobForUser(userId: string, jobId: string): void {
    const current = this.savedJobs.get(userId) || [];
    this.savedJobs.set(userId, current.filter((id) => id !== jobId));
    this.saveToDisk();
  }

  public getSavedJobIds(userId: string): string[] {
    return this.savedJobs.get(userId) || [];
  }

  public hideJobForUser(userId: string, jobId: string): void {
    const current = this.hiddenJobs.get(userId) || [];
    if (!current.includes(jobId)) {
      this.hiddenJobs.set(userId, [...current, jobId]);
      this.saveToDisk();
    }
  }

  public unhideJobForUser(userId: string, jobId: string): void {
    const current = this.hiddenJobs.get(userId) || [];
    this.hiddenJobs.set(userId, current.filter((id) => id !== jobId));
    this.saveToDisk();
  }

  public getHiddenJobIds(userId: string): string[] {
    return this.hiddenJobs.get(userId) || [];
  }

  // --- Click Tracking ---
  public recordClickEvent(jobId: string, userId: string, applyUrl: string): JobClickEvent {
    const event: JobClickEvent = {
      id: `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      jobId,
      userId,
      applyUrl,
      timestamp: new Date().toISOString(),
    };
    this.clickEvents.push(event);
    if (this.clickEvents.length > 5000) {
      this.clickEvents = this.clickEvents.slice(-2000);
    }
    this.saveToDisk();
    return event;
  }

  public getClickEvents(userId?: string): JobClickEvent[] {
    if (!userId) return this.clickEvents;
    return this.clickEvents.filter((c) => c.userId === userId);
  }

  // --- Application Tracker ---
  public createOrUpdateApplication(app: {
    userId: string;
    resumeId: string;
    jobId: string;
    jobTitle: string;
    company: string;
    location: string;
    applyUrl: string;
    finalUrl?: string;
    applyHost?: string;
    isAts?: boolean;
    tailoredResumeId?: string;
    status: ApplicationStatus;
    notes?: string;
  }): JobApplication {
    const existing = Array.from(this.applications.values()).find(
      (a) => a.userId === app.userId && a.jobId === app.jobId
    );

    const now = new Date().toISOString();
    const id = existing ? existing.id : `app_${crypto.randomBytes(8).toString('hex')}`;

    const record: JobApplication = {
      id,
      userId: app.userId,
      resumeId: app.resumeId,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      company: app.company,
      location: app.location,
      applyUrl: app.applyUrl,
      finalUrl: app.finalUrl || existing?.finalUrl,
      applyHost: app.applyHost || existing?.applyHost,
      isAts: app.isAts !== undefined ? app.isAts : existing?.isAts,
      tailoredResumeId: app.tailoredResumeId || existing?.tailoredResumeId,
      status: app.status,
      notes: app.notes !== undefined ? app.notes : existing?.notes,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.applications.set(id, record);
    this.saveToDisk();
    return record;
  }

  public getApplications(userId: string): JobApplication[] {
    const results: JobApplication[] = [];
    for (const [_, item] of this.applications.entries()) {
      if (item.userId === userId) {
        results.push(item);
      }
    }
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public updateApplicationStatus(id: string, status: ApplicationStatus, notes?: string): JobApplication | undefined {
    const app = this.applications.get(id);
    if (!app) return undefined;
    app.status = status;
    if (notes !== undefined) app.notes = notes;
    app.updatedAt = new Date().toISOString();
    this.applications.set(id, app);
    this.saveToDisk();
    return app;
  }

  public deleteApplication(id: string): boolean {
    const deleted = this.applications.delete(id);
    if (deleted) this.saveToDisk();
    return deleted;
  }

  // --- Persistence & Cleanup ---
  private cleanupExpiredJobs(): void {
    const now = Date.now();
    let changed = false;
    for (const [id, entry] of this.jobs.entries()) {
      if (entry.expiresAt <= now) {
        this.jobs.delete(id);
        changed = true;
      }
    }
    if (changed) this.saveToDisk();
  }

  private saveToDisk(): void {
    try {
      const data = {
        profiles: Array.from(this.profiles.entries()),
        jobs: Array.from(this.jobs.entries()),
        matches: Array.from(this.matches.entries()),
        tailoredResumes: Array.from(this.tailoredResumes.entries()),
        savedJobs: Array.from(this.savedJobs.entries()),
        hiddenJobs: Array.from(this.hiddenJobs.entries()),
        clickEvents: this.clickEvents.slice(-500),
        applications: Array.from(this.applications.entries()),
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(data), 'utf-8');
    } catch (e) {
      // Ignore disk write errors in ephemeral environments
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const data = JSON.parse(raw);
        if (data.profiles) this.profiles = new Map(data.profiles);
        if (data.jobs) this.jobs = new Map(data.jobs);
        if (data.matches) this.matches = new Map(data.matches);
        if (data.tailoredResumes) this.tailoredResumes = new Map(data.tailoredResumes);
        if (data.savedJobs) this.savedJobs = new Map(data.savedJobs);
        if (data.hiddenJobs) this.hiddenJobs = new Map(data.hiddenJobs);
        if (data.clickEvents) this.clickEvents = data.clickEvents;
        if (data.applications) this.applications = new Map(data.applications);
      }
    } catch (e) {
      // Ignore disk read errors
    }
  }
}

export const jobDiscoveryDb = new JobDiscoveryDatabase();
