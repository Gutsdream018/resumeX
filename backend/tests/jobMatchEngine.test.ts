import { describe, it, expect } from 'vitest';
import { executeJobMatch } from '../src/services/ats/jobMatchService.js';
import { MOCK_RESUMES } from './fixtures/mockResumes.js';

describe('Job Match Engine Suite', () => {
  it('should clearly separate skill match, experience relevance, keyword match, and education', () => {
    const resumeText = MOCK_RESUMES.softwareEngineer.content;
    const jobDescription = `We are seeking a Senior Full-Stack Engineer with 5+ years of experience in React, TypeScript, Node.js, and AWS.
A Bachelor's degree in Computer Science or Software Engineering is required.
Experience with GraphQL and microservices is a plus.`;

    const match = executeJobMatch(resumeText, jobDescription);

    expect(match.matchScore).toBeGreaterThanOrEqual(80);
    expect(match.matchedSkills).toContain('react');
    expect(match.matchedSkills).toContain('typescript');
    expect(match.matchedSkills).toContain('node');

    expect(match.breakdown).toBeDefined();
    expect(match.breakdown?.skillMatch).toBeGreaterThanOrEqual(70);
    expect(match.breakdown?.experienceRelevance).toBeGreaterThanOrEqual(75);
    expect(match.breakdown?.keywordMatch).toBeGreaterThanOrEqual(70);
    expect(match.breakdown?.educationRelevance).toBeGreaterThanOrEqual(80);

    expect(match.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
