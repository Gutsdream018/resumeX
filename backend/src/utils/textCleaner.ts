/**
 * High-efficiency text cleaner to minimize token consumption when sending resume text to LLMs.
 */

export function cleanResumeTextForLlm(text: string, maxChars: number = 3000): string {
  if (!text) return '';

  const cleaned = text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove non-printable / control characters except tabs & newlines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove repeated page numbers / headers / footers (e.g. "Page 1 of 2", "Page 2", "--- Page 1 ---")
    .replace(/(?:^|\n)\s*(?:page\s*\d+(?:\s*(?:of|\/)\s*\d+)?|-+\s*page\s*\d+\s*-+)\s*(?:\n|$)/gi, '\n')
    // Remove repetitive divider lines (e.g., "---------------", "===============")
    .replace(/(?:^|\n)\s*[-=_*~]{3,}\s*(?:\n|$)/g, '\n')
    // Collapse multiple horizontal spaces/tabs to a single space
    .replace(/[ \t]+/g, ' ')
    // Collapse 3+ newlines to 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Bounded slice to enforce token economy
  if (cleaned.length > maxChars) {
    return cleaned.slice(0, maxChars) + '\n[...content truncated for token optimization...]';
  }

  return cleaned;
}

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
}
