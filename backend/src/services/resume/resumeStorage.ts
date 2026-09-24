import crypto from 'crypto';

export interface StoredResume {
  resumeId: string;
  filename: string;
  mimetype: string;
  buffer: Buffer;
  text?: string;
  uploadedAt: Date;
  analysis?: any;
}

class ResumeStorage {
  private resumes: Map<string, StoredResume> = new Map();
  private readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours retention

  constructor() {
    // Periodic cleanup of expired resumes
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  public saveResume(filename: string, mimetype: string, buffer: Buffer): StoredResume {
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
    const resumeId = `resume_${crypto.randomBytes(8).toString('hex')}`;
    const buffer = Buffer.from(text, 'utf-8');
    const stored: StoredResume = {
      resumeId,
      filename: name,
      mimetype: 'text/plain',
      buffer,
      text,
      uploadedAt: new Date(),
    };
    this.resumes.set(resumeId, stored);
    return stored;
  }

  public getResume(resumeId: string): StoredResume | undefined {
    return this.resumes.get(resumeId);
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
