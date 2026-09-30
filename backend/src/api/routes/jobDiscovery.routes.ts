import { Router } from 'express';
import {
  getResumeProfileHandler,
  updatePreferencesHandler,
  searchMatchedJobsHandler,
  saveTailoredResumeHandler,
  getTailoredResumesHandler,
  trackClickEventHandler,
  checkJobLinkHandler,
  interactJobHandler,
  getSavedJobsHandler,
  getApplicationsHandler,
  createApplicationHandler,
  updateApplicationHandler,
  deleteApplicationHandler,
  generateCoverLetterHandler,
} from '../controllers/jobDiscovery.controller.js';

export const jobDiscoveryRouter = Router();

// Core Job Discovery & Matching
jobDiscoveryRouter.post('/profile', getResumeProfileHandler);
jobDiscoveryRouter.post('/preferences', updatePreferencesHandler);
jobDiscoveryRouter.post('/search', searchMatchedJobsHandler);

// Tailored Resumes
jobDiscoveryRouter.post('/tailor', saveTailoredResumeHandler);
jobDiscoveryRouter.get('/tailored/:resumeId', getTailoredResumesHandler);

// Links, Click Tracking & Interactions
jobDiscoveryRouter.post('/track-click', trackClickEventHandler);
jobDiscoveryRouter.post('/check-link', checkJobLinkHandler);
jobDiscoveryRouter.post('/interact', interactJobHandler);
jobDiscoveryRouter.get('/saved', getSavedJobsHandler);

// Application Tracker (MVP)
jobDiscoveryRouter.get('/applications', getApplicationsHandler);
jobDiscoveryRouter.post('/applications', createApplicationHandler);
jobDiscoveryRouter.patch('/applications/:id', updateApplicationHandler);
jobDiscoveryRouter.delete('/applications/:id', deleteApplicationHandler);

// Apply Kit: Cover Letter Generator
jobDiscoveryRouter.post('/cover-letter', generateCoverLetterHandler);
