import { z } from 'zod';

export const CategoryScoresSchema = z.object({
  ats: z.number().min(0).max(100),
  content: z.number().min(0).max(100),
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  formatting: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  professionalism: z.number().min(0).max(100),
});

export const BulletPointImprovementSchema = z.object({
  original: z.string().min(1),
  problem: z.string().min(1),
  improved: z.string().min(1),
  why_better: z.string().min(1),
});

export const RawAIResponseSchema = z.object({
  overall_score: z.number().optional(),
  category_scores: CategoryScoresSchema,
  strengths: z.array(z.string()).default([]),
  critical_flaws: z.array(z.string()).default([]),
  minor_flaws: z.array(z.string()).default([]),
  ats_issues: z.array(z.string()).default([]),
  missing_information: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  bullet_point_improvements: z.array(BulletPointImprovementSchema).default([]),
  professionalism_summary: z.string().optional().default('Professional assessment completed.'),
});

/**
 * Extracts and safely parses JSON from LLM text output which may contain markdown code blocks.
 */
export function extractAndParseJSON(rawText: string): unknown {
  // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ...)
  let cleanText = rawText.trim();
  const fenceRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleanText.match(fenceRegex);
  if (match && match[1]) {
    cleanText = match[1].trim();
  } else {
    // If not enclosed completely, search for the first '{' and last '}'
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
  }

  return JSON.parse(cleanText);
}
