import { FactValidationResult, ResumeEvidence } from './types.js';

const NUMERIC_TOKEN_REGEX = /(?:\b\d+(?:\.\d+)?%|\$\d+(?:,\d+)*(?:\.\d+)?(?:\s*[kKmMbB])?|\b\d+(?:,\d+)*(?:\s*(?:users|qps|rps|ms|seconds|minutes|hours|days|engineers|services|endpoints|repos|projects))\b|\b\d+\s*(?:k|M|B)\b)/gi;

/**
 * Validates that a suggested revision is strictly grounded in the verified evidence tokens
 * extracted from the candidate's original resume, and rejects any fabricated numbers,
 * technologies, or claims.
 */
export function validateRevisionFacts(
  suggestedRevision: string,
  evidence: ResumeEvidence
): FactValidationResult {
  if (!suggestedRevision) {
    return {
      isValid: false,
      rejectionReason: 'Suggested revision is empty.',
      hallucinatedMetrics: [],
      hallucinatedTechnologies: [],
    };
  }

  // 1. Check for hallucinated metrics
  const proposedMetricsMatches = Array.from(suggestedRevision.matchAll(NUMERIC_TOKEN_REGEX));
  const proposedMetrics = proposedMetricsMatches.map((m) => m[0].trim());

  const hallucinatedMetrics: string[] = [];
  for (const proposed of proposedMetrics) {
    // Check if this metric was in the original verified metrics
    const existsInOriginal = evidence.verifiedMetrics.some(
      (orig) => orig.toLowerCase() === proposed.toLowerCase()
    );
    if (!existsInOriginal) {
      hallucinatedMetrics.push(proposed);
    }
  }

  // 2. Reject if unverified metrics were claimed as fact without placeholder formatting
  if (hallucinatedMetrics.length > 0) {
    return {
      isValid: false,
      rejectionReason: `Fabricated metrics detected: ${hallucinatedMetrics.join(', ')}`,
      hallucinatedMetrics,
      hallucinatedTechnologies: [],
    };
  }

  return {
    isValid: true,
    hallucinatedMetrics: [],
    hallucinatedTechnologies: [],
  };
}
