import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractAndParseJSON } from '../../validation/schema.js';

export interface ImprovementOption {
  type: 'executive_impact' | 'technical_depth' | 'action_leadership';
  label: string;
  improvedText: string;
  explanation: string;
}

export interface BulletImprovementResponse {
  originalText: string;
  section: string;
  improvements: ImprovementOption[];
}

export async function generateBulletImprovements(
  text: string,
  section: string = 'experience',
  contextText?: string
): Promise<BulletImprovementResponse> {
  const trimmed = text.trim();
  const nvidiaApiKey = process.env.NVIDIA_API_KEY?.trim();
  const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || 'meta/muse-glimmer-30b';

  const prompt = `Rewrite this resume statement for a "${section}" section.
ORIGINAL STATEMENT: "${trimmed}"
${contextText ? `CANDIDATE CONTEXT: ${contextText.slice(0, 500)}` : ''}

CRITICAL RULES:
1. DO NOT invent, hallucinate, or fabricate any numbers, percentages, team sizes, company names, or achievements.
2. If numbers/metrics are absent in the original text, provide an explicit placeholder in brackets, such as "[metric: specify % improvement or users served]".
3. Provide 3 distinct styles:
   - Executive Impact (focus on business value, Google XYZ formula)
   - Technical Depth (focus on architecture, engineering rigour, and technologies)
   - Action & Leadership (focus on initiative, cross-functional ownership, and delivery)

Return JSON format:
{
  "improvements": [
    {
      "type": "executive_impact",
      "label": "Executive & Impact-Focused",
      "improvedText": "...",
      "explanation": "..."
    },
    {
      "type": "technical_depth",
      "label": "Technical Depth & Engineering Rigor",
      "improvedText": "...",
      "explanation": "..."
    },
    {
      "type": "action_leadership",
      "label": "Action & Leadership-Driven",
      "improvedText": "...",
      "explanation": "..."
    }
  ]
}`;

  // 1. Try NVIDIA NIM API if configured
  if (nvidiaApiKey) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaApiKey}`,
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (response.ok) {
        const data: any = await response.json();
        const message = data?.choices?.[0]?.message;
        const content = message?.content || message?.reasoning_content || '';
        const parsed: any = extractAndParseJSON(content);
        if (parsed && Array.isArray(parsed.improvements) && parsed.improvements.length > 0) {
          return {
            originalText: trimmed,
            section,
            improvements: parsed.improvements.slice(0, 3),
          };
        }
      }
    } catch (err: any) {
      console.warn('[improvementEngine] NVIDIA API call failed, falling back:', err.message);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const res = await model.generateContent(prompt);
      const parsed: any = extractAndParseJSON(res.response.text());
      if (parsed && Array.isArray(parsed.improvements) && parsed.improvements.length > 0) {
        return {
          originalText: trimmed,
          section,
          improvements: parsed.improvements.slice(0, 3),
        };
      }
    } catch (err: any) {
      console.warn('[improvementEngine] Gemini call failed, using deterministic templates:', err.message);
    }
  }

  // Deterministic Zero-Hallucination Fallback
  return generateDeterministicBulletImprovements(trimmed, section);
}

export function generateDeterministicBulletImprovements(
  text: string,
  section: string = 'experience'
): BulletImprovementResponse {
  const cleaned = text
    .replace(/^([•\-\*\d+\.\)]\s*)+/, '')
    .replace(/\.$/, '')
    .trim();

  // Strip weak starters
  const weakStarters = [
    'responsible for', 'worked on', 'helped with', 'assisted in',
    'handled', 'participated in', 'tasked with', 'duties included'
  ];

  let coreActivity = cleaned;
  for (const starter of weakStarters) {
    if (new RegExp(`^${starter}\\s+`, 'i').test(coreActivity)) {
      coreActivity = coreActivity.replace(new RegExp(`^${starter}\\s+`, 'i'), '').trim();
      break;
    }
  }

  // Remove leading "the", "a", "an"
  const strippedActivity = coreActivity.replace(/^(the|a|an)\s+/i, '');

  const executiveText = `Architected and deployed ${strippedActivity}, driving measurable operational gains across [target metric: e.g. X% latency reduction or Y daily active users].`;
  const technicalText = `Engineered robust solutions for ${strippedActivity} utilizing best-practice architectures and automated testing to optimize system reliability across [target metric: e.g. X components or Y% coverage].`;
  const leadershipText = `Spearheaded ${strippedActivity} in close collaboration with cross-functional stakeholders, accelerating delivery turnaround by [X hours/sprints].`;

  return {
    originalText: text,
    section,
    improvements: [
      {
        type: 'executive_impact',
        label: 'Executive & Impact-Focused',
        improvedText: executiveText,
        explanation: 'Applies the Google XYZ framework leading with a decisive action verb and outcome placeholder without fabricating facts.',
      },
      {
        type: 'technical_depth',
        label: 'Technical Depth & Engineering Rigor',
        improvedText: technicalText,
        explanation: 'Highlights architectural rigor, engineering standards, and system stability.',
      },
      {
        type: 'action_leadership',
        label: 'Action & Leadership-Driven',
        improvedText: leadershipText,
        explanation: 'Frames execution in terms of leadership, initiative, and cross-functional momentum.',
      },
    ],
  };
}
