import { GoogleGenerativeAI } from '@google/generative-ai';
import { StructuredResume, StructuredRecommendation } from '../../models/resume.types.js';
import { extractAndParseJSON } from '../../validation/schema.js';

export interface LlmAnalysisOutput {
  strengths: string[];
  criticalIssues: string[];
  warnings: string[];
  recommendations: StructuredRecommendation[];
}

export const LLM_SYSTEM_PROMPT = `You are an ATS resume evaluation engine. Return ONLY valid JSON matching this schema:
{
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
DO NOT include markdown thinking, conversational text, or preamble. Return JSON directly.`;

export async function runLlmAnalysis(
  structuredResume: StructuredResume,
  rawText: string,
  deterministicContext: {
    scores: { overall: number; ats: number; experience: number };
    issues: string[];
    strengths: string[];
  }
): Promise<LlmAnalysisOutput> {
  const nvidiaApiKey = process.env.NVIDIA_API_KEY?.trim();
  const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || 'meta/muse-glimmer-30b';

  // 1. Try NVIDIA NIM API (Muse Glimmer 30B)
  if (nvidiaApiKey) {
    const startTime = Date.now();
    try {
      console.log('[RECOMMENDATIONS] started');
      console.log(`[Muse] Initiating analysis with ${nvidiaModel}...`);
      const userPrompt = `Evaluate this resume concisely and return valid JSON directly with up to 3 high-priority recommendations:
STRUCTURED RESUME:
${JSON.stringify({
  contact: structuredResume.contact,
  summary: structuredResume.summary,
  experience: structuredResume.experience.slice(0, 3),
  projects: structuredResume.projects.slice(0, 2),
  skills: structuredResume.skills,
  education: structuredResume.education.slice(0, 2),
})}

DETERMINISTIC DIAGNOSTICS:
- Overall Score: ${deterministicContext.scores.overall}/100
- ATS Compatibility: ${deterministicContext.scores.ats}/100
- Experience Score: ${deterministicContext.scores.experience}/100
- Identified Issues: ${deterministicContext.issues.slice(0, 4).join('; ')}
- Identified Strengths: ${deterministicContext.strengths.slice(0, 4).join('; ')}

RAW RESUME SNIPPET:
${rawText.slice(0, 1500)}`;

      console.log('[RECOMMENDATIONS] request created');
      console.log('[RECOMMENDATIONS] API request sent');
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaApiKey}`,
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: [
            { role: 'system', content: LLM_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(90000),
      });

      const elapsed = Date.now() - startTime;
      if (response.ok) {
        console.log(`[RECOMMENDATIONS] API response received (${elapsed}ms)`);
        const data: any = await response.json();
        const message = data?.choices?.[0]?.message;
        const content = message?.content || message?.reasoning_content || '';
        console.log('[RECOMMENDATIONS] response parsed');
        const parsed: any = extractAndParseJSON(content);
        console.log('[RECOMMENDATIONS] validation complete');

        if (parsed && Array.isArray(parsed.recommendations)) {
          console.log(`[Muse] Analysis completed in ${elapsed}ms with ${parsed.recommendations.length} recommendations.`);
          return {
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
          };
        }
      } else {
        console.warn(`[Muse] NVIDIA API returned status ${response.status} in ${elapsed}ms. Falling back to deterministic rules.`);
      }
    } catch (err: any) {
      console.warn(`[Muse] NVIDIA API call failed (${err.message}) in ${Date.now() - startTime}ms. Falling back to deterministic rules.`);
    }
  }

  // 2. Try Gemini if configured
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
        systemInstruction: LLM_SYSTEM_PROMPT,
      });

      const userPrompt = `Evaluate this resume:
STRUCTURED RESUME:
${JSON.stringify(structuredResume, null, 2)}

DETERMINISTIC DIAGNOSTICS:
- Overall Score: ${deterministicContext.scores.overall}/100
- ATS Compatibility: ${deterministicContext.scores.ats}/100
- Experience Score: ${deterministicContext.scores.experience}/100
- Identified Issues: ${deterministicContext.issues.join('; ')}
- Identified Strengths: ${deterministicContext.strengths.join('; ')}

RAW RESUME SNIPPET:
${rawText.slice(0, 3000)}`;

      const response = await model.generateContent(userPrompt);
      const textResponse = response.response.text();
      const parsed: any = extractAndParseJSON(textResponse);

      if (parsed && Array.isArray(parsed.recommendations)) {
        return {
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
        };
      }
    } catch (err: any) {
      console.warn('[runLlmAnalysis] Gemini API call failed or timed out. Falling back to deterministic analysis:', err.message);
    }
  }

  // 3. Deterministic Fallback with Zero Hallucination
  return generateDeterministicLlmFallback(structuredResume, deterministicContext);
}

export function generateDeterministicLlmFallback(
  structuredResume: StructuredResume,
  context: {
    scores: { overall: number; ats: number; experience: number };
    issues: string[];
    strengths: string[];
  }
): LlmAnalysisOutput {
  const strengths: string[] = [...context.strengths];
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: StructuredRecommendation[] = [];

  for (const issue of context.issues) {
    if (/missing|zero|critically|scramble/i.test(issue)) {
      criticalIssues.push(issue);
    } else {
      warnings.push(issue);
    }
  }

  // Generate actionable recommendations from actual resume experience items
  for (const exp of structuredResume.experience) {
    for (const bullet of exp.bullets) {
      if (recommendations.length >= 4) break;

      const weakMatch = bullet.match(/^(responsible for|worked on|helped with|assisted in|handled|tasked with)\s+(.*)/i);
      if (weakMatch) {
        recommendations.push({
          section: 'experience',
          issue: `Passive duty phrasing in ${exp.role} bullet point`,
          severity: 'high',
          explanation: 'Leading with passive phrases conceals your direct impact and role ownership.',
          currentText: bullet,
          suggestedText: `Spearheaded ${weakMatch[2].replace(/^the\s+/i, '')}, achieving [quantifiable outcome, e.g. X% efficiency increase or Y hours saved].`,
        });
        continue;
      }

      const hasMetric = /\d+%|\$\d+|\b\d+\b/i.test(bullet);
      if (!hasMetric && recommendations.length < 4 && bullet.length > 25) {
        recommendations.push({
          section: 'experience',
          issue: 'Missing quantifiable outcome',
          severity: 'medium',
          explanation: 'Bullet point describes an action but does not demonstrate scale or business impact.',
          currentText: bullet,
          suggestedText: `${bullet.replace(/\.$/, '')}, delivering measurable outcomes across [target metric: e.g. X users / Y% performance gain].`,
        });
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      section: 'experience',
      issue: 'Quantify engineering outcomes',
      severity: 'medium',
      explanation: 'Recruiters prioritize resumes demonstrating measurable business or technical results.',
      currentText: structuredResume.experience[0]?.bullets[0] || 'Worked on software development tasks.',
      suggestedText: 'Delivered software components optimizing system throughput and response times across [X target users].',
    });
  }

  return {
    strengths: strengths.slice(0, 8),
    criticalIssues: criticalIssues.slice(0, 8),
    warnings: warnings.slice(0, 8),
    recommendations: recommendations.slice(0, 6),
  };
}
