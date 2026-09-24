import { Router } from 'express';
import { matchJobDescription, parseJobDescriptionHandler } from '../controllers/jobMatch.controller.js';

export const jobMatchRouter = Router();

// Match Engine endpoints
jobMatchRouter.post('/', matchJobDescription);
jobMatchRouter.post('/match', matchJobDescription);
jobMatchRouter.post('/analyze', matchJobDescription);
jobMatchRouter.post('/parse-jd', parseJobDescriptionHandler);
