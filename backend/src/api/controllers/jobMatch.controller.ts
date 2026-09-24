import { Request, Response, NextFunction } from 'express';
import { resumeStorage } from '../../services/resume/resumeStorage.js';
import { parseJobDescription } from '../../engine/matching/jobDescriptionParser.js';
import { computeMatchAnalysis } from '../../engine/matching/matchEngine.js';
import { parseStructuredResume } from '../../services/parser/sectionParser.js';
import { StructuredResume } from '../../models/resume.types.js';

export async function matchJobDescription(req: Request, res: Response, next: NextFunction) {
  try {
    const resumeId = req.body.resumeId;
    let resumeText = req.body.resumeText || req.body.resume_text;
    const jobDescription = req.body.jobDescription || req.body.job_description;
    const clientStructuredResume = req.body.structuredResume;
    const atsScore = typeof req.body.atsScore === 'number' ? req.body.atsScore : 75;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: 'Please provide a valid target job description (at least 20 characters).',
        code: 'INVALID_JOB_DESCRIPTION',
      });
    }

    if (!resumeText && resumeId) {
      const stored = resumeStorage.getResume(resumeId);
      if (stored && stored.text) {
        resumeText = stored.text;
      }
    }

    let structuredResume: StructuredResume;
    if (clientStructuredResume && typeof clientStructuredResume === 'object') {
      structuredResume = clientStructuredResume;
    } else if (resumeText && typeof resumeText === 'string') {
      structuredResume = parseStructuredResume(resumeText);
    } else {
      return res.status(400).json({
        error: 'Please provide valid resume text or structured resume data.',
        code: 'MISSING_RESUME',
      });
    }

    // 1. Parse Job Description into structured JobDescriptionJSON
    const parsedJD = parseJobDescription(jobDescription);

    // 2. Compute 10-dimension match analysis with evidence and weights
    const matchAnalysis = await computeMatchAnalysis(structuredResume, parsedJD, resumeText || '', atsScore);

    return res.json({
      success: true,
      jobDescription: parsedJD,
      matchAnalysis,
      // Backwards-compatible fields for any legacy consumer
      matchScore: matchAnalysis.overallMatch,
      matchedSkills: matchAnalysis.strongMatches.map((m) => m.requirementText),
      missingSkills: matchAnalysis.missingRequirements.map((m) => m.requirementText),
      missingKeywords: matchAnalysis.keywordGapAnalysis.missing,
      recommendations: matchAnalysis.recommendations.map((r) => r.suggestedAction),
      breakdown: {
        skillMatch: matchAnalysis.breakdown.skills,
        experienceRelevance: matchAnalysis.breakdown.experience,
        keywordMatch: matchAnalysis.breakdown.keywords,
        educationRelevance: matchAnalysis.breakdown.education,
      },
      result: matchAnalysis,
    });
  } catch (err) {
    return next(err);
  }
}

export async function parseJobDescriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const jobDescription = req.body.jobDescription || req.body.job_description || req.body.text;
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: 'Please provide job description text (at least 20 characters).',
        code: 'INVALID_JOB_DESCRIPTION',
      });
    }

    const parsed = parseJobDescription(jobDescription);
    return res.json({
      success: true,
      jobDescription: parsed,
    });
  } catch (err) {
    return next(err);
  }
}
