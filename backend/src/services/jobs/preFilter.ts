import { Job, ResumeProfile, JobPreferences } from './types.js';
import {
  normalizeSeniorityLevel,
  inferJobSeniority,
  evaluateSeniorityMatch,
} from './seniority.js';

export interface PreFilteredJob {
  job: Job;
  heuristicScore: number;
}

/**
 * Fast, cheap pre-filter ranking raw jobs by title similarity, keyword overlap,
 * location, and recency to select the top ~20 candidates before running the full match engine.
 * Applies strict Seniority Filtering (excludes >1 level above, demotes 1 level above).
 */
export function preFilterJobs(
  jobs: Job[],
  profile: ResumeProfile,
  preferences: JobPreferences,
  limit: number = 20
): Job[] {
  if (!jobs || jobs.length === 0) return [];

  const candidateSeniority = normalizeSeniorityLevel(
    profile.seniority,
    profile.yearsExperience,
    profile.titles
  );

  const targetTitles = [
    preferences.targetRole,
    ...(preferences.adjacentRoles || []),
    ...(profile.titles || []),
  ].map((t) => (t || '').toLowerCase().trim()).filter(Boolean);

  const candidateSkills = new Set(
    (profile.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean)
  );

  const desiredLocation = (preferences.location || profile.location || '').toLowerCase().trim();
  const workplace = preferences.workplaceType || 'any';

  const now = Date.now();

  const scored: PreFilteredJob[] = [];

  for (const job of jobs) {
    // 0. Seniority Gate (Exclude >1 level above)
    const jobSeniority = inferJobSeniority(job.title, job.description);
    const seniorityEval = evaluateSeniorityMatch(candidateSeniority, jobSeniority);

    if (!seniorityEval.allow) {
      // Exclude job completely
      continue;
    }

    let score = 0;
    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase();

    // 1. Title Similarity (35 pts max)
    let titleMatchPts = 0;
    for (const target of targetTitles) {
      if (titleLower === target) {
        titleMatchPts = 35;
        break;
      }
      if (titleLower.includes(target) || target.includes(titleLower)) {
        titleMatchPts = Math.max(titleMatchPts, 30);
      } else {
        // Token overlap
        const targetTokens = target.split(/\s+/).filter((t) => t.length > 2);
        const matchedTokens = targetTokens.filter((tok) => titleLower.includes(tok));
        if (targetTokens.length > 0) {
          const ratio = (matchedTokens.length / targetTokens.length) * 25;
          titleMatchPts = Math.max(titleMatchPts, ratio);
        }
      }
    }
    score += titleMatchPts;

    // 2. Skill & Keyword Overlap in Job Description (35 pts max)
    if (candidateSkills.size > 0) {
      let matchedCount = 0;
      for (const skill of candidateSkills) {
        // Word boundary match
        const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');
        if (regex.test(descLower) || regex.test(titleLower)) {
          matchedCount++;
        }
      }
      const skillRatio = Math.min(1, matchedCount / Math.min(candidateSkills.size, 8));
      score += skillRatio * 35;
    } else {
      score += 15; // neutral baseline
    }

    // 3. Location / Remote Preference (15 pts max)
    let locPts = 0;
    if (workplace === 'remote' && job.isRemote) {
      locPts = 15;
    } else if (workplace === 'remote' && !job.isRemote) {
      locPts = 0;
    } else if (job.isRemote) {
      locPts = 15;
    } else if (desiredLocation && (job.location.toLowerCase().includes(desiredLocation) || desiredLocation.includes(job.location.toLowerCase()))) {
      locPts = 15;
    } else {
      locPts = 7;
    }
    score += locPts;

    // 4. Recency (15 pts max)
    let recencyPts = 15;
    if (job.postedAt) {
      const postedTime = new Date(job.postedAt).getTime();
      const daysOld = Math.max(0, (now - postedTime) / (1000 * 60 * 60 * 24));
      if (daysOld <= 3) recencyPts = 15;
      else if (daysOld <= 7) recencyPts = 12;
      else if (daysOld <= 14) recencyPts = 9;
      else if (daysOld <= 30) recencyPts = 6;
      else recencyPts = 2;
    }
    score += recencyPts;

    // 5. Seniority demote penalty if 1 level above (+1 tier)
    if (seniorityEval.demotePenalty > 0) {
      score = Math.max(0, score - seniorityEval.demotePenalty);
    }

    scored.push({ job, heuristicScore: Math.round(score) });
  }

  // Sort descending by heuristic score and take top limit
  scored.sort((a, b) => b.heuristicScore - a.heuristicScore);
  return scored.slice(0, limit).map((s) => s.job);
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
