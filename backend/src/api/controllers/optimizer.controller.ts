import { Request, Response, NextFunction } from 'express';
import { resumeStorage } from '../../services/resume/resumeStorage.js';
import { rescoreOptimizedResume } from '../../engine/optimizer/optimizerEngine.js';
import { generateFactGuidedRewrite } from '../../engine/optimizer/factGuidedRewriter.js';
import { detectMissingInformation } from '../../engine/optimizer/missingInfoEngine.js';

export async function rescoreResume(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeId, canonicalResume, baselineScore } = req.body;

    let resumeToScore = canonicalResume;

    if (!resumeToScore && resumeId) {
      const stored = resumeStorage.getResume(resumeId);
      if (stored?.analysis?.canonicalResume) {
        resumeToScore = stored.analysis.canonicalResume;
      }
    }

    if (!resumeToScore) {
      return res.status(400).json({
        error: 'A canonicalResume object or valid resumeId is required for re-scoring.',
        code: 'MISSING_RESUME_DATA',
      });
    }

    const result = await rescoreOptimizedResume(resumeToScore, baselineScore || 54);

    // If we have a stored resume, update stored analysis
    if (resumeId) {
      const stored = resumeStorage.getResume(resumeId);
      if (stored && stored.analysis) {
        stored.analysis.canonicalResume = result.updatedResume;
        stored.analysis.score.overall = result.overallScore;
        stored.analysis.overall_score = result.overallScore;
        resumeStorage.updateResume(resumeId, { analysis: stored.analysis });
      }
    }

    return res.json({
      success: true,
      result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function factGuidedRewrite(req: Request, res: Response, next: NextFunction) {
  try {
    const { originalText, section, roleOrContext, userFacts, targetTone } = req.body;

    if (!originalText || typeof originalText !== 'string' || originalText.trim().length === 0) {
      return res.status(400).json({
        error: 'originalText is required for fact-guided rewrite.',
        code: 'MISSING_ORIGINAL_TEXT',
      });
    }

    const rewriteResult = generateFactGuidedRewrite({
      originalText,
      section: section || 'experience',
      roleOrContext,
      userFacts: userFacts || {},
      targetTone,
    });

    return res.json({
      success: true,
      result: rewriteResult,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getMissingInfoPrompt(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceText, section, bulletId } = req.body;

    if (!sourceText || typeof sourceText !== 'string') {
      return res.status(400).json({
        error: 'sourceText is required to analyze missing information.',
        code: 'MISSING_SOURCE_TEXT',
      });
    }

    const prompt = detectMissingInformation(sourceText, section || 'experience', bulletId);

    return res.json({
      success: true,
      prompt,
    });
  } catch (err) {
    return next(err);
  }
}
