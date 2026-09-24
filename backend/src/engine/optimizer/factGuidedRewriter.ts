import { FactGuidedRewriteRequest, FactGuidedRewriteResponse } from './types.js';
import { extractEvidenceFromText } from '../critique/evidenceExtractor.js';
import { validateRevisionFacts } from '../critique/factValidator.js';

const STRONG_VERB_MAP: Record<string, string> = {
  'worked on': 'Architected and engineered',
  'responsible for': 'Spearheaded and delivered',
  'helped with': 'Collaborated on developing',
  'assisted in': 'Accelerated development of',
  'handled': 'Engineered and maintained',
  'participated in': 'Co-designed and implemented',
  'involved in': 'Engineered core modules for',
  'supported': 'Maintained and elevated',
  'contributed to': 'Engineered scalable solutions for',
  'developed': 'Engineered and deployed',
  'created': 'Architected and built',
  'built': 'Engineered and deployed',
};

/**
 * Transforms an original resume statement using user-supplied facts
 * into a grounded Google X-Y-Z formula accomplishment statement.
 */
export function generateFactGuidedRewrite(
  request: FactGuidedRewriteRequest
): FactGuidedRewriteResponse {
  const { originalText, section, userFacts } = request;
  const cleanOriginal = originalText.trim();
  const lowerOriginal = cleanOriginal.toLowerCase();

  // 1. Identify or select power verb
  let powerVerb = 'Engineered and deployed';
  for (const [weakPhrase, strongVerb] of Object.entries(STRONG_VERB_MAP)) {
    if (lowerOriginal.startsWith(weakPhrase) || lowerOriginal.includes(`was ${weakPhrase}`)) {
      powerVerb = strongVerb;
      break;
    }
  }

  // 2. Extract facts from user inputs
  const techInput = userFacts.technology?.trim() || '';
  const metricInput = userFacts.metric?.trim() || '';
  const purposeInput = userFacts.purpose?.trim() || '';
  const detailsInput = userFacts.details?.trim() || '';

  // Extract core task by stripping weak starters
  let coreTask = cleanOriginal;
  for (const weakPhrase of Object.keys(STRONG_VERB_MAP)) {
    const regex = new RegExp(`^(?:was\\s+)?${weakPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    if (regex.test(coreTask)) {
      coreTask = coreTask.replace(regex, '').trim();
      break;
    }
  }

  // Capitalize first letter of core task
  if (coreTask.length > 0) {
    coreTask = coreTask.charAt(0).toLowerCase() + coreTask.slice(1);
  }

  // 3. Assemble Grounded Sentence
  let synthesized = '';

  const techClause = techInput ? ` utilizing ${techInput}` : '';
  const purposeClause = purposeInput ? ` for ${purposeInput}` : '';
  const metricClause = metricInput ? `, achieving ${metricInput}` : '';

  if (purposeInput && techInput && metricInput) {
    // Full Google X-Y-Z formula: Accomplished [X], measured by [Y], by doing [Z]
    synthesized = `${powerVerb} ${purposeClause.replace(/^ for /, '')}${techClause}${metricClause}.`;
  } else if (techInput && metricInput) {
    synthesized = `${powerVerb} ${coreTask}${techClause}${metricClause}.`;
  } else if (techInput) {
    synthesized = `${powerVerb} ${coreTask}${techClause}.`;
  } else if (metricInput) {
    synthesized = `${powerVerb} ${coreTask}${metricClause}.`;
  } else if (detailsInput) {
    synthesized = `${powerVerb} ${coreTask} by implementing ${detailsInput}.`;
  } else {
    // Power verb rewrite with original text
    synthesized = `${powerVerb} ${coreTask}.`;
  }

  // Normalize punctuation and spacing
  synthesized = synthesized
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/,\./g, '.')
    .trim();

  // 4. Validate Groundedness against original + user facts
  const simulatedResumeText = `${originalText} ${techInput} ${metricInput} ${purposeInput} ${detailsInput}`;
  const verifiedEvidence = extractEvidenceFromText(simulatedResumeText, section);

  const validation = validateRevisionFacts(synthesized, verifiedEvidence);

  const verifiedFactsList = [
    ...verifiedEvidence.verifiedTechnologies,
    ...verifiedEvidence.verifiedMetrics,
    ...Object.values(userFacts).filter(Boolean),
  ];

  return {
    originalText,
    suggestedRevision: synthesized,
    verifiedFacts: Array.from(new Set(verifiedFactsList)),
    explanation:
      'Structured with an active power verb and anchored strictly in your supplied technical stack and quantifiable outcomes.',
    recruiterTip:
      'Bullets structured with action verbs and quantifiable results achieve the highest interview conversion rates in automated ATS filtering.',
    affectedCategory: metricInput ? 'achievements' : techInput ? 'keywordRelevance' : 'experience',
    isValid: validation.isValid,
    rejectionReason: validation.rejectionReason,
  };
}
