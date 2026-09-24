/**
 * Utility functions for text cleaning, tokenization, and regex operations.
 */

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove non-printable ASCII
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/);
  return words.length;
}

export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  return /^([•\-\*\u2022\u2023\u25E6\u2043\u2219]|(\d+[\.\)]))\s+/.test(trimmed);
}

export function cleanBullet(line: string): string {
  return line
    .trim()
    .replace(/^([•\-\*\u2022\u2023\u25E6\u2043\u2219]|(\d+[\.\)]))\s*/, '')
    .trim();
}

export function clamp(val: number, min: number = 0, max: number = 100): number {
  if (isNaN(val)) return min;
  return Math.min(max, Math.max(min, Math.round(val)));
}
