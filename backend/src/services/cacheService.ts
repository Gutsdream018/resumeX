import crypto from 'crypto';

export interface CacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly defaultTtlMs: number;
  private readonly maxEntries: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtlMs = options.ttlMs || 2 * 60 * 60 * 1000; // 2 hours default
    this.maxEntries = options.maxEntries || 100;

    // Periodic sweep every 15 minutes to reclaim expired memory
    setInterval(() => this.sweep(), 15 * 60 * 1000).unref();
  }

  public computeKey(...inputs: (string | undefined | null)[]): string {
    const hash = crypto.createHash('sha256');
    for (const item of inputs) {
      if (item) hash.update(item);
    }
    return hash.digest('hex');
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  public set<T>(key: string, value: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxEntries) {
      // LRU-style eviction: delete oldest inserted entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTtlMs),
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const globalAnalysisCache = new MemoryCacheService({
  ttlMs: 2 * 60 * 60 * 1000, // 2 hours
  maxEntries: 100,
});
