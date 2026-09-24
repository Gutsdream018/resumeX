import { Router } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { uploadResume, analyzeResume, improveBullet, getResume, applyRevision } from '../controllers/resume.controller.js';
import { rescoreResume, factGuidedRewrite, getMissingInfoPrompt } from '../controllers/optimizer.controller.js';

export const resumeRouter = Router();

// STEP 1 — File Ingestion: POST /api/resume/upload
resumeRouter.post('/upload', upload.single('resume'), uploadResume);

// Multi-stage Analysis: POST /api/resume/analyze
resumeRouter.post('/analyze', upload.single('resume'), analyzeResume);

// Query Status/Results: GET /api/resume/:id
resumeRouter.get('/:id', getResume);

// STEP 9 — AI Improvement Engine: POST /api/resume/improve
resumeRouter.post('/improve', improveBullet);

// STEP 10 — Document Critique Engine: POST /api/resume/apply-revision
resumeRouter.post('/apply-revision', applyRevision);

// STEP 11 — Resume Optimizer Workspace API
resumeRouter.post('/optimizer/re-score', rescoreResume);
resumeRouter.post('/optimizer/fact-rewrite', factGuidedRewrite);
resumeRouter.post('/optimizer/missing-info', getMissingInfoPrompt);

