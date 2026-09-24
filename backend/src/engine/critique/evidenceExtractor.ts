import { CanonicalResume } from '../ingestion/types.js';
import { ResumeEvidence } from './types.js';

const TECH_KEYWORDS = [
  'javascript',
  'typescript',
  'python',
  'react',
  'next.js',
  'node.js',
  'express',
  'go',
  'golang',
  'rust',
  'java',
  'c++',
  'c#',
  'sql',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'docker',
  'kubernetes',
  'aws',
  'gcp',
  'azure',
  'terraform',
  'git',
  'github',
  'ci/cd',
  'rest api',
  'restful',
  'graphql',
  'microservices',
  'linux',
];

/**
 * Extracts verifiable factual tokens (technologies, numbers, percentages, dates, outcomes)
 * directly from source text and the Canonical Resume JSON.
 */
export function extractEvidenceFromText(
  sourceText: string,
  section: string,
  resume?: CanonicalResume
): ResumeEvidence {
  if (!sourceText) {
    return {
      sourceText: '',
      section,
      verifiedFacts: [],
      verifiedMetrics: [],
      verifiedTechnologies: [],
      verifiedOutcomes: [],
      unsupportedClaims: [],
    };
  }

  const lowerText = sourceText.toLowerCase();

  // 1. Extract verified technologies
  const verifiedTechnologies: string[] = [];
  for (const tech of TECH_KEYWORDS) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');
    if (regex.test(lowerText)) {
      verifiedTechnologies.push(tech.toUpperCase());
    }
  }

  // 2. Extract verified explicit metrics (%, $, scale, numbers with units)
  const metricRegex =
    /(?:\b\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?(?:\s*[kKmMbB])?|\b\d+(?:,\d+)*(?:\s*(?:users|qps|rps|ms|seconds|minutes|hours|days|engineers|services|endpoints|repos|projects))\b|\b\d+\s*(?:k|M|B)\b)/gi;
  const metricsMatches = Array.from(sourceText.matchAll(metricRegex));
  const verifiedMetrics = metricsMatches.map((m) => m[0].trim());

  // 3. Extract verified facts (e.g. role title, company name from resume if matching)
  const verifiedFacts: string[] = [...verifiedTechnologies, ...verifiedMetrics];
  if (resume) {
    if (resume.contact.name && sourceText.includes(resume.contact.name)) {
      verifiedFacts.push(resume.contact.name);
    }
    for (const exp of resume.experience) {
      if (exp.company && sourceText.toLowerCase().includes(exp.company.toLowerCase())) {
        verifiedFacts.push(exp.company);
      }
      if (exp.title && sourceText.toLowerCase().includes(exp.title.toLowerCase())) {
        verifiedFacts.push(exp.title);
      }
    }
  }

  // 4. Extract verified outcomes (clauses starting with resulting in, reduced, increased, etc.)
  const verifiedOutcomes: string[] = [];
  const outcomeMatch = sourceText.match(
    /(?:resulting in|reduced|increasing|cutting|improving|saving|delivering)\s+[^,.]+/gi
  );
  if (outcomeMatch) {
    verifiedOutcomes.push(...outcomeMatch.map((o) => o.trim()));
  }

  return {
    sourceText,
    section,
    verifiedFacts: Array.from(new Set(verifiedFacts)),
    verifiedMetrics: Array.from(new Set(verifiedMetrics)),
    verifiedTechnologies: Array.from(new Set(verifiedTechnologies)),
    verifiedOutcomes: Array.from(new Set(verifiedOutcomes)),
    unsupportedClaims: [],
  };
}
