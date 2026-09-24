import { describe, it, expect } from 'vitest';
import { generateBulletImprovements } from '../src/services/recommendations/improvementEngine.js';

describe('AI Improvement Engine Suite', () => {
  it('should generate multi-variant improvements without fabricating metrics', async () => {
    const inputStatement = 'Responsible for developing web application components in React.';
    const result = await generateBulletImprovements(inputStatement, 'experience');

    expect(result.originalText).toBe(inputStatement);
    expect(result.improvements.length).toBe(3);

    const types = result.improvements.map((i) => i.type);
    expect(types).toContain('executive_impact');
    expect(types).toContain('technical_depth');
    expect(types).toContain('action_leadership');

    // Verification of Zero-Hallucination:
    // Should NOT fabricate specific numbers like "10,000 users" or "50% increase" directly in text
    // without bracketed placeholder templates.
    for (const option of result.improvements) {
      expect(option.improvedText).not.toContain('10,000 users');
      expect(option.improvedText).not.toContain('served 5,000');
      // Must contain a template placeholder like [metric... or [target metric
      expect(option.improvedText).toMatch(/\[(metric|target metric|quantifiable outcome|X)/i);
    }
  });
});
