import { CanonicalResume, ExtractionValidationResult } from './types.js';
import { IngestionValidationError } from './fileValidator.js';

/**
 * Validates whether the extracted content represents a legitimate resume document,
 * verifying minimum section counts, contact presence, and semantic density.
 */
export function validateResumeExtraction(
  resume: CanonicalResume,
  rawText: string,
  ocrConfidence: number | null = null
): ExtractionValidationResult {
  const warnings: string[] = [];
  const reasons: string[] = [];

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const charCount = rawText.length;

  const hasName = !!(resume.contact.name && resume.contact.name.length >= 3);
  const hasContact = !!(
    resume.contact.email ||
    resume.contact.phone ||
    resume.contact.linkedin ||
    resume.contact.github
  );
  const hasExperience = resume.experience.length > 0;
  const hasEducation = resume.education.length > 0;
  const hasSkills =
    resume.skills.technical.length > 0 ||
    resume.skills.frameworks.length > 0 ||
    resume.skills.tools.length > 0;
  const hasProjects = resume.projects.length > 0;

  let sectionCount = 0;
  if (hasExperience) sectionCount++;
  if (hasEducation) sectionCount++;
  if (hasSkills) sectionCount++;
  if (hasProjects) sectionCount++;
  if (resume.summary) sectionCount++;
  if (resume.certifications.length > 0) sectionCount++;

  // 1. Critical Disqualifiers
  if (wordCount < 25 || charCount < 100) {
    throw new IngestionValidationError(
      'The uploaded document does not contain sufficient text to be evaluated as a resume.',
      'not_a_resume',
      422,
      { wordCount, charCount }
    );
  }

  // 2. Check for code files / random text uploads
  const isSourceCodeOrJson =
    /^\s*(?:import\s+|export\s+|function\s+|const\s+|class\s+|<!DOCTYPE\s+html|<html|\{\s*"\w+":)/i.test(
      rawText.slice(0, 300)
    );
  if (isSourceCodeOrJson && !hasExperience && !hasEducation) {
    throw new IngestionValidationError(
      'The uploaded file appears to be source code or raw data rather than a resume.',
      'not_a_resume',
      422
    );
  }

  // 3. Evaluate Resume Likelihood Confidence (0.0 to 1.0)
  let confidence = 0.5;

  if (hasName) {
    confidence += 0.15;
    reasons.push('Candidate name detected.');
  } else {
    warnings.push('Candidate name could not be reliably determined from header.');
  }

  if (hasContact) {
    confidence += 0.15;
    reasons.push('Valid contact details (email/phone/social) detected.');
  } else {
    warnings.push('No direct email or phone number detected in header.');
  }

  if (sectionCount >= 3) {
    confidence += 0.15;
    reasons.push(`Detected ${sectionCount} core resume sections.`);
  } else if (sectionCount >= 1) {
    confidence += 0.05;
    warnings.push(`Only ${sectionCount} recognizable resume section(s) found.`);
  } else {
    warnings.push('No standard resume sections detected.');
  }

  if (wordCount >= 100 && wordCount <= 1800) {
    confidence += 0.05;
  }

  if (ocrConfidence !== null && ocrConfidence < 0.45) {
    confidence = Math.min(confidence, 0.5);
    warnings.push('Low OCR extraction confidence.');
  }

  confidence = Number(Math.min(0.99, Math.max(0.1, confidence)).toFixed(2));
  const isResume = confidence >= 0.55 && (hasExperience || hasEducation || hasSkills || hasContact);

  if (!isResume) {
    throw new IngestionValidationError(
      'The uploaded document does not appear to be a resume. Please check the file and try again.',
      'not_a_resume',
      422,
      { confidence, sectionCount, warnings }
    );
  }

  return {
    isResume: true,
    confidence,
    warnings,
    reasons,
    signals: {
      hasName,
      hasContact,
      hasExperience,
      hasEducation,
      hasSkills,
      wordCount,
      charCount,
      sectionCount,
    },
  };
}
