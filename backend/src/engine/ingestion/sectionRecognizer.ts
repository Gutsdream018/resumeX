export type RecognizedSectionKey =
  | 'summary'
  | 'experience'
  | 'internships'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'publications'
  | 'leadership'
  | 'volunteering'
  | 'languages'
  | 'other';

export interface RecognizedSection {
  key: RecognizedSectionKey;
  rawHeading: string;
  content: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

const SECTION_PATTERNS: Array<{ key: RecognizedSectionKey; regex: RegExp; priority: number }> = [
  {
    key: 'summary',
    regex:
      /^(?:professional\s+summary|career\s+summary|executive\s+summary|profile|about\s+me|career\s+objective|career\s+goal|objective|summary)\b/i,
    priority: 10,
  },
  {
    key: 'internships',
    regex:
      /^(?:summer\s+internship\s+program|internship\s+experience|internship\s+program|internships|trainee\s+experience|apprentice\s+experience)\b/i,
    priority: 10,
  },
  {
    key: 'experience',
    regex:
      /^(?:professional\s+experience|work\s+experience|employment\s+history|career\s+history|work\s+history|experience|relevant\s+experience)\b/i,
    priority: 8,
  },
  {
    key: 'projects',
    regex:
      /^(?:personal\s+projects|academic\s+projects|technical\s+projects|key\s+projects|open\s+source\s+projects|side\s+projects|projects|seminars\s+&\s+workshops|seminars)\b/i,
    priority: 9,
  },
  {
    key: 'skills',
    regex:
      /^(?:technical\s+skills|core\s+skills|skills\s+&\s+competencies|technical\s+proficiencies|technologies|tech\s+stack|programming\s+languages|skills|technical\s+expertise)\b/i,
    priority: 8,
  },
  {
    key: 'education',
    regex:
      /^(?:educational\s+qualifications?|academic\s+background|academic\s+qualifications?|educational\s+background|education\s+&\s+credentials|education|academics)\b/i,
    priority: 9,
  },
  {
    key: 'certifications',
    regex:
      /^(?:technical\s+certifications?|licenses\s+&\s+certifications|professional\s+certifications|certifications\s+&\s+licenses|certificates|certifications|workshops?\s*(?:&|and)\s*certifications?)\b/i,
    priority: 9,
  },
  {
    key: 'achievements',
    regex:
      /^(?:key\s+achievements|awards\s+&\s+honors|honors\s+&\s+awards|major\s+achievements|awards|achievements)\b/i,
    priority: 9,
  },
  {
    key: 'publications',
    regex: /^(?:publications\s+&\s+patents|research\s+papers|patents|publications)\b/i,
    priority: 9,
  },
  {
    key: 'leadership',
    regex:
      /^(?:co-?curricular\s+activities|extra-?curricular\s+activities|leadership\s+experience|extracurricular\s+activities|community\s+involvement|campus\s+involvement|leadership|activities)\b/i,
    priority: 8,
  },
  {
    key: 'volunteering',
    regex: /^(?:volunteer\s+experience|volunteer\s+work|community\s+service|volunteering)\b/i,
    priority: 9,
  },
  {
    key: 'languages',
    regex: /^(?:language\s+proficiency|languages\s+spoken|languages)\b/i,
    priority: 9,
  },
];

/**
 * Normalizes text by splitting inline headers that lack line breaks.
 */
function normalizeInlineHeadings(text: string): string {
  const inlineHeaderRegex =
    /(?:^|\s|\.|\b)(EDUCATIONAL\s+QUALIFICATIONS?|TECHNICAL\s+CERTIFICATIONS?|CO-?CURRICULAR\s+ACTIVITIES|EXTRA-?CURRICULAR\s+ACTIVITIES|SUMMER\s+INTERNSHIP\s+PROGRAM|WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|TECHNICAL\s+SKILLS|CAREER\s+OBJECTIVE|PROFESSIONAL\s+SUMMARY|PROJECTS|CERTIFICATIONS|EDUCATION|SKILLS)\s*[:\-e]?\s*/gi;

  return text.replace(inlineHeaderRegex, (match, header) => `\n\n${header.trim().toUpperCase()}\n`);
}

/**
 * Parses raw text into recognized sections using resilient heading matching.
 */
export function segmentResumeSections(text: string): Record<RecognizedSectionKey, string> {
  const result: Record<RecognizedSectionKey, string> = {
    summary: '',
    experience: '',
    internships: '',
    projects: '',
    skills: '',
    education: '',
    certifications: '',
    achievements: '',
    publications: '',
    leadership: '',
    volunteering: '',
    languages: '',
    other: '',
  };

  if (!text) return result;

  const normalizedText = normalizeInlineHeadings(text);
  const lines = normalizedText.split('\n');
  const detectedHeadings: Array<{
    lineIndex: number;
    key: RecognizedSectionKey;
    rawHeading: string;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.length > 55) continue;

    // Clean heading from punctuation and markdown bullets
    const cleanHeading = rawLine.replace(/^[#\-*•_\s:]+|[#:\-_*\s]+$/g, '').trim();
    if (!cleanHeading || cleanHeading.length > 40) continue;

    for (const pattern of SECTION_PATTERNS) {
      if (pattern.regex.test(cleanHeading)) {
        detectedHeadings.push({
          lineIndex: i,
          key: pattern.key,
          rawHeading: rawLine,
        });
        break;
      }
    }
  }

  // If no explicit headings detected, assign entire content to other
  if (detectedHeadings.length === 0) {
    result.other = text;
    return result;
  }

  // Segment lines between headings
  for (let j = 0; j < detectedHeadings.length; j++) {
    const current = detectedHeadings[j];
    const next = detectedHeadings[j + 1];
    const startIndex = current.lineIndex + 1;
    const endIndex = next ? next.lineIndex : lines.length;

    const sectionLines = lines.slice(startIndex, endIndex);
    const content = sectionLines.join('\n').trim();

    if (result[current.key]) {
      result[current.key] += '\n\n' + content;
    } else {
      result[current.key] = content;
    }
  }

  // Lines before the first heading are typically Contact / Header / Intro
  if (detectedHeadings[0].lineIndex > 0) {
    const topLines = lines.slice(0, detectedHeadings[0].lineIndex).join('\n').trim();
    if (topLines) {
      // If we don't have a dedicated summary, or top lines contain summary text
      if (!result.summary && topLines.length > 80 && !result.experience) {
        result.summary = topLines;
      } else {
        result.other = topLines + (result.other ? '\n\n' + result.other : '');
      }
    }
  }

  return result;
}
