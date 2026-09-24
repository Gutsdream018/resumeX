import crypto from 'crypto';
import { CanonicalResume } from '../ingestion/types.js';
import { MuseSemanticAnalysisResult } from '../ai/museAnalyzer.js';

export const ENGINE_VERSION = 'v2.5.0-opt';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

class AnalysisCache {
  private documentCache: Map<string, CacheEntry<{ rawText: string; canonicalResume: CanonicalResume }>> = new Map();
  private deterministicCache: Map<string, CacheEntry<any>> = new Map();
  private museCache: Map<string, CacheEntry<MuseSemanticAnalysisResult>> = new Map();
  private sectionCache: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number = 200;

  public computeHash(data: string | Buffer | object): string {
    const hash = crypto.createHash('sha256');
    if (Buffer.isBuffer(data)) {
      hash.update(data);
    } else if (typeof data === 'string') {
      hash.update(data);
    } else {
      hash.update(JSON.stringify(data));
    }
    return hash.digest('hex');
  }

  // 1. Document Ingestion Cache
  public getDocument(fileHash: string) {
    const entry = this.documentCache.get(fileHash);
    if (entry) {
      console.log(`[Cache HIT] Ingestion document cache hit for hash: ${fileHash.slice(0, 8)}...`);
      return entry.data;
    }
    return null;
  }

  public setDocument(fileHash: string, data: { rawText: string; canonicalResume: CanonicalResume }) {
    this.evictIfFull(this.documentCache);
    this.documentCache.set(fileHash, {
      data,
      timestamp: Date.now(),
      hash: fileHash,
    });
  }

  // 2. Deterministic ATS Analysis Cache
  public getDeterministicAnalysis(resumeHash: string, jobHash: string = 'none') {
    const key = `${resumeHash}:${jobHash}:${ENGINE_VERSION}`;
    const entry = this.deterministicCache.get(key);
    if (entry) {
      console.log(`[Cache HIT] Deterministic ATS cache hit for key: ${key.slice(0, 16)}...`);
      return entry.data;
    }
    return null;
  }

  public setDeterministicAnalysis(resumeHash: string, jobHash: string = 'none', data: any) {
    const key = `${resumeHash}:${jobHash}:${ENGINE_VERSION}`;
    this.evictIfFull(this.deterministicCache);
    this.deterministicCache.set(key, {
      data,
      timestamp: Date.now(),
      hash: key,
    });
  }

  // 3. Muse Semantic Pass Cache
  public getMuseResult(resumeHash: string, jobHash: string = 'none'): MuseSemanticAnalysisResult | null {
    const key = `${resumeHash}:${jobHash}:${ENGINE_VERSION}`;
    const entry = this.museCache.get(key);
    if (entry) {
      console.log(`[Cache HIT] NVIDIA Muse semantic cache hit for key: ${key.slice(0, 16)}...`);
      return entry.data;
    }
    return null;
  }

  public setMuseResult(resumeHash: string, jobHash: string = 'none', data: MuseSemanticAnalysisResult) {
    const key = `${resumeHash}:${jobHash}:${ENGINE_VERSION}`;
    this.evictIfFull(this.museCache);
    this.museCache.set(key, {
      data,
      timestamp: Date.now(),
      hash: key,
    });
  }

  // 4. Section-level Cache
  public getSectionAnalysis(sectionName: string, sectionHash: string) {
    const key = `${sectionName}:${sectionHash}:${ENGINE_VERSION}`;
    return this.sectionCache.get(key)?.data || null;
  }

  public setSectionAnalysis(sectionName: string, sectionHash: string, data: any) {
    const key = `${sectionName}:${sectionHash}:${ENGINE_VERSION}`;
    this.evictIfFull(this.sectionCache);
    this.sectionCache.set(key, {
      data,
      timestamp: Date.now(),
      hash: key,
    });
  }

  public clearAll() {
    this.documentCache.clear();
    this.deterministicCache.clear();
    this.museCache.clear();
    this.sectionCache.clear();
  }

  public getStats() {
    return {
      documents: this.documentCache.size,
      deterministic: this.deterministicCache.size,
      muse: this.museCache.size,
      sections: this.sectionCache.size,
    };
  }

  private evictIfFull(map: Map<string, any>) {
    if (map.size >= this.maxEntries) {
      const firstKey = map.keys().next().value;
      if (firstKey) map.delete(firstKey);
    }
  }
}

export const analysisCache = new AnalysisCache();
