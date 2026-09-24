import { NormalizedDate } from '../types.js';

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

export interface ChronologyValidationResult {
  hasChronologyAnomaly: boolean;
  warnings: string[];
}

/**
 * Normalizes date strings like "Jan 2021 - Present", "06/2019 - 12/2022", "2020 - 2024"
 * into structured ISO year-month format (e.g. startDate: "2021-01", endDate: null, isCurrent: true).
 */
export function parseDateRange(dateStr: string): NormalizedDate {
  if (!dateStr) {
    return { startDate: null, endDate: null, isCurrent: false };
  }

  const raw = dateStr.trim();
  const isCurrent = /\b(?:present|current|now|ongoing|date)\b/i.test(raw);

  // Match 4-digit years (e.g. 2019, 2024) and optional months
  const regex =
    /(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2})[\s/.-]+)?(\b20\d{2}\b|\b19\d{2}\b)/gi;

  const matches = Array.from(raw.matchAll(regex));

  if (matches.length === 0) {
    return { startDate: null, endDate: null, isCurrent, rawText: raw };
  }

  const parseMatch = (m: RegExpMatchArray): string => {
    const rawMonth = m[1]?.toLowerCase();
    const year = m[2];
    let month = '01';

    if (rawMonth) {
      if (MONTH_MAP[rawMonth]) {
        month = MONTH_MAP[rawMonth];
      } else if (!isNaN(Number(rawMonth))) {
        const num = Number(rawMonth);
        month = num >= 1 && num <= 12 ? String(num).padStart(2, '0') : '01';
      }
    }
    return `${year}-${month}`;
  };

  const startFormatted = parseMatch(matches[0]);
  let endFormatted: string | null = null;

  if (isCurrent) {
    endFormatted = null;
  } else if (matches.length > 1) {
    endFormatted = parseMatch(matches[1]);
  }

  return {
    startDate: startFormatted,
    endDate: endFormatted,
    isCurrent,
    rawText: raw,
  };
}

/**
 * Validates chronology for common inconsistencies like end date before start date or future start dates.
 */
export function validateChronology(
  entries: Array<{ startDate: string | null; endDate: string | null; title?: string | null }>
): ChronologyValidationResult {
  const warnings: string[] = [];
  const currentYear = new Date().getFullYear();

  for (const entry of entries) {
    if (entry.startDate && entry.endDate) {
      if (entry.startDate > entry.endDate) {
        warnings.push(
          `Chronology conflict: Start date (${entry.startDate}) is after end date (${entry.endDate}) for ${entry.title || 'role'}.`
        );
      }
    }
    if (entry.startDate) {
      const startYear = parseInt(entry.startDate.split('-')[0], 10);
      if (startYear > currentYear + 1) {
        warnings.push(
          `Future start date detected (${entry.startDate}) for ${entry.title || 'role'}.`
        );
      }
    }
  }

  return {
    hasChronologyAnomaly: warnings.length > 0,
    warnings,
  };
}
