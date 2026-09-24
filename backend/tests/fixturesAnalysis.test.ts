import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateWithHeuristicEngine } from '../src/services/aiEvaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

function readFixture(filename: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf-8');
}

describe('Mock Resume Fixtures Analysis Suite', () => {
  it('Fixture 1: Excellent Resume should achieve top-tier score and praise metrics', () => {
    const text = readFixture('01_excellent_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.overall_score).toBeGreaterThanOrEqual(80);
    expect(result.score_grade).toMatch(/Exceptional|Strong/);
    expect(result.category_scores.ats).toBeGreaterThanOrEqual(80);
    expect(result.category_scores.impact).toBeGreaterThanOrEqual(75);
    expect(result.strengths.some((s) => s.toLowerCase().includes('measurable'))).toBe(true);
  });

  it('Fixture 2: Average Resume should score lower than Excellent Resume', () => {
    const excellent = evaluateWithHeuristicEngine(readFixture('01_excellent_resume.txt'));
    const average = evaluateWithHeuristicEngine(readFixture('02_average_resume.txt'));

    expect(average.overall_score).toBeLessThan(excellent.overall_score);
    expect(average.recommendations.length).toBeGreaterThan(0);
  });

  it('Fixture 3: Poor Resume should score low and trigger critical rework status', () => {
    const text = readFixture('03_poor_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.overall_score).toBeLessThan(60);
    expect(result.critical_flaws.length).toBeGreaterThan(0);
    expect(result.score_grade).toMatch(/Critical Rework|Needs/);
  });

  it('Fixture 4: Grammar Errors Resume should reflect lower grammar score', () => {
    const text = readFixture('04_grammar_errors_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.category_scores.grammar).toBeLessThan(80);
  });

  it('Fixture 5: Weak Bullet Points Resume should trigger bullet point improvements', () => {
    const text = readFixture('05_weak_bullet_points_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.bullet_point_improvements.length).toBeGreaterThan(0);
    expect(result.category_scores.impact).toBeLessThan(65);
    expect(result.critical_flaws.some((f) => f.toLowerCase().includes('passive'))).toBe(true);
  });

  it('Fixture 6: ATS Problems Resume should detect formatting/table issues', () => {
    const text = readFixture('06_ats_problems_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.ats_issues.some((i) => i.toLowerCase().includes('table') || i.toLowerCase().includes('ats'))).toBe(true);
  });

  it('Fixture 7: Missing Information Resume should identify missing contact and education', () => {
    const text = readFixture('07_missing_information_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.missing_information.some((m) => m.toLowerCase().includes('education'))).toBe(true);
    expect(result.ats_issues.some((a) => a.toLowerCase().includes('email'))).toBe(true);
  });

  it('Fixture 8: Unusual Formatting Resume should identify unconventional structure', () => {
    const text = readFixture('08_unusual_formatting_resume.txt');
    const result = evaluateWithHeuristicEngine(text);

    expect(result.overall_score).toBeLessThan(75);
  });
});
