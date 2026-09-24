import { describe, it, expect } from 'vitest';
import { analyzeContact } from '../src/services/deterministic/contactAnalyzer.js';
import { analyzeSections } from '../src/services/deterministic/sectionAnalyzer.js';
import { analyzeFormatting } from '../src/services/deterministic/formattingAnalyzer.js';
import { analyzeContent } from '../src/services/deterministic/contentAnalyzer.js';
import { analyzeSkills } from '../src/services/deterministic/skillsAnalyzer.js';
import { parseStructuredResume } from '../src/services/parser/sectionParser.js';
import { MOCK_RESUMES } from './fixtures/mockResumes.js';

describe('Deterministic Analyzers Suite', () => {
  it('should evaluate contact completeness', () => {
    const structuredExcellent = parseStructuredResume(MOCK_RESUMES.excellent.content);
    const resultExcellent = analyzeContact(structuredExcellent.contact, MOCK_RESUMES.excellent.content);
    expect(resultExcellent.hasEmail).toBe(true);
    expect(resultExcellent.hasPhone).toBe(true);
    expect(resultExcellent.hasLinkedIn).toBe(true);
    expect(resultExcellent.score).toBeGreaterThanOrEqual(90);

    const structuredPoor = parseStructuredResume(MOCK_RESUMES.poor.content);
    const resultPoor = analyzeContact(structuredPoor.contact, MOCK_RESUMES.poor.content);
    expect(resultPoor.hasPhone).toBe(false);
    expect(resultPoor.hasLinkedIn).toBe(false);
    expect(resultPoor.score).toBeLessThan(60);
  });

  it('should flag missing sections accurately', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.poor.content);
    const analysis = analyzeSections(structured, MOCK_RESUMES.poor.content);

    expect(analysis.missingSections).toContain('Education');
    expect(analysis.missingSections).toContain('Summary');
    expect(analysis.score).toBeLessThan(50);
  });

  it('should detect ATS-unfriendly formatting, tables, and special symbols', () => {
    const analysis = analyzeFormatting(MOCK_RESUMES.atsUnfriendly.content);

    expect(analysis.hasTablesOrColumnsHint).toBe(true);
    expect(analysis.issues.some((i) => i.includes('table') || i.includes('multi-column'))).toBe(true);
  });

  it('should penalize passive phrasing and first-person pronouns in content analysis', () => {
    const poorAnalysis = analyzeContent(MOCK_RESUMES.poor.content);

    expect(poorAnalysis.pronounHits).toBeGreaterThanOrEqual(2);
    expect(poorAnalysis.metricCount).toBe(0);
    expect(poorAnalysis.score).toBeLessThan(45);

    const excellentAnalysis = analyzeContent(MOCK_RESUMES.excellent.content);
    expect(excellentAnalysis.strongVerbHits).toBeGreaterThanOrEqual(4);
    expect(excellentAnalysis.metricCount).toBeGreaterThanOrEqual(3);
    expect(excellentAnalysis.score).toBeGreaterThanOrEqual(80);
  });

  it('should extract rich skills taxonomy in skills analysis', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.softwareEngineer.content);
    const analysis = analyzeSkills(structured.skills, MOCK_RESUMES.softwareEngineer.content);

    expect(analysis.totalSkillsCount).toBeGreaterThanOrEqual(8);
    expect(analysis.skills.technical).toContain('React');
    expect(analysis.score).toBeGreaterThanOrEqual(80);
  });
});
