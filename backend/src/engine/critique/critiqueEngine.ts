import { CanonicalResume } from '../ingestion/types.js';
import {
  CritiqueEngineOutput,
  CritiqueIssue,
  CritiqueRevision,
  ResumeEvidence,
} from './types.js';
import { detectResumeIssues } from './issueDetector.js';
import { extractEvidenceFromText } from './evidenceExtractor.js';
import { validateRevisionFacts } from './factValidator.js';

const STRONG_ACTION_VERBS: Record<string, string> = {
  'responsible for': 'Engineered and deployed',
  'helped with': 'Collaborated on developing',
  'worked on': 'Architected and implemented',
  'assisted in': 'Accelerated development of',
  'handled': 'Spearheaded and maintained',
  'participated in': 'Contributed to designing',
  'involved in': 'Engineered key components for',
  'tasked with': 'Delivered and optimized',
  'supported': 'Maintained and elevated',
  'contributed to': 'Engineered modular solutions for',
};

/**
 * Transforms weak action verbs into decisive active phrasing while strictly
 * preserving original technologies and factual context.
 */
function generateDirectRewrite(sourceText: string, weakMatch?: string): string {
  let rewritten = sourceText.trim();
  if (weakMatch && STRONG_ACTION_VERBS[weakMatch.toLowerCase()]) {
    const replacement = STRONG_ACTION_VERBS[weakMatch.toLowerCase()];
    const regex = new RegExp(`^(?:was\\s+)?${weakMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    rewritten = rewritten.replace(regex, `${replacement} `);
    // Capitalize first letter
    rewritten = rewritten.charAt(0).toUpperCase() + rewritten.slice(1);
  }
  return rewritten;
}

/**
 * Builds an evidence-grounded revision for a detected critique issue.
 */
function buildRevisionForIssue(
  issue: CritiqueIssue,
  evidence: ResumeEvidence,
  resume: CanonicalResume
): CritiqueRevision {
  switch (issue.type) {
    case 'WEAK_ACTION_VERB': {
      // Find weak phrase
      const lower = issue.sourceText.toLowerCase();
      const matchedKey = Object.keys(STRONG_ACTION_VERBS).find((w) =>
        lower.startsWith(w) || lower.includes(`was ${w}`)
      );
      const directRewrite = generateDirectRewrite(issue.sourceText, matchedKey);

      // Validate that direct rewrite didn't invent anything
      const validation = validateRevisionFacts(directRewrite, evidence);
      if (validation.isValid) {
        return {
          issueId: issue.id,
          originalText: issue.sourceText,
          suggestedRevision: directRewrite,
          requiresUserInput: false,
          verifiedFacts: evidence.verifiedFacts,
          unsupportedClaims: [],
          explanation:
            'Replaced passive responsibility phrasing with an active power verb, highlighting direct engineering ownership.',
          recruiterTip:
            'Resume parsers score action-oriented bullet points higher than passive job descriptions.',
          type: 'DIRECT_REWRITE',
        };
      }

      // Fallback to template if validation fails
      return {
        issueId: issue.id,
        originalText: issue.sourceText,
        suggestedRevision: `${directRewrite} resulting in [Quantifiable Impact / Performance Gain].`,
        requiresUserInput: true,
        missingEvidence: ['Quantifiable business outcome or percentage improvement'],
        verifiedFacts: evidence.verifiedFacts,
        unsupportedClaims: [],
        explanation: 'Converted to active voice. Add your specific measurable outcome to maximize score.',
        recruiterTip: 'Bullets pairing strong verbs with metrics achieve the highest interview callback rates.',
        type: 'IMPROVEMENT_TEMPLATE',
      };
    }

    case 'LACKS_METRIC_AND_TECH': {
      const techPart =
        evidence.verifiedTechnologies.length > 0
          ? ` utilizing ${evidence.verifiedTechnologies.join(', ')}`
          : ' utilizing [Target Technologies / Frameworks]';
      const template = `${issue.sourceText.replace(/\.*$/, '')}${techPart}, achieving [Quantifiable Result, e.g. 25% latency reduction or X users supported].`;

      return {
        issueId: issue.id,
        originalText: issue.sourceText,
        suggestedRevision: template,
        requiresUserInput: true,
        missingEvidence: [
          'Specific tech stack utilized (if not already mentioned)',
          'Measurable outcome, scale, or percentage improvement',
        ],
        verifiedFacts: evidence.verifiedFacts,
        unsupportedClaims: [],
        explanation:
          'Structured bullet using the Google X-Y-Z formula (Accomplished [X], measured by [Y], by doing [Z]).',
        recruiterTip:
          'ATS algorithms and senior hiring managers look for evidence of tangible business impact.',
        type: 'IMPROVEMENT_TEMPLATE',
      };
    }

    case 'GENERIC_OBJECTIVE': {
      const candidateTitle = resume.experience[0]?.title || 'Software Engineer';
      const skillsList = resume.skills.technical.slice(0, 4).join(', ') || 'modern full-stack technologies';
      const summaryRewrite = `Results-driven ${candidateTitle} with hands-on expertise in ${skillsList}, specializing in scalable system architecture and production-grade engineering.`;

      return {
        issueId: issue.id,
        originalText: issue.sourceText,
        suggestedRevision: summaryRewrite,
        requiresUserInput: false,
        verifiedFacts: evidence.verifiedFacts,
        unsupportedClaims: [],
        explanation:
          'Replaced generic seeking statement with a definitive professional summary anchored in your actual skills.',
        recruiterTip:
          'Executive recruiters spend under 6 seconds scanning the summary; lead with verified capabilities.',
        type: 'DIRECT_REWRITE',
      };
    }

    case 'UNDERDEVELOPED_BULLET': {
      return {
        issueId: issue.id,
        originalText: issue.sourceText,
        suggestedRevision: `${issue.sourceText.replace(/\.*$/, '')} by implementing [Specific Method / Architecture] to optimize [Target Metric / Reliability].`,
        requiresUserInput: true,
        missingEvidence: ['Technical implementation details', 'Target system optimization'],
        verifiedFacts: evidence.verifiedFacts,
        unsupportedClaims: [],
        explanation: 'Expanded concise bullet to demonstrate technical scope and implementation depth.',
        recruiterTip: 'Concise 15-22 word bullets provide the ideal density for automated screening.',
        type: 'IMPROVEMENT_TEMPLATE',
      };
    }

    case 'MISSING_PROJECT_TECH': {
      return {
        issueId: issue.id,
        originalText: issue.sourceText,
        suggestedRevision: `${issue.sourceText.replace(/\.*$/, '')} (Built with [Language / Framework, Database, Cloud Service]).`,
        requiresUserInput: true,
        missingEvidence: ['Project framework, database, or API technologies'],
        verifiedFacts: evidence.verifiedFacts,
        unsupportedClaims: [],
        explanation: 'Attached technical stack directly to the project description for ATS indexation.',
        recruiterTip: 'Technical recruiters frequently filter project portfolios by specific keywords.',
        type: 'IMPROVEMENT_TEMPLATE',
      };
    }

    case 'LOW_KEYWORD_DENSITY':
    default: {
      const suggestedKeywords = ['TypeScript', 'REST APIs', 'PostgreSQL', 'Docker', 'CI/CD Pipelines'];
      return {
        issueId: issue.id,
        originalText: issue.sourceText,
        suggestedRevision: `${issue.sourceText} | Recommended to add: ${suggestedKeywords.join(', ')} (if proficient)`,
        requiresUserInput: true,
        missingEvidence: ['Additional core frameworks, database systems, or DevOps tools you know'],
        verifiedFacts: evidence.verifiedFacts,
        unsupportedClaims: [],
        explanation: 'Augment skills matrix with standard industry keywords matching your engineering tier.',
        recruiterTip: 'ATS keyword match thresholds typically require at least 8-12 verified core competencies.',
        type: 'IMPROVEMENT_TEMPLATE',
      };
    }
  }
}

/**
 * Main execution function for the Resume Critique Engine.
 */
export async function runCritiqueEngine(resume: CanonicalResume): Promise<CritiqueEngineOutput> {
  const issues = detectResumeIssues(resume);
  const revisions: CritiqueRevision[] = [];
  const evidenceMap: Record<string, ResumeEvidence> = {};

  for (const issue of issues) {
    const ev = extractEvidenceFromText(issue.sourceText, issue.section, resume);
    evidenceMap[issue.id] = ev;
    const revision = buildRevisionForIssue(issue, ev, resume);
    revisions.push(revision);
  }

  const recruiterTips = [
    'Lead every bullet with strong action verbs (Engineered, Architected, Spearheaded) rather than passive duties.',
    'Quantify outcomes where possible (latency reduction, user scale, efficiency improvements) using real metrics.',
    'Keep your technical skills matrix updated with industry-standard terminology for optimal ATS keyword scanning.',
    'Structure experience bullets around the X-Y-Z formula: Accomplished [X], measured by [Y], by doing [Z].',
  ];

  return {
    issues,
    revisions,
    evidenceMap,
    recruiterTips,
  };
}
