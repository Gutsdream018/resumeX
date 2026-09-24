import { describe, it, expect } from 'vitest';
import { calculateWeightedScore, clampScore, CATEGORY_WEIGHTS } from '../src/services/scorer.js';
describe('Deterministic Scorer Service', () => {
    it('should have category weights summing to exactly 1.00 (100%)', () => {
        const totalWeight = Object.values(CATEGORY_WEIGHTS).reduce((sum, w) => sum + w, 0);
        expect(totalWeight).toBeCloseTo(1.0, 5);
        expect(CATEGORY_WEIGHTS.ats).toBe(0.20);
        expect(CATEGORY_WEIGHTS.content).toBe(0.15);
        expect(CATEGORY_WEIGHTS.skills).toBe(0.15);
        expect(CATEGORY_WEIGHTS.experience).toBe(0.15);
        expect(CATEGORY_WEIGHTS.impact).toBe(0.15);
        expect(CATEGORY_WEIGHTS.formatting).toBe(0.10);
        expect(CATEGORY_WEIGHTS.grammar).toBe(0.05);
        expect(CATEGORY_WEIGHTS.professionalism).toBe(0.05);
    });
    it('should correctly calculate deterministic weighted score for 100s in all categories', () => {
        const perfectScores = {
            ats: 100,
            content: 100,
            skills: 100,
            experience: 100,
            impact: 100,
            formatting: 100,
            grammar: 100,
            professionalism: 100,
        };
        const result = calculateWeightedScore(perfectScores);
        expect(result.overall_score).toBe(100);
        expect(result.score_grade).toBe('Exceptional');
    });
    it('should correctly calculate deterministic weighted score for 0 in all categories', () => {
        const zeroScores = {
            ats: 0,
            content: 0,
            skills: 0,
            experience: 0,
            impact: 0,
            formatting: 0,
            grammar: 0,
            professionalism: 0,
        };
        const result = calculateWeightedScore(zeroScores);
        expect(result.overall_score).toBe(0);
        expect(result.score_grade).toBe('Requires Critical Rework');
    });
    it('should verify exact mathematical calculation according to weights', () => {
        // ats: 80 * 0.20 = 16
        // content: 70 * 0.15 = 10.5
        // skills: 90 * 0.15 = 13.5
        // experience: 60 * 0.15 = 9.0
        // impact: 50 * 0.15 = 7.5
        // formatting: 80 * 0.10 = 8.0
        // grammar: 90 * 0.05 = 4.5
        // professionalism: 80 * 0.05 = 4.0
        // Sum = 16 + 10.5 + 13.5 + 9.0 + 7.5 + 8.0 + 4.5 + 4.0 = 73.0
        const testScores = {
            ats: 80,
            content: 70,
            skills: 90,
            experience: 60,
            impact: 50,
            formatting: 80,
            grammar: 90,
            professionalism: 80,
        };
        const result = calculateWeightedScore(testScores);
        expect(result.overall_score).toBe(73);
        expect(result.score_grade).toBe('Good / Minor Refinements Needed');
    });
    it('should clamp out-of-range values between 0 and 100', () => {
        expect(clampScore(120)).toBe(100);
        expect(clampScore(-25)).toBe(0);
        expect(clampScore(NaN)).toBe(0);
    });
});
