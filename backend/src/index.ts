import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resumeRouter } from './api/routes/resume.routes.js';
import { jobMatchRouter } from './api/routes/jobMatch.routes.js';
import { jobDiscoveryRouter } from './api/routes/jobDiscovery.routes.js';
import { analysisRouter } from './api/routes/analysis.routes.js';
import { fullOptimizerRouter } from './api/routes/fullOptimizer.routes.js';
import { errorHandler } from './api/middleware/error.middleware.js';
import { requestLogger } from './api/middleware/logger.middleware.js';
import { createRateLimiter } from './api/middleware/rateLimit.middleware.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// Trust reverse proxy (Render, Netlify, Cloudflare) for accurate client IP in rate limiting
app.set('trust proxy', 1);

// Configure CORS for local development and Netlify production deployment
const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, uptime bots)
      if (!origin) return callback(null, true);

      // In non-production or if explicitly listed in FRONTEND_URL, wildcard, or deployment domains
      if (
        process.env.NODE_ENV !== 'production' ||
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(origin) ||
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:3000'
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Sanitized production request logger (skips /api/health spam)
app.use(requestLogger);

// Sliding-window in-memory rate limiting (exempts /api/health)
app.use(createRateLimiter({ maxRequests: 60, windowMs: 15 * 60 * 1000 }));

// Reasonable payload limits to prevent memory exhaustion
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (Render & Netlify uptime verification)
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
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// 1. Modular Resume Ingestion & Intelligence Routes: /api/resume/*
app.use('/api/resume', resumeRouter);

// 2. Job Description Match Engine Routes: /api/job-match/*
app.use('/api/job-match', jobMatchRouter);

// 3. Job Match & Discovery Intelligence Routes: /api/jobs/*
app.use('/api/jobs', jobDiscoveryRouter);

// 4. Full Resume Optimization Intelligence Pipeline: /api/optimize/*
app.use('/api/optimize', fullOptimizerRouter);

// 5. Backwards-compatible /api routes (/api/analyze, /api/analyze-text, /api/sample-resumes)
app.use('/api', analysisRouter);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server on 0.0.0.0 for Render container compatibility
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    const activeModel = process.env.NVIDIA_API_KEY?.trim()
      ? `NVIDIA NIM (${process.env.NVIDIA_MODEL || 'meta/muse-glimmer-30b'})`
      : process.env.GEMINI_API_KEY?.trim()
      ? 'Live Gemini AI'
      : 'Hybrid Deterministic Intelligence Engine';

    console.log(`🚀 Resume Reviewer backend listening on 0.0.0.0:${PORT}`);
    console.log(`💡 Mode: ${activeModel}`);
  });
}

export default app;
