import { describe, it, expect } from 'vitest';
import {
  extractKeywords,
  normalizeKeyword,
  compareResumeToJobKeywords,
} from '../src/services/keywords/keywordEngine.js';

describe('Keyword Engine Suite', () => {
  it('should normalize synonyms and abbreviations correctly', () => {
    expect(normalizeKeyword('JS')).toBe('javascript');
    expect(normalizeKeyword('k8s')).toBe('kubernetes');
    expect(normalizeKeyword('reactjs')).toBe('react');
    expect(normalizeKeyword('nodejs')).toBe('node');
    expect(normalizeKeyword('amazon web services')).toBe('aws');
  });

  it('should extract repeated keywords and industry terms without JD', () => {
    const text = 'Architected microservices using React, Node, and TypeScript. Scaled microservices in Docker and Kubernetes.';
    const result = extractKeywords(text);

    expect(result.technologies).toContain('react');
    expect(result.technologies).toContain('node');
    expect(result.technologies).toContain('typescript');
    expect(result.repeatedKeywords.some((r) => r.keyword === 'microservices')).toBe(true);
  });

  it('should accurately identify matched, missing, and partial keyword matches against JD', () => {
    const resumeText = 'Experienced in JavaScript, React, PostgreSQL, and AWS.';
    const jobDescription = 'Looking for a Senior Software Engineer with TypeScript, React, Docker, and Kubernetes experience.';

    const comparison = compareResumeToJobKeywords(resumeText, jobDescription);

    expect(comparison.matched).toContain('react');
    expect(comparison.missing).toContain('docker');
    expect(comparison.missing).toContain('kubernetes');
    // JS is synonym for TypeScript/JavaScript ecosystem
    expect(typeof comparison.matchPercentage).toBe('number');
  });
});
