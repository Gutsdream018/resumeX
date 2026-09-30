import { Job } from './types.js';

/**
 * Normalizes text for reliable deduplication comparison.
 */
export function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a normalized fingerprint for a job: company + title + location.
 */
export function generateJobFingerprint(job: Partial<Job>): string {
  const normCompany = normalizeString(job.company || 'unknown');
  const normTitle = normalizeString(job.title || 'role');
  const normLocation = normalizeString(job.location || 'remote');
  return `${normCompany}::${normTitle}::${normLocation}`;
}

/**
 * Deduplicates a list of jobs based on normalized company + title + location.
 * Keeps the instance with the more descriptive text or higher salary detail.
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();

  for (const job of jobs) {
    const key = generateJobFingerprint(job);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, job);
    } else {
      // Keep the one with longer/better description
      const existingDescLen = (existing.description || '').length;
      const currentDescLen = (job.description || '').length;
      if (currentDescLen > existingDescLen) {
        seen.set(key, job);
      }
    }
  }

  return Array.from(seen.values());
}
