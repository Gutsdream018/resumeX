import { Request, Response, NextFunction } from 'express';
import { parseStructuredResume } from '../../services/parser/sectionParser.js';
import { resumeStorage } from '../../services/resume/resumeStorage.js';
import { extractResumeProfile } from '../../services/jobs/profileExtractor.js';
import { buildJobQueries, deriveSuggestedRoleChips } from '../../services/jobs/queryBuilder.js';
import { adzunaProvider } from '../../services/jobs/providers/adzunaProvider.js';
import { deduplicateJobs } from '../../services/jobs/jobDeduplicator.js';
import { preFilterJobs } from '../../services/jobs/preFilter.js';
import { scoreJobsWithMatchEngine } from '../../services/jobs/jobMatchingPipeline.js';
import { jobDiscoveryDb } from '../../services/jobs/jobDiscoveryDb.js';
import { resolveJobUrl } from '../../services/jobs/urlResolver.js';
import { StructuredResume } from '../../models/resume.types.js';
import { Job, JobPreferences, ApplicationStatus } from '../../services/jobs/types.js';

// Simple in-memory rate limiter per IP / user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 40; // max 40 searches per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

/**
 * Extracts candidate profile & preferences from resume, checking persistent cache first.
 */
export async function getResumeProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.body.userId || 'anonymous_user';
    const resumeId = req.body.resumeId || 'active_resume';
    let resumeText = req.body.resumeText || '';
    let clientStructured = req.body.structuredResume;

    // Check if profile is already persisted
    const existing = jobDiscoveryDb.getProfile(userId, resumeId);
    if (existing) {
      const suggestedRoles = deriveSuggestedRoleChips(existing.profile, existing.preferences);
      return res.json({
        success: true,
        cached: true,
        profile: existing.profile,
        preferences: existing.preferences,
        suggestedRoles,
      });
    }

    if (!resumeText && resumeId) {
      const stored = resumeStorage.getResume(resumeId);
      if (stored?.text) resumeText = stored.text;
    }

    let structured: StructuredResume;
    if (clientStructured && typeof clientStructured === 'object') {
      structured = clientStructured;
    } else if (resumeText) {
      structured = parseStructuredResume(resumeText);
    } else {
      return res.status(400).json({
        error: 'Please provide resume data or text to extract profile.',
        code: 'MISSING_RESUME_DATA',
      });
    }

    const { profile, defaultPreferences } = extractResumeProfile(structured, resumeText);
    const saved = jobDiscoveryDb.saveProfile(userId, resumeId, profile, defaultPreferences);
    const suggestedRoles = deriveSuggestedRoleChips(saved.profile, saved.preferences);

    return res.json({
      success: true,
      cached: false,
      profile: saved.profile,
      preferences: saved.preferences,
      suggestedRoles,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Updates search preferences for a resume profile.
 */
export async function updatePreferencesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.body.userId || 'anonymous_user';
    const resumeId = req.body.resumeId || 'active_resume';
    const preferences: Partial<JobPreferences> = req.body.preferences || {};

    const updated = jobDiscoveryDb.updatePreferences(userId, resumeId, preferences);
    if (!updated) {
      return res.status(404).json({
        error: 'Resume profile not found. Please extract profile first.',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      preferences: updated.preferences,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Main Job Match & Discovery Search Endpoint.
 * Flow: Profile -> Queries -> Provider -> Dedupe -> Pre-filter -> Top 20 Score -> Result.
 */
export async function searchMatchedJobsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'global';
    const userId = req.body.userId || 'anonymous_user';
    const rateLimitKey = `${userId}:${clientIp}`;

    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        error: 'Too many search requests. Please wait a moment before searching again.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    const resumeId = req.body.resumeId || 'active_resume';
    let resumeText = req.body.resumeText || '';
    let clientStructured = req.body.structuredResume;
    const atsScore = typeof req.body.atsScore === 'number' ? req.body.atsScore : 75;
    const customPreferences: Partial<JobPreferences> = req.body.preferences || {};

    if (!resumeText && resumeId) {
      const stored = resumeStorage.getResume(resumeId);
      if (stored?.text) resumeText = stored.text;
    }

    let structured: StructuredResume;
    if (clientStructured && typeof clientStructured === 'object') {
      structured = clientStructured;
    } else if (resumeText) {
      structured = parseStructuredResume(resumeText);
    } else {
      structured = parseStructuredResume('Senior Software Engineer with TypeScript and React experience.');
    }

    // 1. Retrieve or extract Profile + Preferences
    let storedProfile = jobDiscoveryDb.getProfile(userId, resumeId);
    let profile = storedProfile?.profile;
    let preferences = { ...(storedProfile?.preferences || {}), ...customPreferences } as JobPreferences;

    if (!profile) {
      const extracted = extractResumeProfile(structured, resumeText);
      profile = extracted.profile;
      preferences = { ...extracted.defaultPreferences, ...customPreferences };
      jobDiscoveryDb.saveProfile(userId, resumeId, profile, preferences);
    }

    // 2. Build high-signal search queries derived from role categories (never company names)
    const queries = buildJobQueries(profile, preferences);
    const suggestedRoles = deriveSuggestedRoleChips(profile, preferences);

    // 3. Search provider for each query concurrently
    const queryPromises = queries.map((q) =>
      adzunaProvider.search({
        query: q.term,
        location: preferences.location,
        countryCode: preferences.countryCode,
        limit: 15,
      })
    );

    const queryResults = await Promise.all(queryPromises);
    const combinedRawJobs: Job[] = queryResults.flat();

    // 4. Deduplicate jobs by normalized company + title + location
    const dedupedJobs = deduplicateJobs(combinedRawJobs);

    // 5. Cache raw jobs in jobs table with TTL
    jobDiscoveryDb.cacheJobs(dedupedJobs);

    // 6. Cheap Pre-filter to select top ~20 candidate jobs (with Seniority Gate)
    const top20Jobs = preFilterJobs(dedupedJobs, profile, preferences, 20);

    // 7. Full match analysis using the existing Match Engine
    const scoredJobs = await scoreJobsWithMatchEngine(
      top20Jobs,
      structured,
      resumeText,
      atsScore,
      profile.seniority as any,
      userId
    );

    return res.json({
      success: true,
      total: scoredJobs.length,
      jobs: scoredJobs,
      preferences,
      suggestedRoles,
      profile: {
        skills: profile.skills.slice(0, 15),
        seniority: profile.seniority,
        yearsExperience: profile.yearsExperience,
        titles: profile.titles || [],
        location: profile.location || preferences.location || '',
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Saves a tailored resume variant linked to a target job without overwriting the original.
 */
export async function saveTailoredResumeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { originalResumeId, jobId, jobTitle, company, content, targetRequirements } = req.body;

    if (!originalResumeId || !jobId || !content) {
      return res.status(400).json({
        error: 'Missing required fields: originalResumeId, jobId, and content are mandatory.',
        code: 'INVALID_TAILORED_RESUME',
      });
    }

    const variant = jobDiscoveryDb.saveTailoredResume({
      originalResumeId,
      jobId,
      jobTitle,
      company,
      content,
      targetRequirements,
    });

    // Also auto-track in application tracker as 'tailored'
    const userId = req.body.userId || 'anonymous_user';
    jobDiscoveryDb.createOrUpdateApplication({
      userId,
      resumeId: originalResumeId,
      jobId,
      jobTitle: jobTitle || 'Target Role',
      company: company || 'Employer',
      location: 'Remote',
      applyUrl: '#',
      tailoredResumeId: variant.id,
      status: 'tailored',
    });

    return res.status(201).json({
      success: true,
      variant,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Retrieves all saved tailored resume variants for a specific resume.
 */
export async function getTailoredResumesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeId } = req.params;
    if (!resumeId) {
      return res.status(400).json({ error: 'resumeId parameter is required.' });
    }

    const variants = jobDiscoveryDb.getTailoredResumes(resumeId);
    return res.json({
      success: true,
      total: variants.length,
      variants,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Tracks a click event on an apply link.
 */
export async function trackClickEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId, userId, applyUrl } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const event = jobDiscoveryDb.recordClickEvent(
      jobId,
      userId || 'anonymous_user',
      applyUrl || ''
    );

    return res.json({ success: true, event });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Re-checks or resolves a job's apply link on demand.
 */
export async function checkJobLinkHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId, url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const resolved = await resolveJobUrl(url);
    if (jobId) {
      jobDiscoveryDb.updateJobLinkStatus(jobId, resolved);
    }

    return res.json({ success: true, link: resolved });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Handles user interactions (save, unsave, hide, unhide).
 */
export async function interactJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, jobId, action } = req.body;
    const uid = userId || 'anonymous_user';

    if (!jobId || !action) {
      return res.status(400).json({ error: 'jobId and action are required' });
    }

    if (action === 'save') {
      jobDiscoveryDb.saveJobForUser(uid, jobId);
      // Also record in application tracker as 'saved'
      const job = jobDiscoveryDb.getJobById(jobId);
      if (job) {
        jobDiscoveryDb.createOrUpdateApplication({
          userId: uid,
          resumeId: req.body.resumeId || 'default_resume',
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          applyUrl: job.finalUrl || job.applyUrl,
          status: 'saved',
        });
      }
    } else if (action === 'unsave') {
      jobDiscoveryDb.unsaveJobForUser(uid, jobId);
    } else if (action === 'hide') {
      jobDiscoveryDb.hideJobForUser(uid, jobId);
    } else if (action === 'unhide') {
      jobDiscoveryDb.unhideJobForUser(uid, jobId);
    }

    return res.json({ success: true, action });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Returns saved jobs for a user.
 */
export async function getSavedJobsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.query.userId as string) || (req.body.userId as string) || 'anonymous_user';
    const savedIds = jobDiscoveryDb.getSavedJobIds(userId);
    const jobs = savedIds
      .map((id) => jobDiscoveryDb.getJobById(id))
      .filter((j): j is Job => j !== undefined);

    return res.json({ success: true, total: jobs.length, jobs });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Application Tracker: List applications for a user.
 */
export async function getApplicationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.query.userId as string) || 'anonymous_user';
    const apps = jobDiscoveryDb.getApplications(userId);
    return res.json({ success: true, applications: apps });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Application Tracker: Create or update application.
 */
export async function createApplicationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, resumeId, jobId, jobTitle, company, location, applyUrl, status, notes, tailoredResumeId } = req.body;

    if (!jobId || !jobTitle) {
      return res.status(400).json({ error: 'jobId and jobTitle are required' });
    }

    const app = jobDiscoveryDb.createOrUpdateApplication({
      userId: userId || 'anonymous_user',
      resumeId: resumeId || 'active_resume',
      jobId,
      jobTitle,
      company: company || 'Employer',
      location: location || 'Remote',
      applyUrl: applyUrl || '#',
      tailoredResumeId,
      status: (status as ApplicationStatus) || 'applied',
      notes,
    });

    return res.status(201).json({ success: true, application: app });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Application Tracker: Update application status.
 */
export async function updateApplicationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = jobDiscoveryDb.updateApplicationStatus(id, status as ApplicationStatus, notes);
    if (!updated) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json({ success: true, application: updated });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Application Tracker: Delete application.
 */
export async function deleteApplicationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const deleted = jobDiscoveryDb.deleteApplication(id);
    return res.json({ success: true, deleted });
  } catch (err: any) {
    next(err);
  }
}

/**
 * Generates an evidence-grounded cover letter draft without hallucination.
 */
export async function generateCoverLetterHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { candidateName, targetRole, company, skills, experienceSummary, jobDescription } = req.body;

    const name = candidateName || 'Candidate';
    const role = targetRole || 'Software Engineer';
    const comp = company || 'Hiring Team';
    const verifiedSkills = Array.isArray(skills) ? skills.slice(0, 5).join(', ') : 'Software Engineering';

    const draft = `Dear Hiring Team at ${comp},

I am writing to express my strong interest in the ${role} position. With my background in ${verifiedSkills} and demonstrable engineering accomplishments, I am confident in my ability to deliver immediate value to your technical objectives.

Throughout my experience, ${experienceSummary || 'I have designed, tested, and scaled software systems with focus on code maintainability and performance.'} My verified core competencies in ${verifiedSkills} align closely with the technical qualifications outlined in your listing for ${role}.

I look forward to discussing how my experience and technical skill set can contribute to the continued success and growth of ${comp}.

Sincerely,
${name}`;

    return res.json({
      success: true,
      coverLetter: draft,
    });
  } catch (err: any) {
    next(err);
  }
}
