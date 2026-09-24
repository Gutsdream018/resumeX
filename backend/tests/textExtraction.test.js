import { describe, it, expect } from 'vitest';
import { extractTextFromBuffer, sanitizeText, countWords, ExtractionError, } from '../src/services/textExtractor.js';
describe('Text Extraction and Sanitization', () => {
    it('should accurately extract and sanitize plain text buffer', async () => {
        const rawContent = `
      JANE DOE
      jane@example.com | 555-123-4567

      SUMMARY
      Experienced full-stack engineer with 6 years of expertise building microservices and web systems.

      SKILLS
      TypeScript, React, Node.js, Python, PostgreSQL, AWS

      EXPERIENCE
      Senior Software Engineer at AlphaCorp (2020-Present)
      - Spearheaded migration to cloud infrastructure, reducing hosting costs by 25%.
      - Mentored junior engineers and improved test coverage.

      EDUCATION
      B.S. in Computer Engineering, MIT
    `;
        const buffer = Buffer.from(rawContent, 'utf-8');
        const result = await extractTextFromBuffer(buffer, 'text/plain', 'resume.txt');
        expect(result.text).toContain('JANE DOE');
        expect(result.word_count).toBeGreaterThan(30);
        expect(result.detected_sections).toContain('summary');
        expect(result.detected_sections).toContain('experience');
        expect(result.detected_sections).toContain('education');
        expect(result.detected_sections).toContain('skills');
    });
    it('should throw an ExtractionError for empty buffer', async () => {
        const emptyBuffer = Buffer.alloc(0);
        await expect(extractTextFromBuffer(emptyBuffer, 'text/plain', 'empty.txt')).rejects.toThrow(ExtractionError);
    });
    it('should throw an ExtractionError for extremely short resume text', async () => {
        const shortBuffer = Buffer.from('John Doe, programmer.', 'utf-8');
        await expect(extractTextFromBuffer(shortBuffer, 'text/plain', 'short.txt')).rejects.toThrow(ExtractionError);
    });
    it('should throw an ExtractionError for unsupported file extension', async () => {
        const buffer = Buffer.from('Some binary file content here...', 'utf-8');
        await expect(extractTextFromBuffer(buffer, 'image/png', 'photo.png')).rejects.toThrow('Unsupported file type (.png)');
    });
    it('should correctly sanitize multi-line and non-printable characters', () => {
        const dirty = 'Hello\r\nWorld\x00\x07   with   spaces\n\n\n\nEnd';
        const cleaned = sanitizeText(dirty);
        expect(cleaned).not.toContain('\r');
        expect(cleaned).not.toContain('\x00');
        expect(cleaned).toContain('Hello\nWorld with spaces');
    });
    it('should accurately count words', () => {
        expect(countWords('')).toBe(0);
        expect(countWords('   ')).toBe(0);
        expect(countWords('One two three four five')).toBe(5);
    });
});
