import { ContactInfo } from '../../models/resume.types.js';

export interface ContactAnalysis {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  score: number; // 0 to 100
  issues: string[];
  strengths: string[];
}

export function analyzeContact(contact: ContactInfo, fullText: string): ContactAnalysis {
  const issues: string[] = [];
  const strengths: string[] = [];

  const hasName = Boolean(contact.name && contact.name.trim().length > 1);
  const hasEmail = Boolean(contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email));
  const hasPhone = Boolean(contact.phone && contact.phone.replace(/\D/g, '').length >= 10);
  const hasLinkedIn = Boolean(contact.linkedin || /linkedin\.com/i.test(fullText));
  const hasGitHub = Boolean(contact.github || /github\.com/i.test(fullText));

  let score = 0;
  if (hasName) score += 20;
  else issues.push('Candidate name could not be reliably extracted from the header.');

  if (hasEmail) {
    score += 25;
    strengths.push('Valid professional email provided in contact header.');
  } else {
    issues.push('Missing or invalid email address. ATS and recruiters cannot contact you.');
  }

  if (hasPhone) {
    score += 25;
    strengths.push('Phone number included for direct recruiter outreach.');
  } else {
    issues.push('Missing or incomplete phone number.');
  }

  if (hasLinkedIn) {
    score += 15;
    strengths.push('LinkedIn profile link provided to substantiate professional history.');
  } else {
    issues.push('Missing LinkedIn URL. Adding your profile boosts recruiter verification.');
  }

  if (hasGitHub) {
    score += 15;
    strengths.push('GitHub / portfolio link provided for code demonstration.');
  }

  return {
    hasName,
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGitHub,
    score: Math.min(100, score),
    issues,
    strengths,
  };
}
