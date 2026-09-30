import { Request, Response, NextFunction } from 'express';
import { fullOptimizationService } from '../../services/optimizer/fullOptimizationService.js';
import { FullOptimizationStreamEvent } from '../../engine/optimizer/fullOptimizerTypes.js';

/**
 * POST /api/optimize/full
 * Starts or schedules a full-document resume optimization job.
 */
export async function startFullOptimization(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      resumeId,
      mode = 'ats_general',
      jobId,
      canonicalResume,
      targetJobDescription,
      targetJobTitle,
      targetCompany,
      wait = false,
    } = req.body;

    const clientId =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'anon_client';

    const job = await fullOptimizationService.createJob(
      {
        resumeId,
        mode,
        jobId,
        canonicalResume,
        targetJobDescription,
        targetJobTitle,
        targetCompany,
      },
      clientId
    );

    // If caller explicitly requested waiting for completion (e.g. CLI/tests)
    if (wait === true || req.query.wait === 'true') {
      const maxWaitMs = 15000;
      const startTime = Date.now();
      while (
        (job.status === 'queued' || job.status === 'processing') &&
        Date.now() - startTime < maxWaitMs
      ) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    return res.status(200).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      progressPercent: job.progressPercent,
      job,
    });
  } catch (err: any) {
    if (err.message?.includes('Rate limit exceeded')) {
      return res.status(429).json({
        success: false,
        error: err.message,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }
    return next(err);
  }
}

/**
 * GET /api/optimize/full/:jobId
 * Returns the latest status and results of an optimization job.
 */
export async function getOptimizationJobStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const job = fullOptimizationService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Optimization job with ID '${jobId}' not found or expired.`,
        code: 'JOB_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      job,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/optimize/full/:jobId/stream
 * Server-Sent Events (SSE) stream for live per-section updates.
 */
export async function streamOptimizationJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const job = fullOptimizationService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Optimization job with ID '${jobId}' not found.`,
        code: 'JOB_NOT_FOUND',
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`);

    const unsubscribe = fullOptimizationService.subscribe(
      jobId,
      (event: FullOptimizationStreamEvent) => {
        try {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          if (
            event.type === 'job_completed' ||
            event.type === 'job_failed' ||
            event.type === 'job_cancelled'
          ) {
            setTimeout(() => {
              res.end();
            }, 200);
          }
        } catch (err) {
          unsubscribe();
        }
      }
    );

    req.on('close', () => {
      unsubscribe();
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/optimize/full/:jobId/cancel
 * Cancels an in-progress optimization job.
 */
export async function cancelOptimizationJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const success = fullOptimizationService.cancelJob(jobId);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: `Job '${jobId}' could not be cancelled (already completed or not found).`,
        code: 'CANNOT_CANCEL',
      });
    }

    return res.json({
      success: true,
      jobId,
      status: 'cancelled',
    });
  } catch (err) {
    return next(err);
  }
}
