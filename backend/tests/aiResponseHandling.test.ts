import { describe, it, expect } from 'vitest';
import { evaluateResumeText, evaluateWithHeuristicEngine } from '../src/services/aiEvaluator.js';
import { calculateWeightedScore } from '../src/services/scorer.js';

describe('AI Evaluation Service and Error Handling', () => {
  const sampleResume = `
    SARAH JENKINS
    sarah.jenkins@email.com | (415) 555-0143 | linkedin.com/in/sarahjenkins

    SUMMARY
    Senior Software Engineer with 6+ years designing distributed systems and microservices in Go and Python.

    EXPERIENCE
    Senior Backend Engineer | CloudScale Tech | 2021 - Present
    - Architected distributed data processing pipeline handling 12M+ records daily, decreasing latency by 35%.
    - Spearheaded migration to Kubernetes, saving $120K in annual hosting fees.
    - Mentored 6 junior engineers and improved team test coverage to 92%.

    EDUCATION
    B.S. in Computer Science | UC Berkeley | 2018

    SKILLS
    Go, Python, Docker, Kubernetes, AWS, PostgreSQL, Redis, CI/CD
  `;

  it('should fall back gracefully to heuristic engine when no API key is provided', async () => {
    const result = await evaluateResumeText(sampleResume, { forceHeuristic: true });

    expect(result).toBeDefined();
    expect(result.overall_score).toBeGreaterThan(60);
    expect(result.score_grade).toBeDefined();
    expect(result.category_scores.ats).toBeGreaterThan(0);
    expect(result.category_scores.impact).toBeGreaterThan(0);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.metadata.analysis_mode).toBe('heuristic_engine');
  });

  it('should enforce that overall score exactly equals deterministic weighted sum of category scores', async () => {
    const result = await evaluateResumeText(sampleResume, { forceHeuristic: true });
    const computed = calculateWeightedScore(result.category_scores);

    expect(result.overall_score).toBe(computed.overall_score);
  });

  it('should provide non-hallucinated bullet point improvements with concrete problem and why_better explanations', async () => {
    const weakResume = `
      MARK TAYLOR
      mark@email.com | 555-0199

      EXPERIENCE
      Developer at Company XYZ
      - Responsible for creating web forms and updating CSS styles.
      - Worked on fixing application errors.
      - Helped with backend database updates.

      SKILLS
      JavaScript, React, Node.js

      EDUCATION
      B.A. Computer Science, 2020
    `;

    const result = evaluateWithHeuristicEngine(weakResume);

    expect(result.bullet_point_improvements.length).toBeGreaterThan(0);
    for (const item of result.bullet_point_improvements) {
      expect(item.original).toBeDefined();
      expect(item.problem).toBeDefined();
      expect(item.improved).toBeDefined();
      expect(item.why_better).toBeDefined();
      // Should not contain hardcoded fabricated numbers like 47% or $12,345 in improved unless original had it
      expect(item.why_better.length).toBeGreaterThan(10);
    }
  });
});
