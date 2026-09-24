import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resumeRouter } from './api/routes/resume.routes.js';
import { jobMatchRouter } from './api/routes/jobMatch.routes.js';
import { analysisRouter } from './api/routes/analysis.routes.js';
import { errorHandler } from './api/middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(
  cors({
    origin: '*', // Allow all origins for dev/preview flexibility
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  let mode = 'hybrid_deterministic';
  if (process.env.NVIDIA_API_KEY?.trim()) {
    mode = `nvidia_live (${process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b'})`;
  } else if (process.env.GEMINI_API_KEY?.trim()) {
    mode = 'gemini_live';
  }

  res.json({
    status: 'ok',
    service: 'Resume Reviewer Intelligence Backend',
    version: '2.0.0',
    mode,
    model: process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// 1. Modular Resume Ingestion & Intelligence Routes: /api/resume/*
app.use('/api/resume', resumeRouter);

// 2. Job Description Match Engine Routes: /api/job-match/*
app.use('/api/job-match', jobMatchRouter);

// 3. Backwards-compatible /api routes (/api/analyze, /api/analyze-text, /api/sample-resumes)
app.use('/api', analysisRouter);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const activeModel = process.env.NVIDIA_API_KEY?.trim()
      ? `NVIDIA NIM (${process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b'})`
      : process.env.GEMINI_API_KEY?.trim()
      ? 'Live Gemini AI'
      : 'Hybrid Deterministic Intelligence Engine';

    console.log(`🚀 Resume Reviewer backend listening on http://localhost:${PORT}`);
    console.log(`💡 Mode: ${activeModel}`);
  });
}

export default app;
