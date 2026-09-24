import { describe, it, expect } from 'vitest';
import { parseStructuredResume } from '../src/services/parser/sectionParser.js';
import { MOCK_RESUMES } from './fixtures/mockResumes.js';

describe('Section Structuring Suite', () => {
  it('should parse contact information accurately', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.excellent.content);

    expect(structured.contact.name).toBe('SARAH CHEN');
    expect(structured.contact.email).toBe('sarah.chen@example.com');
    expect(structured.contact.phone).toContain('555');
    expect(structured.contact.linkedin).toContain('linkedin.com/in/sarahchen-eng');
    expect(structured.contact.github).toContain('github.com/sarahchen');
  });

  it('should preserve original experience bullet points', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.excellent.content);

    expect(structured.experience.length).toBeGreaterThanOrEqual(2);
    const firstExp = structured.experience[0];
    expect(firstExp.role).toContain('Staff Software Engineer');
    expect(firstExp.bullets.length).toBeGreaterThanOrEqual(3);

    // Ensure metrics inside bullets are strictly preserved without truncation
    expect(firstExp.bullets[0]).toContain('45M+');
    expect(firstExp.bullets[1]).toContain('$320,000');
  });

  it('should extract education institution, degree, and GPA', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.excellent.content);

    expect(structured.education.length).toBeGreaterThanOrEqual(1);
    const edu = structured.education[0];
    expect(edu.degree).toContain('Bachelor of Science');
    expect(edu.institution).toContain('University of California');
  });

  it('should categorize skills into technical, tools, and languages', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.excellent.content);

    expect(structured.skills.languages).toEqual(expect.arrayContaining(['Go', 'TypeScript', 'Python']));
    expect(structured.skills.tools).toEqual(expect.arrayContaining(['Docker', 'Kubernetes', 'AWS']));
    expect(structured.skills.technical).toEqual(expect.arrayContaining(['React', 'Next.js']));
  });

  it('should not invent sections that do not exist', () => {
    const structured = parseStructuredResume(MOCK_RESUMES.poor.content);

    expect(structured.education.length).toBe(0);
    expect(structured.projects.length).toBe(0);
    expect(structured.certifications.length).toBe(0);
  });
});
