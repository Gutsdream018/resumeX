import { Request, Response, NextFunction } from 'express';
import { resumeStorage } from '../../services/resume/resumeStorage.js';
import { runDocumentIngestionPipeline } from '../../engine/ingestion/ingestionPipeline.js';
import { IngestionValidationError } from '../../engine/ingestion/fileValidator.js';
import { processResumePipeline } from '../../services/recommendations/recommendationEngine.js';
import { generateBulletImprovements } from '../../services/recommendations/improvementEngine.js';

export async function uploadResume(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'invalid_file',
        error: 'No resume file uploaded. Please upload a PDF, DOCX, PNG, JPG, or WEBP document.',
        message: 'No resume file uploaded. Please upload a PDF, DOCX, PNG, JPG, or WEBP document.',
        code: 'MISSING_FILE',
      });
    }

    const stored = resumeStorage.saveResume(
      req.file.originalname,
      req.file.mimetype,
      req.file.buffer
    );

    return res.status(201).json({
      resumeId: stored.resumeId,
      filename: stored.filename,
      status: 'uploaded',
    });
  } catch (err) {
    return next(err);
  }
}

export async function analyzeResume(req: Request, res: Response, next: NextFunction) {
  try {
    let fileBuffer: Buffer | null = null;
    let mimetype = 'text/plain';
    let filename = 'resume.txt';
    let resumeId = req.body.resumeId;
    let rawText = req.body.text;
    const jobDescription = req.body.jobDescription || req.body.job_description;

    // Case 1: Direct file upload attached to this request
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimetype = req.file.mimetype;
      filename = req.file.originalname;

      const stored = resumeStorage.saveResume(filename, mimetype, fileBuffer);
      resumeId = stored.resumeId;
    } else if (resumeId) {
      // Case 2: Resume ID from prior upload
      const stored = resumeStorage.getResume(resumeId);
      if (!stored) {
        return res.status(404).json({
          status: 'not_found',
          error: `Resume with ID '${resumeId}' not found or has expired. Please re-upload.`,
          message: `Resume with ID '${resumeId}' not found or has expired. Please re-upload.`,
          code: 'RESUME_NOT_FOUND',
        });
      }
      fileBuffer = stored.buffer;
      mimetype = stored.mimetype;
      filename = stored.filename;
      if (stored.text) rawText = stored.text;
    } else if (rawText && typeof rawText === 'string') {
      // Case 3: Raw text analysis
      const stored = resumeStorage.saveTextResume(rawText);
      resumeId = stored.resumeId;
    } else {
      return res.status(400).json({
        status: 'invalid_input',
        error: 'Please provide a file upload, a valid resumeId, or raw resume text.',
        message: 'Please provide a file upload, a valid resumeId, or raw resume text.',
        code: 'INVALID_INPUT',
      });
    }

    let ingestionResult: any = null;
    if (fileBuffer) {
      try {
        ingestionResult = await runDocumentIngestionPipeline(fileBuffer, filename, mimetype);
        rawText = ingestionResult.rawText;
      } catch (err: any) {
        if (err instanceof IngestionValidationError) {
          return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err.message,
            code: err.status.toUpperCase(),
            details: err.details,
          });
        }
        throw err;
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(422).json({
        status: 'empty_document',
        error: 'The extracted resume text is completely empty. Please verify the document.',
        message: 'The extracted resume text is completely empty. Please verify the document.',
        code: 'EMPTY_TEXT',
      });
    }

    const fileType = filename.split('.').pop()?.toLowerCase();
    const extractionMethod = ingestionResult?.recognition?.extractionMethod || 'native_text';

    const preservedDoc = ingestionResult?.document?.previewDataUrl
      ? {
          mime_type: ingestionResult.document.mimeType,
          original_name: ingestionResult.document.originalName,
          preview_data_url: ingestionResult.document.previewDataUrl,
        }
      : undefined;

    const finalAnalysis = await processResumePipeline(rawText, {
      resumeId,
      fileType,
      extractionMethod,
      preservedDocument: preservedDoc,
      jobDescription,
    });

    resumeStorage.updateResume(resumeId, {
      text: rawText,
      analysis: finalAnalysis,
    });

    console.log(`[Parser] Ingestion & ATS audit: file="${filename}" type="${fileType}" chars=${rawText.length}`);
    console.log(`[Final Result] Completed analysis for resumeId="${resumeId}", score=${finalAnalysis.score.overall}`);

    return res.json({
      ...finalAnalysis,
      status: 'completed',
      success: true,
      resumeId,
      document: ingestionResult?.document || { type: 'TEXT_PDF', pageCount: 1 },
      recognition: ingestionResult?.recognition || { isResume: true, confidence: 0.95 },
      resume: ingestionResult?.resume || null,
      warnings: [...(ingestionResult?.warnings || []), ...(finalAnalysis.warnings || [])],
    });
  } catch (err) {
    return next(err);
  }
}

export async function getResume(req: Request, res: Response, next: NextFunction) {
  try {
    const resumeId = req.params.id;
    const stored = resumeStorage.getResume(resumeId);
    if (!stored) {
      return res.status(404).json({
        error: `Resume with ID '${resumeId}' not found or expired.`,
        code: 'RESUME_NOT_FOUND',
      });
    }

    return res.json({
      status: stored.analysis ? 'completed' : 'uploaded',
      resumeId: stored.resumeId,
      filename: stored.filename,
      mimetype: stored.mimetype,
      analysis: stored.analysis || null,
      createdAt: stored.uploadedAt,
    });
  } catch (err) {
    return next(err);
  }
}

import { applyRevisionToResume } from '../../engine/critique/revisionEngine.js';

export async function improveBullet(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeId, section, text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text field is required for bullet point improvement.',
        code: 'MISSING_TEXT',
      });
    }

    let contextText: string | undefined = undefined;
    if (resumeId) {
      const stored = resumeStorage.getResume(resumeId);
      if (stored && stored.text) {
        contextText = stored.text;
      }
    }

    const result = await generateBulletImprovements(text, section || 'experience', contextText);

    return res.json({
      success: true,
      resumeId: resumeId || null,
      result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function applyRevision(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeId, issueId, originalText, revisionText, canonicalResume: inputCanonical } = req.body;

    if (!issueId || !originalText || !revisionText) {
      return res.status(400).json({
        error: 'issueId, originalText, and revisionText are required to apply a revision.',
        code: 'MISSING_REVISION_PARAMS',
      });
    }

    let canonicalResume: any = inputCanonical;
    let stored: any = null;

    if (resumeId) {
      stored = resumeStorage.getResume(resumeId);
      if (stored?.analysis?.canonicalResume && !canonicalResume) {
        canonicalResume = stored.analysis.canonicalResume;
      }
    }

    if (!canonicalResume) {
      return res.status(400).json({
        error: 'Canonical resume representation is required or resumeId must point to an analyzed resume.',
        code: 'CANONICAL_RESUME_MISSING',
      });
    }

    const deltaResult = applyRevisionToResume(
      canonicalResume,
      issueId,
      originalText,
      revisionText
    );

    // If we have stored analysis, update the stored text and canonical resume
    if (stored && stored.analysis) {
      stored.analysis.canonicalResume = deltaResult.updatedResume;
      stored.analysis.score.overall = deltaResult.afterScore;
      stored.analysis.overall_score = deltaResult.afterScore;
      resumeStorage.updateResume(resumeId, {
        analysis: stored.analysis,
      });
    }

    return res.json({
      success: true,
      resumeId: resumeId || null,
      deltaResult,
    });
  } catch (err) {
    return next(err);
  }
}

