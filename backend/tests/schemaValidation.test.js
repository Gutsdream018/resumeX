import { describe, it, expect } from 'vitest';
import { RawAIResponseSchema, BulletPointImprovementSchema, extractAndParseJSON, } from '../src/validation/schema.js';
describe('Schema Validation and JSON Parsing', () => {
    it('should successfully parse valid AI response schema', () => {
        const validPayload = {
            category_scores: {
                ats: 85,
                content: 75,
                skills: 80,
                experience: 70,
                impact: 65,
                formatting: 85,
                grammar: 90,
                professionalism: 85,
            },
            strengths: ['Clear header', 'Strong technical skills'],
            critical_flaws: ['Missing quantifiable metrics'],
            minor_flaws: ['Inconsistent dates'],
            ats_issues: ['Consider simplifying layout'],
            missing_information: ['Degree date'],
            recommendations: ['Add metrics'],
            bullet_point_improvements: [
                {
                    original: 'Worked on web apps.',
                    problem: 'Too vague',
                    improved: 'Developed and tested web apps.',
                    why_better: 'Action verb included',
                },
            ],
            professionalism_summary: 'Overall strong profile.',
        };
        const parsed = RawAIResponseSchema.parse(validPayload);
        expect(parsed.category_scores.ats).toBe(85);
        expect(parsed.bullet_point_improvements.length).toBe(1);
        expect(parsed.bullet_point_improvements[0].original).toBe('Worked on web apps.');
    });
    it('should reject invalid payloads missing required category scores', () => {
        const invalidPayload = {
            category_scores: {
                ats: 80,
                // missing other categories
            },
            strengths: [],
        };
        expect(() => RawAIResponseSchema.parse(invalidPayload)).toThrow();
    });
    it('should reject bullet point improvements missing required fields', () => {
        const invalidBullet = {
            original: 'Did coding.',
            // missing problem, improved, why_better
        };
        expect(() => BulletPointImprovementSchema.parse(invalidBullet)).toThrow();
    });
    it('should cleanly extract JSON embedded inside markdown code fences', () => {
        const markdownWithJson = '```json\n{\n  "status": "success",\n  "count": 42\n}\n```';
        const result = extractAndParseJSON(markdownWithJson);
        expect(result.status).toBe('success');
        expect(result.count).toBe(42);
    });
    it('should extract JSON with surrounding conversational commentary', () => {
        const rawLLMOutput = 'Here is the analysis:\n{"status": "ok", "value": 100}\nHope this helps!';
        const result = extractAndParseJSON(rawLLMOutput);
        expect(result.status).toBe('ok');
        expect(result.value).toBe(100);
    });
});
