import { describe, it, expect } from 'vitest';
import { evaluateAtsScores } from '../src/services/ats/atsEngine.js';
import { ScoringConfig, DEFAULT_SCORING_WEIGHTS } from '../src/config/scoringConfig.js';
import { parseStructuredResume } from '../src/services/parser/sectionParser.js';
import { analyzeContact } from '../src/services/deterministic/contactAnalyzer.js';
import { analyzeSections } from '../src/services/deterministic/sectionAnalyzer.js';
import { analyzeFormatting } from '../src/services/deterministic/formattingAnalyzer.js';
import { analyzeContent } from '../src/services/deterministic/contentAnalyzer.js';
import { analyzeSkills } from '../src/services/deterministic/skillsAnalyzer.js';
import { MOCK_RESUMES } from './fixtures/mockResumes.js';

describe('ATS Scoring Engine Suite', () => {
  it('should calculate category scores and weighted overall score', () => {
    const rawText = MOCK_RESUMES.excellent.content;
    const resume = parseStructuredResume(rawText);
    const analyses = {
      contact: analyzeContact(resume.contact, rawText),
      section: analyzeSections(resume, rawText),
      formatting: analyzeFormatting(rawText),
      content: analyzeContent(rawText),
      skills: analyzeSkills(resume.skills, rawText),
    };

    const result = evaluateAtsScores(resume, analyses);

    expect(result.overall).toBeGreaterThanOrEqual(85);
    expect(result.categories.atsCompatibility).toBeGreaterThanOrEqual(80);
    expect(result.categories.experience).toBeGreaterThanOrEqual(80);
    expect(result.categories.achievements).toBeGreaterThanOrEqual(80);
    expect(result.weights).toEqual(DEFAULT_SCORING_WEIGHTS);
  });

  it('should support dynamic weight configuration', () => {
    const rawText = MOCK_RESUMES.average.content;
    const resume = parseStructuredResume(rawText);
    const analyses = {
      contact: analyzeContact(resume.contact, rawText),
      section: analyzeSections(resume, rawText),
      formatting: analyzeFormatting(rawText),
      content: analyzeContent(rawText),
      skills: analyzeSkills(resume.skills, rawText),
    };

    const defaultConfig = new ScoringConfig();
    const defaultResult = evaluateAtsScores(resume, analyses, defaultConfig);

    // Custom configuration heavily penalizing weak experience
    const customConfig = new ScoringConfig({
      experience: 0.50,
      atsCompatibility: 0.10,
      keywordRelevance: 0.10,
      projects: 0.10,
      formatting: 0.10,
      education: 0.05,
      achievements: 0.05,
    });
    const customResult = evaluateAtsScores(resume, analyses, customConfig);

    expect(customResult.weights.experience).toBe(0.50);
    expect(typeof customResult.overall).toBe('number');
  });

  it('should ensure all category scores are clamped between 0 and 100', () => {
    const rawText = MOCK_RESUMES.poor.content;
    const resume = parseStructuredResume(rawText);
    const analyses = {
      contact: analyzeContact(resume.contact, rawText),
      section: analyzeSections(resume, rawText),
      formatting: analyzeFormatting(rawText),
      content: analyzeContent(rawText),
      skills: analyzeSkills(resume.skills, rawText),
    };

    const result = evaluateAtsScores(resume, analyses);

    for (const score of Object.values(result.categories)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});
