import { ContactInfo } from '../types.js';

const EXCLUDED_NAME_TOKENS = new Set([
  'resume',
  'curriculum',
  'vitae',
  'cv',
  'experience',
  'education',
  'skills',
  'summary',
  'projects',
  'contact',
  'profile',
  'engineer',
  'developer',
  'software',
  'page',
  'email',
  'phone',
  'address',
  'linkedin',
  'github',
]);

/**
 * Extracts contact information (Name, Email, Phone, Location, LinkedIn, GitHub, Portfolio)
 * using deterministic patterns and structural heuristics.
 */
export function extractContactInfo(fullText: string, headerText?: string): ContactInfo {
  const targetText = (headerText && headerText.length > 20 ? headerText : fullText).slice(0, 3000);

  // 1. Email extraction
  const emailMatch = targetText.match(
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/
  );
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;

  // 2. Phone extraction (international and domestic formats)
  const phoneMatch = targetText.match(
    /(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?|\d{3}[-.\s]?)\d{3}[-.\s]?\d{4}|\+\d{10,13})/
  );
  let phone: string | null = null;
  if (phoneMatch) {
    const rawPhone = phoneMatch[0].trim();
    // Filter out dates / years that resemble phones
    if (rawPhone.length >= 10 && !/^\d{4}-\d{2}-\d{2}$/.test(rawPhone)) {
      phone = rawPhone;
    }
  }

  // 3. LinkedIn URL
  const linkedinMatch = targetText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/[a-zA-Z0-9_-]+/i
  );
  const linkedin = linkedinMatch
    ? linkedinMatch[0].startsWith('http')
      ? linkedinMatch[0]
      : `https://${linkedinMatch[0]}`
    : null;

  // 4. GitHub URL
  const githubMatch = targetText.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i
  );
  const github = githubMatch
    ? githubMatch[0].startsWith('http')
      ? githubMatch[0]
      : `https://${githubMatch[0]}`
    : null;

  // 5. Portfolio / Website URL (excluding linkedin and github)
  const portfolioMatch = targetText.match(
    /(?:https?:\/\/)(?!.*(?:linkedin|github)\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i
  );
  const portfolio = portfolioMatch ? portfolioMatch[0] : null;

  // 6. Name extraction heuristic (first 5 non-empty lines)
  const lines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 8);

  let name: string | null = null;
  let title: string | null = null;

  for (const line of lines) {
    // Skip if line contains email, url, phone, or pure symbols
    if (
      line.includes('@') ||
      line.includes('http') ||
      line.includes('.com') ||
      /^[+\d\s()-]{8,}$/.test(line)
    ) {
      continue;
    }

    const clean = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);

    // Names are typically 2 to 4 words, 3 to 40 characters
    if (words.length >= 2 && words.length <= 4 && clean.length >= 4 && clean.length <= 40) {
      const lowerWords = words.map((w) => w.toLowerCase());
      const hasExcludedToken = lowerWords.some((w) => EXCLUDED_NAME_TOKENS.has(w));

      if (!hasExcludedToken) {
        name = clean;
        break;
      }
    }
  }

  // 7. Title extraction heuristic (line immediately after name if it contains technical keywords)
  if (name) {
    const nameIndex = lines.findIndex((l) => l.includes(name!));
    if (nameIndex >= 0 && nameIndex + 1 < lines.length) {
      const nextLine = lines[nameIndex + 1];
      if (
        /engineer|developer|architect|specialist|manager|analyst|scientist|consultant|student|intern|designer/i.test(
          nextLine
        ) &&
        !nextLine.includes('@') &&
        nextLine.length < 60
      ) {
        title = nextLine;
      }
    }
  }

  // 8. Location extraction heuristic
  const locMatch = targetText.match(
    /\b([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]+))\b/
  );
  const location = locMatch ? locMatch[1].trim() : null;

  return {
    name,
    title,
    email,
    phone,
    location,
    linkedin,
    github,
    portfolio,
  };
}
