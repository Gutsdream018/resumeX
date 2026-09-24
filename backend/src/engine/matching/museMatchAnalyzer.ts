import { StructuredResume } from '../../models/resume.types.js';
import { JobDescriptionJSON } from './jobDescriptionParser.js';
import { extractAndParseJSON } from '../../validation/schema.js';

export interface MuseMatchEvaluation {
  semanticAlignmentScore: number;
  responsibilityFitScore: number;
  domainFitScore: number;
  strengths: string[];
  semanticGaps: Array<{ requirement: string; limitation: string; suggestion: string }>;
  experienceInsights: Array<{ roleOrProject: string; relevanceScore: number; summary: string }>;
  confidence: 'High' | 'Medium' | 'Low';
}

const MUSE_MATCH_SYSTEM_PROMPT = `You are an elite ATS Semantic Alignment & Job Fit intelligence engine.
Your task is to compare structured candidate resume evidence against a target job description.
CRITICAL ZERO-HALLUCINATION CONSTRAINT:
1. You MUST NEVER invent, assume, or hallucinate candidate skills, metrics, experiences, or certifications.
2. Only evaluate what is explicitly supported in the candidate resume evidence.
3. Return ONLY valid JSON matching this schema:
{
  "semanticAlignmentScore": 75,
  "responsibilityFitScore": 70,
  "domainFitScore": 80,
  "strengths": ["string"],
  "semanticGaps": [
    {
      "requirement": "string",
      "limitation": "string",
      "suggestion": "string"
    }
  ],
  "experienceInsights": [
    {
      "roleOrProject": "string",
      "relevanceScore": 85,
      "summary": "string"
    }
  ],
  "confidence": "High"
}
DO NOT include markdown fences, thinking, conversational text, or preamble. Return strict JSON directly.`;

export async function runMuseMatchAnalysis(
  structuredResume: StructuredResume,
  jobDescription: JobDescriptionJSON,
  deterministicScore: number
): Promise<MuseMatchEvaluation> {
  const nvidiaApiKey = process.env.NVIDIA_API_KEY?.trim();
  const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || 'meta/muse-glimmer-30b';

  if (nvidiaApiKey) {
    try {
      const compactResume = {
        name: structuredResume.contact?.name || 'Candidate',
        summary: structuredResume.summary,
        skills: structuredResume.skills?.technical || [],
        experience: (structuredResume.experience || []).slice(0, 3).map((e) => ({
          role: e.role,
          company: e.company,
          bullets: (e.bullets || []).slice(0, 3),
        })),
        projects: (structuredResume.projects || []).slice(0, 2).map((p) => ({
          name: p.name,
          bullets: (p.bullets || []).slice(0, 2),
        })),
        education: (structuredResume.education || []).slice(0, 2).map((edu) => ({
          degree: edu.degree,
          institution: edu.institution,
          gpa: edu.gpa,
        })),
        certifications: structuredResume.certifications || [],
      };

      const compactJD = {
        title: jobDescription.jobTitle,
        seniority: jobDescription.signals.seniority,
        domain: jobDescription.signals.domain,
        mustHave: jobDescription.requirements.mustHave.slice(0, 6).map((m) => m.text),
        responsibilities: jobDescription.requirements.responsibilities.slice(0, 6).map((r) => r.text),
        skills: jobDescription.requirements.skills.slice(0, 10).map((s) => s.name),
        education: jobDescription.requirements.education.map((e) => e.text),
      };

      const userPrompt = `Compare Candidate Evidence against Job Requirements:
RESUME EVIDENCE:
${JSON.stringify(compactResume)}

JOB REQUIREMENTS:
${JSON.stringify(compactJD)}

Deterministic Base Alignment: ${deterministicScore}/100`;

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaApiKey}`,
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: [
            { role: 'system', content: MUSE_MATCH_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = extractAndParseJSON(content) as MuseMatchEvaluation;
          if (parsed && typeof parsed.semanticAlignmentScore === 'number') {
            return parsed;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[MATCH ENGINE] Muse semantic analysis fallback: ${err.message}`);
    }
  }

  // Fast Deterministic Heuristic Fallback
  return generateHeuristicSemanticMatch(structuredResume, jobDescription, deterministicScore);
}

function generateHeuristicSemanticMatch(
  resume: StructuredResume,
  jd: JobDescriptionJSON,
  deterministicScore: number
): MuseMatchEvaluation {
  const strengths: string[] = [];
  const semanticGaps: Array<{ requirement: string; limitation: string; suggestion: string }> = [];
  const experienceInsights: Array<{ roleOrProject: string; relevanceScore: number; summary: string }> = [];

  // Check top skills
  const resumeSkills = new Set([
    ...(resume.skills?.technical || []),
    ...(resume.skills?.tools || []),
    ...(resume.certifications || []),
  ].map((s) => s.toLowerCase()));

  jd.requirements.skills.slice(0, 5).forEach((skill) => {
    if (resumeSkills.has(skill.name.toLowerCase())) {
      strengths.push(`Demonstrated proficiency in ${skill.name}`);
    } else {
      semanticGaps.push({
        requirement: skill.name,
        limitation: `No explicit mention of ${skill.name} found in resume skills or experience.`,
        suggestion: `If you have worked with ${skill.name}, include it in your technical skills or project descriptions.`,
      });
    }
  });

  // Evaluate experience relevance
  (resume.experience || []).forEach((exp) => {
    let relScore = 50;
    const expText = `${exp.role} ${exp.company} ${exp.bullets.join(' ')}`.toLowerCase();
    jd.technologies.forEach((tech) => {
      if (expText.includes(tech.toLowerCase())) relScore += 10;
    });
    relScore = Math.min(relScore, 95);
    experienceInsights.push({
      roleOrProject: `${exp.role} at ${exp.company}`,
      relevanceScore: relScore,
      summary: `Aligns with ${jd.signals.domain} role expectations.`,
    });
  });

  (resume.projects || []).forEach((proj) => {
    let relScore = 55;
    const projText = `${proj.name} ${(proj.technologies || []).join(' ')} ${(proj.bullets || []).join(' ')}`.toLowerCase();
    jd.technologies.forEach((tech) => {
      if (projText.includes(tech.toLowerCase())) relScore += 12;
    });
    relScore = Math.min(relScore, 92);
    experienceInsights.push({
      roleOrProject: proj.name,
      relevanceScore: relScore,
      summary: `Hands-on project work demonstrating engineering applications.`,
    });
  });

  return {
    semanticAlignmentScore: Math.min(Math.max(deterministicScore, 30), 95),
    responsibilityFitScore: Math.min(Math.max(deterministicScore - 5, 25), 90),
    domainFitScore: Math.min(Math.max(deterministicScore + 5, 35), 98),
    strengths: strengths.length > 0 ? strengths : ['Academic engineering foundation', 'Relevant technical training'],
    semanticGaps: semanticGaps.slice(0, 4),
    experienceInsights: experienceInsights.slice(0, 5),
    confidence: 'Medium',
  };
}
