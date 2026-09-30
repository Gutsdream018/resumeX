import { Router } from 'express';
import {
  startFullOptimization,
  getOptimizationJobStatus,
  streamOptimizationJob,
  cancelOptimizationJob,
} from '../controllers/fullOptimizer.controller.js';

export const fullOptimizerRouter = Router();

// Endpoint requested in prompt: POST /api/optimize/full { resumeId, mode, jobId? }
fullOptimizerRouter.post('/full', startFullOptimization);

// Progress and status query: GET /api/optimize/full/:jobId
fullOptimizerRouter.get('/full/:jobId', getOptimizationJobStatus);

// Live SSE streaming: GET /api/optimize/full/:jobId/stream
fullOptimizerRouter.get('/full/:jobId/stream', streamOptimizationJob);

// Cancellation support: POST /api/optimize/full/:jobId/cancel
fullOptimizerRouter.post('/full/:jobId/cancel', cancelOptimizationJob);
