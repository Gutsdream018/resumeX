import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { analyzeResume } from '../controllers/resume.controller.js';
import { SAMPLE_RESUMES } from '../../routes/analyze.js';

import { scoreSnapshotDb } from '../../services/scoring/scoreSnapshotDb.js';

export const analysisRouter = Router();

// Backwards-compatible POST /api/analyze
analysisRouter.post('/analyze', upload.single('resume'), analyzeResume);

// Backwards-compatible POST /api/analyze-text
analysisRouter.post('/analyze-text', analyzeResume);

// Curated sample resumes
analysisRouter.get('/sample-resumes', (req: Request, res: Response) => {
  return res.json({
    success: true,
    samples: SAMPLE_RESUMES.map(({ content, ...rest }) => rest),
  });
});

analysisRouter.get('/sample-resumes/:id', (req: Request, res: Response) => {
  const sample = SAMPLE_RESUMES.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Sample resume not found.' });
  }
  return res.json({ success: true, sample });
});

// Score History Snapshots (Phase 4c)
analysisRouter.post('/score-history/snapshot', (req: Request, res: Response) => {
  const { userId, resumeId, score, categoryScores } = req.body;
  if (!resumeId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing resumeId or valid score' });
  }
  const result = scoreSnapshotDb.saveSnapshot(userId, resumeId, score, categoryScores);
  return res.json({ success: true, ...result });
});

analysisRouter.get('/score-history/:resumeId', (req: Request, res: Response) => {
  const { resumeId } = req.params;
  const result = scoreSnapshotDb.getSnapshots(resumeId);
  return res.json({ success: true, ...result });
});
