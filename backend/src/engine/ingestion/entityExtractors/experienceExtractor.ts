import { ExperienceEntry } from '../types.js';
import { parseDateRange } from './chronologyEngine.js';

const KNOWN_ROLES = [
  'engineer',
  'developer',
  'architect',
  'manager',
  'lead',
  'director',
  'analyst',
  'consultant',
  'intern',
  'associate',
  'specialist',
  'administrator',
  'scientist',
  'designer',
];

/**
 * Parses raw text from the Experience/Work History section into structured ExperienceEntry objects.
 */
export function extractExperienceEntries(sectionText: string): ExperienceEntry[] {
  if (!sectionText || sectionText.trim().length === 0) {
    return [];
  }

  const entries: ExperienceEntry[] = [];
  const lines = sectionText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Cluster lines into role blocks based on headers containing dates or role titles
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const isBullet = /^[•\-*o\u25CF\u25CB\u25AA\u25AB\u2022\u2023\u2043\u2219]/.test(line);
    const hasDate = /\b(?:20\d{2}|19\d{2})\b/.test(line) && !isBullet;
    const hasRoleKeyword = KNOWN_ROLES.some((r) =>
      new RegExp(`\\b${r}\\b`, 'i').test(line)
    ) && !isBullet && line.length < 90;

    const isNewRoleHeader = (hasDate && hasRoleKeyword) || (hasDate && currentBlock.length > 2);

    if (isNewRoleHeader && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  for (const block of blocks) {
    if (block.length === 0) continue;

    const headerLine = block[0];
    const subHeaderLine = block.length > 1 ? block[1] : '';

    let company: string | null = null;
    let title: string | null = null;
    let location: string | null = null;
    let dateRangeStr = '';

    // Find date range in header or subheader
    const dateMatch = (headerLine + ' ' + subHeaderLine).match(
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s/.-]+)?(?:\d{1,2}[\s/.-]+)?(?:20\d{2}|19\d{2})(?:\s*(?:-|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s/.-]+)?(?:\d{1,2}[\s/.-]+)?(?:20\d{2}|19\d{2}|Present|Current))?/i
    );
    if (dateMatch) {
      dateRangeStr = dateMatch[0];
    }

    const cleanHeader = headerLine.replace(dateRangeStr, '').replace(/^[|–—\-,\s]+|[|–—\-,\s]+$/g, '').trim();

    // Check if header contains title | company or title at company
    if (cleanHeader.includes('|') || cleanHeader.includes('–') || cleanHeader.includes(' - ')) {
      const parts = cleanHeader.split(/[|–—]|\s-\s/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        title = parts[0];
        company = parts[1];
      } else {
        title = cleanHeader;
      }
    } else if (/\bat\b/i.test(cleanHeader)) {
      const parts = cleanHeader.split(/\bat\b/i).map((p) => p.trim());
      title = parts[0] || null;
      company = parts[1] || null;
    } else {
      title = cleanHeader || null;
    }

    // Extract bullet points
    const bullets: string[] = [];
    const techSet = new Set<string>();

    for (let i = 1; i < block.length; i++) {
      const line = block[i];
      if (line === subHeaderLine && (line.includes('|') || dateRangeStr.includes(line))) {
        continue;
      }

      const cleanBullet = line.replace(/^[•\-*o\u25CF\u25CB\u25AA\u25AB\u2022\u2023\u2043\u2219\s]+/, '').trim();
      if (cleanBullet.length > 10) {
        bullets.push(cleanBullet);
      }
    }

    const normDates = parseDateRange(dateRangeStr);

    entries.push({
      company: company || null,
      title: title || null,
      location: location || null,
      startDate: normDates.startDate,
      endDate: normDates.endDate,
      isCurrent: normDates.isCurrent,
      bullets,
      technologies: Array.from(techSet),
      source: {
        method: 'pdf_text',
      },
    });
  }

  return entries;
}
