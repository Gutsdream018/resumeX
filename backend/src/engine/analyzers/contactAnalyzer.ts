import { ContactInfo } from '../../models/resume.types.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';

export interface ContactAnalysisResult {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  score: number;
  signals: string[];
  deductions: string[];
  extracted: ContactInfo;
}

export function analyzeContactInfo(contact: ContactInfo, fullText: string): ContactAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];

  const hasName = Boolean(contact.name && contact.name.trim().length >= 2 && !/resume|curriculum|cv/i.test(contact.name));
  const hasEmail = Boolean(contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email));
  const hasPhone = Boolean(contact.phone && contact.phone.replace(/\D/g, '').length >= 10);
  const hasLinkedIn = Boolean(contact.linkedin || /linkedin\.com\/(?:in|pub)\/[\w-]+/i.test(fullText));
  const hasGitHub = Boolean(contact.github || /github\.com\/[\w-]+/i.test(fullText));

  let score = 0;

  if (hasName) {
    score += 25;
    signals.push(`Identified candidate name: "${contact.name}".`);
  } else {
    deductions.push('Candidate name could not be reliably extracted from the header.');
  }

  if (hasEmail) {
    score += 35;
    signals.push('Valid direct email address found in contact header.');
  } else {
    deductions.push('Missing or invalid email address. ATS and hiring managers require a valid email to initiate contact.');
  }

  if (hasPhone) {
    score += 25;
    signals.push('Standard phone number provided for recruiter screening.');
  } else {
    deductions.push('Missing or incomplete telephone number.');
  }

  if (hasLinkedIn) {
    score += 10;
    signals.push('LinkedIn profile link detected for background and network verification.');
  } else {
    deductions.push('No LinkedIn profile URL found. Including a LinkedIn link increases verification rates.');
  }

  if (hasGitHub) {
    score += 5;
    signals.push('GitHub / portfolio link provided for technical artifact review.');
  }

  return {
    hasName,
    hasEmail,
    hasPhone,
    hasLinkedIn,
    hasGitHub,
    score: safeClamp(score, 0, 100),
    signals,
    deductions,
    extracted: {
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      linkedin: contact.linkedin || '',
      github: contact.github || '',
    },
  };
}
