import { createHash } from 'crypto';
import { JobDescriptionJSON } from './jobDescriptionParser.js';

export interface CachedMatchEntry {
  key: string;
  result: any;
  timestamp: number;
}

class MatchCache {
  private jdCache: Map<string, { jd: JobDescriptionJSON; timestamp: number }> = new Map();
  private matchCache: Map<string, CachedMatchEntry> = new Map();
  private readonly MAX_ENTRIES = 200;

  public computeHash(content: any): string {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    return createHash('sha256').update(str).digest('hex');
  }

  public getParsedJD(jdText: string): JobDescriptionJSON | null {
    const hash = this.computeHash(jdText.trim());
    const entry = this.jdCache.get(hash);
    if (entry) {
      return entry.jd;
    }
    return null;
  }

  public setParsedJD(jdText: string, jd: JobDescriptionJSON): void {
    const hash = this.computeHash(jdText.trim());
    if (this.jdCache.size >= this.MAX_ENTRIES) {
      const firstKey = this.jdCache.keys().next().value;
      if (firstKey) this.jdCache.delete(firstKey);
    }
    this.jdCache.set(hash, { jd, timestamp: Date.now() });
  }

  public getMatch(resumeHash: string, jdHash: string, engineVersion: string = '2.0.0'): any | null {
    const key = `${resumeHash}_${jdHash}_${engineVersion}`;
    const entry = this.matchCache.get(key);
    if (entry) {
      return entry.result;
    }
    return null;
  }

  public setMatch(resumeHash: string, jdHash: string, result: any, engineVersion: string = '2.0.0'): void {
    const key = `${resumeHash}_${jdHash}_${engineVersion}`;
    if (this.matchCache.size >= this.MAX_ENTRIES) {
      const firstKey = this.matchCache.keys().next().value;
      if (firstKey) this.matchCache.delete(firstKey);
    }
    this.matchCache.set(key, { key, result, timestamp: Date.now() });
  }

  public clear(): void {
    this.jdCache.clear();
    this.matchCache.clear();
  }
}

export const matchCache = new MatchCache();
