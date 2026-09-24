import { StructuredResume, StructuredRecommendation } from '../../models/resume.types.js';
import { extractAndParseJSON } from '../../validation/schema.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';
import { analysisCache } from '../cache/analysisCache.js';

export interface MuseSemanticAnalysisResult {
  experienceQuality: number;
  projectQuality: number;
  summaryQuality: number;
  semanticStrength: number;
  strengths: string[];
  criticalIssues: string[];
  warnings: string[];
  recommendations: StructuredRecommendation[];
  museStatus: 'success' | 'fallback';
  latencyMs?: number;
}

export const MUSE_SYSTEM_PROMPT = `You are an elite Executive ATS & Tech Recruiter evaluation engine.
Evaluate the structured resume provided. Return ONLY valid JSON matching this schema:
{
  "experienceQuality": 75,
  "projectQuality": 80,
  "summaryQuality": 70,
  "semanticStrength": 78,
  "strengths": ["string"],
  "criticalIssues": ["string"],
  "warnings": ["string"],
  "recommendations": [
    {
      "section": "experience",
      "issue": "string",
      "severity": "medium",
      "explanation": "string",
      "currentText": "string",
      "suggestedText": "string"
    }
  ]
}
CRITICAL CONSTRAINT: You MUST NOT invent, hallucinate, or fabricate candidate metrics, company names, job titles, technologies, or achievements.
When recommending improvements, rewrite the candidate's actual text using the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"). If numbers are absent in the original text, insert an explicit bracket placeholder like "[metric: e.g. latency % cut or users served]" instead of inventing numbers.
DO NOT include markdown thinking, conversational text, or preamble. Return strict JSON directly.`;

export async function runMuseSemanticAnalysis(
  structuredResume: StructuredResume,
  rawText: string,
  contextScores: { overall: number; ats: number; experience: number },
  jobDescription: string = ''
): Promise<MuseSemanticAnalysisResult> {
  // Check SHA-256 semantic cache first
  const resumeHash = analysisCache.computeHash(structuredResume);
  const jobHash = jobDescription ? analysisCache.computeHash(jobDescription) : 'none';
  const cachedMuse = analysisCache.getMuseResult(resumeHash, jobHash);
  if (cachedMuse) {
    return { ...cachedMuse, latencyMs: 0 };
  }

  const nvidiaApiKey = process.env.NVIDIA_API_KEY?.trim();
  const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || 'meta/muse-glimmer-30b';

  if (nvidiaApiKey) {
    const startTime = Date.now();
    try {
      console.log('[ATS] Muse analysis initiated (optimized 20s timeout)...');
      
      // Compact canonical payload (excluding nulls, empty items, and raw duplicates)
      const compactPayload = {
        title: structuredResume.contact?.name || 'Candidate',
        summary: structuredResume.summary || undefined,
        experience: (structuredResume.experience || []).slice(0, 3).map((e) => ({
          role: e.role,
          company: e.company,
          bullets: (e.bullets || []).slice(0, 3),
        })),
        skills: structuredResume.skills?.technical || [],
        projects: (structuredResume.projects || []).slice(0, 2).map((p) => ({
          name: p.name,
          bullets: (p.bullets || []).slice(0, 2),
        })),
        education: (structuredResume.education || []).slice(0, 1).map((edu) => ({
          degree: edu.degree,
          institution: edu.institution,
        })),
      };

      const userPrompt = `Evaluate this resume concisely and return valid JSON directly with up to 3 high-priority recommendations:
CANONICAL RESUME:
${JSON.stringify(compactPayload)}

DIAGNOSTIC SCORES:
- ATS: ${contextScores.ats}/100, Exp: ${contextScores.experience}/100, Overall: ${contextScores.overall}/100`;

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaApiKey}`,
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: [
            { role: 'system', content: MUSE_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(20000), // 20s timeout protection
      });

      const elapsed = Date.now() - startTime;
      if (response.ok) {
        const data: any = await response.json();
        const message = data?.choices?.[0]?.message;
        const content = message?.content || message?.reasoning_content || '';
        const parsed: any = extractAndParseJSON(content);

        if (parsed && Array.isArray(parsed.recommendations)) {
          console.log(`[ATS] Muse analysis successfully completed in ${elapsed}ms.`);
          const result: MuseSemanticAnalysisResult = {
            experienceQuality: safeClamp(parsed.experienceQuality, 20, 100, contextScores.experience),
            projectQuality: safeClamp(parsed.projectQuality, 20, 100, 75),
            summaryQuality: safeClamp(parsed.summaryQuality, 20, 100, 70),
            semanticStrength: safeClamp(parsed.semanticStrength, 20, 100, 75),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 8) : [],
            criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues.slice(0, 8) : [],
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice(0, 8) : [],
            recommendations: parsed.recommendations.slice(0, 8).map((r: any) => ({
              section: String(r.section || 'experience'),
              issue: String(r.issue || 'Weak phrasing'),
              severity: (['low', 'medium', 'high', 'critical'].includes(r.severity) ? r.severity : 'medium') as any,
              explanation: String(r.explanation || ''),
              currentText: String(r.currentText || ''),
              suggestedText: String(r.suggestedText || ''),
            })),
            museStatus: 'success',
            latencyMs: elapsed,
          };

          // Store in semantic cache
          analysisCache.setMuseResult(resumeHash, jobHash, result);
          return result;
        }
      } else {
        console.warn(`[ATS] NVIDIA Muse API returned status ${response.status} in ${elapsed}ms. Using deterministic signals.`);
      }
    } catch (err: any) {
      console.warn(`[ATS] NVIDIA Muse API call (${err.message}) in ${Date.now() - startTime}ms. Using fast deterministic signals.`);
    }
  }

  // Deterministic Fallback if API key missing or network times out
  const fallback = generateDeterministicSemanticFallback(structuredResume, contextScores);
  return fallback;
}

function generateDeterministicSemanticFallback(
  structuredResume: StructuredResume,
  contextScores: { overall: number; ats: number; experience: number }
): MuseSemanticAnalysisResult {
  const recommendations: StructuredRecommendation[] = [];

  for (const exp of structuredResume.experience) {
    for (const bullet of exp.bullets) {
      if (recommendations.length >= 3) break;
      const weakMatch = bullet.match(/^(?:responsible for|worked on|helped with|assisted in|handled|tasked with)\s+(.*)/i);
      if (weakMatch) {
        recommendations.push({
          section: 'experience',
          issue: `Passive duty phrasing in "${exp.role}" bullet point`,
          severity: 'high',
          explanation: 'Leading with passive phrasing obscures your direct engineering impact and individual contribution.',
          currentText: bullet,
          suggestedText: `Spearheaded ${weakMatch[1].replace(/^the\s+/i, '')}, achieving [quantifiable metric: e.g. X% efficiency gain or Y hours saved].`,
        });
      }
    }
  }

  if (recommendations.length === 0 && structuredResume.experience.length > 0) {
    recommendations.push({
      section: 'experience',
      issue: 'Quantify engineering outcomes with metrics',
      severity: 'medium',
      explanation: 'Recruiters and hiring managers prioritize bullet points demonstrating measurable business or technical results.',
      currentText: structuredResume.experience[0]?.bullets[0] || 'Worked on software development tasks.',
      suggestedText: 'Architected high-throughput components, delivering measurable performance improvements across [target metric: e.g. X users / Y% latency reduction].',
    });
  }

  return {
    experienceQuality: contextScores.experience,
    projectQuality: 70,
    summaryQuality: 65,
    semanticStrength: contextScores.overall,
    strengths: ['Structured chronology with recognizable technical experience.'],
    criticalIssues: [],
    warnings: [],
    recommendations,
    museStatus: 'fallback',
  };
}
