import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { analyzeResume } from '../controllers/resume.controller.js';
import { SAMPLE_RESUMES } from '../../routes/analyze.js';

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
