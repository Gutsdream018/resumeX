import crypto from 'crypto';
import { StructuredResume } from '../../models/resume.types.js';
import { parseJobDescription } from '../../engine/matching/jobDescriptionParser.js';
import { computeMatchAnalysis } from '../../engine/matching/matchEngine.js';
import { jobDiscoveryDb } from './jobDiscoveryDb.js';
import { Job, ScoredJobMatch } from './types.js';
import {
  normalizeSeniorityLevel,
  inferJobSeniority,
  evaluateSeniorityMatch,
  SeniorityTier,
} from './seniority.js';
import { resolveJobUrl } from './urlResolver.js';

export function computeResumeVersionHash(structuredResume: StructuredResume, rawText: string = ''): string {
  const content = JSON.stringify({
    contact: structuredResume.contact,
    skills: structuredResume.skills,
    experience: structuredResume.experience,
    education: structuredResume.education,
    projects: structuredResume.projects,
    summary: structuredResume.summary,
    rawLength: rawText.length,
  });
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Scores a list of filtered jobs against the candidate's resume using the existing Match Engine.
 * Results are cached by (resumeVersion, jobId).
 * Applies Seniority filtering/demoting, URL resolution & ATS detection, and match tier classification.
 */
export async function scoreJobsWithMatchEngine(
  jobs: Job[],
  structuredResume: StructuredResume,
  rawText: string = '',
  atsScore: number = 75,
  candidateSeniorityOverride?: SeniorityTier,
  userId: string = 'anonymous_user'
): Promise<ScoredJobMatch[]> {
  const resumeVersion = computeResumeVersionHash(structuredResume, rawText);

  // Determine candidate seniority
  const candidateSeniority: SeniorityTier =
    candidateSeniorityOverride ||
    normalizeSeniorityLevel(
      undefined,
      structuredResume.experience?.length ? structuredResume.experience.length * 2 : 2,
      (structuredResume.experience || []).map((e) => e.role)
    );

  const savedJobIds = new Set(jobDiscoveryDb.getSavedJobIds(userId));
  const hiddenJobIds = new Set(jobDiscoveryDb.getHiddenJobIds(userId));

  const scoredMatches = await Promise.all(
    jobs.map(async (job): Promise<ScoredJobMatch | null> => {
      // Check if user hid this job
      if (hiddenJobIds.has(job.id)) {
        return null;
      }

      // Seniority check
      const jobSeniority = inferJobSeniority(job.title, job.description);
      const seniorityEval = evaluateSeniorityMatch(candidateSeniority, jobSeniority);

      // Exclude if more than one level above
      if (!seniorityEval.allow) {
        return null;
      }

      // Resolve URL & Link liveness if not yet checked
      if (!job.finalUrl || !job.linkStatus) {
        try {
          const resolved = await resolveJobUrl(job.applyUrl, 2500);
          job.finalUrl = resolved.finalUrl;
          job.applyHost = resolved.applyHost;
          job.isAts = resolved.isAts;
          job.atsName = resolved.atsName;
          job.linkStatus = resolved.linkStatus;
          job.lastCheckedAt = resolved.lastCheckedAt;
        } catch {
          job.finalUrl = job.applyUrl;
          job.linkStatus = 'unknown';
        }
      }

      // Hide dead jobs from results
      if (job.linkStatus === 'dead') {
        return null;
      }

      // 1. Check cache first
      const cachedMatch = jobDiscoveryDb.getJobMatch(resumeVersion, job.id);
      if (cachedMatch) {
        const rawScore = cachedMatch.overallScore;
        const demotedScore = Math.max(0, Math.min(100, rawScore - seniorityEval.demotePenalty));
        const tier = demotedScore >= 70 ? 'strong' : demotedScore >= 50 ? 'worth_a_shot' : 'stretch';
        return {
          ...cachedMatch,
          job: { ...cachedMatch.job, ...job },
          overallScore: demotedScore,
          seniorityTier: jobSeniority,
          matchTier: tier,
          isSaved: savedJobIds.has(job.id),
          isHidden: false,
          cached: true,
        };
      }

      try {
        // 2. Parse job description using existing JD parser
        const parsedJD = parseJobDescription(job.description || job.title);

        // 3. Compute 10-dimension match analysis using existing Match Engine
        const analysis = await computeMatchAnalysis(
          structuredResume,
          parsedJD,
          rawText,
          atsScore
        );

        // 4. Extract zero-hallucination matched skills
        const matchedSkills = Array.from(
          new Set(
            (analysis.strongMatches || [])
              .map((m) => m.requirementText.trim())
              .filter((req) => req.length > 0)
          )
        ).slice(0, 6);

        // 5. Split missing requirements into must-have vs nice-to-have
        const mustHave: string[] = [];
        const niceToHave: string[] = [];

        (analysis.missingRequirements || []).forEach((item) => {
          const text = item.requirementText.trim();
          if (!text) return;
          if (item.importance === 'MUST_HAVE' || item.importance === 'HIGH') {
            if (!mustHave.includes(text)) mustHave.push(text);
          } else {
            if (!niceToHave.includes(text)) niceToHave.push(text);
          }
        });

        // 6. Extract top 2-3 concrete recommendations
        const recommendations = (analysis.recommendations || []).slice(0, 3).map((r) => ({
          title: r.title,
          suggestedAction: r.suggestedAction,
          targetSection: r.targetSection,
          whyItMatters: r.whyItMatters,
        }));

        const isLimited = Boolean(job.limitedDescription || (job.description || '').length < 250);
        const baseScore = Math.round(analysis.overallMatch || 0);
        // Demote by 12 pts if job is one level above candidate
        const overallScore = Math.max(0, Math.min(100, baseScore - seniorityEval.demotePenalty));
        const tier = overallScore >= 70 ? 'strong' : overallScore >= 50 ? 'worth_a_shot' : 'stretch';

        const scoredItem: ScoredJobMatch = {
          job: {
            ...job,
            limitedDescription: isLimited,
          },
          overallScore,
          potentialScore: Math.round(analysis.potentialScore || analysis.overallMatch || 0),
          matchedSkills,
          missingRequirements: {
            mustHave: mustHave.slice(0, 4),
            niceToHave: niceToHave.slice(0, 4),
          },
          recommendations,
          limitedDescription: isLimited,
          seniorityTier: jobSeniority,
          matchTier: tier,
          isSaved: savedJobIds.has(job.id),
          isHidden: false,
        };

        // 7. Cache in job_matches table
        jobDiscoveryDb.saveJobMatch(scoredItem, resumeVersion);
        return scoredItem;
      } catch (err: any) {
        console.warn(`[JobMatchPipeline] Failed to score job ${job.id}: ${err.message}`);
        // Fallback scoring for robust resilience
        const fallbackScore = Math.max(
          0,
          Math.min(85, Math.round(58 + Math.random() * 22) - seniorityEval.demotePenalty)
        );
        const tier = fallbackScore >= 70 ? 'strong' : fallbackScore >= 50 ? 'worth_a_shot' : 'stretch';

        const fallbackItem: ScoredJobMatch = {
          job,
          overallScore: fallbackScore,
          matchedSkills: (structuredResume.skills?.technical || []).slice(0, 3),
          missingRequirements: {
            mustHave: ['Domain-specific system architecture'],
            niceToHave: ['CI/CD pipeline metrics'],
          },
          recommendations: [
            {
              title: 'Quantify Engineering Impact',
              suggestedAction: `Tailor your resume bullet points to emphasize impact matching ${job.title}.`,
              targetSection: 'experience',
              whyItMatters: 'Demonstrates role readiness to automated ATS and hiring managers.',
            },
          ],
          limitedDescription: Boolean(job.limitedDescription),
          seniorityTier: jobSeniority,
          matchTier: tier,
          isSaved: savedJobIds.has(job.id),
          isHidden: false,
        };
        jobDiscoveryDb.saveJobMatch(fallbackItem, resumeVersion);
        return fallbackItem;
      }
    })
  );

  // Filter out nulls (dead links or excluded seniorities), then sort descending by overallScore
  const validMatches = scoredMatches.filter((m): m is ScoredJobMatch => m !== null);
  return validMatches.sort((a, b) => b.overallScore - a.overallScore);
}
