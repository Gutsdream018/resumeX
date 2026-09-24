import { extractEvidenceFromText } from '../critique/evidenceExtractor.js';
import { MissingInformationPrompt, MissingInformationField } from './types.js';

/**
 * Analyzes a resume statement or bullet point to determine missing evidence
 * dimensions and generates structured fact collection form fields.
 */
export function detectMissingInformation(
  sourceText: string,
  section: string = 'experience',
  bulletId?: string
): MissingInformationPrompt {
  const ev = extractEvidenceFromText(sourceText, section);
  const detectedMissing: string[] = [];
  const fields: MissingInformationField[] = [];

  const hasMetrics = ev.verifiedMetrics.length > 0;
  const hasTech = ev.verifiedTechnologies.length > 0;
  const hasOutcomes = ev.verifiedOutcomes.length > 0;

  // 1. Check Technology
  if (!hasTech) {
    detectedMissing.push('Technology Stack');
    fields.push({
      key: 'technology',
      label: 'Technologies & Frameworks Utilized',
      placeholder: 'e.g. React, Node.js, PostgreSQL, Docker, AWS',
      required: false,
      type: 'tech_tag',
      hint: 'List the actual languages, databases, or tools you used for this deliverable.',
    });
  }

  // 2. Check Measurable Metrics / Scale
  if (!hasMetrics) {
    detectedMissing.push('Quantifiable Result or Scale');
    fields.push({
      key: 'metric',
      label: 'Measurable Outcome, Scale, or Efficiency Gain',
      placeholder: 'e.g. 35% latency reduction, 50,000 active users, 12 team members',
      required: false,
      type: 'text',
      hint: 'Include percentages, user scale, request volume, or time saved if known.',
    });
  }

  // 3. Check Purpose / Business Context
  if (!hasOutcomes) {
    detectedMissing.push('Business Context / Purpose');
    fields.push({
      key: 'purpose',
      label: 'Target System or Feature Purpose',
      placeholder: 'e.g. customer payment gateway, internal analytics pipeline, authentication portal',
      required: false,
      type: 'text',
      hint: 'Specify the specific subsystem or business workflow you delivered.',
    });
  }

  const promptId = bulletId ? `missing-${bulletId}` : `missing-${Math.random().toString(36).substring(2, 8)}`;

  return {
    id: promptId,
    bulletId,
    sourceText,
    section,
    detectedMissing: detectedMissing.length > 0 ? detectedMissing : ['Contextual specificity'],
    fields:
      fields.length > 0
        ? fields
        : [
            {
              key: 'details',
              label: 'Additional Context or Implementation Details',
              placeholder: 'e.g. architected microservices, automated regression suite',
              required: false,
              type: 'text',
            },
          ],
    reason:
      detectedMissing.length > 0
        ? `This bullet describes a task without specifying: ${detectedMissing.join(', ')}.`
        : 'Adding concrete technical details enhances recruiter and ATS keyword matching.',
  };
}
