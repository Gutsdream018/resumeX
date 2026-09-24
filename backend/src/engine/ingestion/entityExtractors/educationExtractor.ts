import { EducationEntry } from '../types.js';
import { parseDateRange } from './chronologyEngine.js';

const DEGREE_PATTERNS = [
  /\b(?:Bachelor(?:'s)?|B\.?S\.?|B\.?A\.?|B\.?Tech|B\.?E\.?|B\.?Com|B\.?Sc)\b/i,
  /\b(?:Master(?:'s)?|M\.?S\.?|M\.?A\.?|M\.?Tech|M\.?B\.?A\.?|M\.?Com|M\.?Sc)\b/i,
  /\b(?:Doctor|Ph\.?D\.?|Doctorate)\b/i,
  /\b(?:Associate(?:'s)?|A\.?S\.?|A\.?A\.?)\b/i,
  /\b(?:Diploma|Certificate)\b/i,
  /\b(?:\+2|12th|Intermediate|Higher\s+Secondary|Matriculation|10th|Secondary\s+School)\b/i,
];

/**
 * Parses raw text from the Education section into structured EducationEntry objects.
 */
export function extractEducationEntries(sectionText: string): EducationEntry[] {
  if (!sectionText || sectionText.trim().length === 0) {
    return [];
  }

  const entries: EducationEntry[] = [];
  const lines = sectionText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const isBullet = /^[•\-*o\u25CF\u25CB\u25AA\u25AB\u2022\u2023\u2043\u2219]/.test(line);
    const hasDegree = DEGREE_PATTERNS.some((p) => p.test(line));
    const hasUniversity = /\b(?:University|College|Institute|School|Academy)\b/i.test(line);

    const isNewBlock = (hasDegree || hasUniversity) && currentBlock.length > 0 && !isBullet;

    if (isNewBlock) {
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

    const fullBlockText = block.join(' ');
    let institution: string | null = null;
    let degree: string | null = null;
    let gpa: string | null = null;
    let dateRangeStr = '';

    // Extract GPA if explicitly stated
    const gpaMatch = fullBlockText.match(/\b(?:GPA|CGPA)[:\s]*([0-4](?:\.\d{1,2})?(?:\s*\/\s*4(?:\.0)?)?|[0-9](?:\.\d{1,2})?(?:\s*\/\s*10(?:\.0)?)?)\b/i);
    if (gpaMatch) {
      gpa = gpaMatch[1].trim();
    }

    // Extract dates
    const dateMatch = fullBlockText.match(
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s/.-]+)?(?:\d{1,2}[\s/.-]+)?(?:20\d{2}|19\d{2})(?:\s*(?:-|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s/.-]+)?(?:\d{1,2}[\s/.-]+)?(?:20\d{2}|19\d{2}|Present|Current))?/i
    );
    if (dateMatch) {
      dateRangeStr = dateMatch[0];
    }

    // Find institution
    for (const line of block) {
      if (/\b(?:University|College|Institute|School|Academy)\b/i.test(line)) {
        institution = line.replace(dateRangeStr, '').replace(/^[|–—\-,\s]+|[|–—\-,\s]+$/g, '').trim();
        break;
      }
    }

    // Find degree
    for (const line of block) {
      if (DEGREE_PATTERNS.some((p) => p.test(line))) {
        degree = line.replace(dateRangeStr, '').replace(/^[|–—\-,\s]+|[|–—\-,\s]+$/g, '').trim();
        break;
      }
    }

    if (!institution && block.length > 0) {
      institution = block[0].replace(dateRangeStr, '').trim();
    }

    const normDates = parseDateRange(dateRangeStr);

    entries.push({
      degree: degree || null,
      institution: institution || null,
      startDate: normDates.startDate,
      endDate: normDates.endDate,
      graduationDate: normDates.endDate || normDates.startDate,
      gpa: gpa || null,
      bullets: block.slice(2).filter((l) => l.length > 5),
      source: {
        method: 'pdf_text',
      },
    });
  }

  return entries;
}
