import crypto from 'crypto';

export interface StoredResume {
  resumeId: string;
  filename: string;
  mimetype: string;
  buffer?: Buffer | null;
  text?: string;
  uploadedAt: Date;
  analysis?: any;
}

class ResumeStorage {
  private resumes: Map<string, StoredResume> = new Map();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour retention (memory-conscious for free-tier)
  private readonly MAX_STORED = 50; // Cap at 50 in-flight resumes to preserve RAM

  constructor() {
    // Periodic cleanup of expired resumes every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000).unref();
  }

  public saveResume(filename: string, mimetype: string, buffer: Buffer): StoredResume {
    this.evictIfFull();
    const resumeId = `resume_${crypto.randomBytes(8).toString('hex')}`;
    const stored: StoredResume = {
      resumeId,
      filename,
      mimetype,
      buffer,
      uploadedAt: new Date(),
    };
    this.resumes.set(resumeId, stored);
    return stored;
  }

  public saveTextResume(text: string, name: string = 'pasted_resume.txt'): StoredResume {
    this.evictIfFull();
    const resumeId = `resume_${crypto.randomBytes(8).toString('hex')}`;
    const stored: StoredResume = {
      resumeId,
      filename: name,
      mimetype: 'text/plain',
      buffer: null,
      text,
      uploadedAt: new Date(),
    };
    this.resumes.set(resumeId, stored);
    return stored;
  }

  public getResume(resumeId: string): StoredResume | undefined {
    return this.resumes.get(resumeId);
  }

  /**
   * Immediately clears raw binary buffer to reclaim memory once text extraction is complete.
   */
  public releaseBuffer(resumeId: string): void {
    const existing = this.resumes.get(resumeId);
    if (existing && existing.buffer) {
      existing.buffer = null;
    }
  }

  public updateResume(resumeId: string, updates: Partial<StoredResume>): void {
    const existing = this.resumes.get(resumeId);
    if (existing) {
      this.resumes.set(resumeId, { ...existing, ...updates });
    }
  }

  public deleteResume(resumeId: string): boolean {
    return this.resumes.delete(resumeId);
  }

  private evictIfFull(): void {
    if (this.resumes.size >= this.MAX_STORED) {
      const oldestKey = this.resumes.keys().next().value;
      if (oldestKey) this.resumes.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, item] of this.resumes.entries()) {
      if (now - item.uploadedAt.getTime() > this.TTL_MS) {
        this.resumes.delete(id);
      }
    }
  }
}

export const resumeStorage = new ResumeStorage();
