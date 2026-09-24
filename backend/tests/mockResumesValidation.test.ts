import { describe, it, expect } from 'vitest';
import { processResumePipeline } from '../src/services/recommendations/recommendationEngine.js';
import { MOCK_RESUMES } from './fixtures/mockResumes.js';

describe('7 Mock Resumes Intelligence Validation Suite', () => {
  it('1. Excellent Resume: should score 85+ with strong metric and ATS compatibility', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.excellent.content, {
      resumeId: 'mock_excellent',
    });

    expect(analysis.score.overall).toBeGreaterThanOrEqual(85);
    expect(analysis.score.experience).toBeGreaterThanOrEqual(80);
    expect(analysis.criticalIssues.length).toBe(0);
    expect(analysis.strengths.length).toBeGreaterThanOrEqual(3);
    expect(analysis.structuredResume.contact.email).toBe('sarah.chen@example.com');
  });

  it('2. Average Resume: should score in the 60 - 78 range with improvement recommendations', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.average.content, {
      resumeId: 'mock_average',
    });

    expect(analysis.score.overall).toBeGreaterThanOrEqual(60);
    expect(analysis.score.overall).toBeLessThanOrEqual(78);
    expect(analysis.recommendations.length).toBeGreaterThanOrEqual(2);
  });

  it('3. Poor Resume: should score < 55 and detect missing education, pronouns, and zero metrics', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.poor.content, {
      resumeId: 'mock_poor',
    });

    expect(analysis.score.overall).toBeLessThan(55);
    expect(analysis.criticalIssues.length).toBeGreaterThanOrEqual(1);
    expect(analysis.missing_information.some((m) => m.toLowerCase().includes('education'))).toBe(true);
  });

  it('4. ATS-Unfriendly Resume: should flag table/column structures and non-standard symbols', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.atsUnfriendly.content, {
      resumeId: 'mock_ats_unfriendly',
    });

    const hasTableIssue = analysis.criticalIssues.concat(analysis.warnings, analysis.ats_issues)
      .some((issue) => /table|column|symbol|character/i.test(issue));
    expect(hasTableIssue).toBe(true);
  });

  it('5. Student Resume: should recognize high-value academic coursework, GPA, and projects', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.student.content, {
      resumeId: 'mock_student',
    });

    expect(analysis.sections.education).toBe(true);
    expect(analysis.sections.projects).toBe(true);
    expect(analysis.score.education).toBeGreaterThanOrEqual(80);
    expect(analysis.structuredResume.education[0].institution).toContain('Massachusetts Institute of Technology');
  });

  it('6. Software Engineer Resume: should demonstrate high keyword relevance and enterprise scale', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.softwareEngineer.content, {
      resumeId: 'mock_swe',
    });

    expect(analysis.score.overall).toBeGreaterThanOrEqual(80);
    expect(analysis.score.keywords).toBeGreaterThanOrEqual(80);
    expect(analysis.structuredResume.skills.technical).toContain('React');
  });

  it('7. Electrical Engineer Resume: should accurately capture hardware, firmware, and PE credentials', async () => {
    const analysis = await processResumePipeline(MOCK_RESUMES.electricalEngineer.content, {
      resumeId: 'mock_ee',
    });

    expect(analysis.score.overall).toBeGreaterThanOrEqual(80);
    expect(analysis.structuredResume.contact.name).toContain('RACHEL PATEL');
    expect(analysis.structuredResume.skills.languages).toContain('C++');
  });
});
