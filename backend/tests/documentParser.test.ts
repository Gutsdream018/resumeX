import { describe, it, expect } from 'vitest';
import { parseDocument, DocumentParserError } from '../src/services/parser/documentParser.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

describe('Document Parser Suite', () => {
  it('should extract text accurately from text-based PDF', async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([600, 400]);
    page.drawText('Jane Developer - Full Stack Engineer\nExperience at Tech Corp', {
      x: 50,
      y: 350,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await parseDocument(buffer, 'application/pdf', 'resume.pdf');
    expect(result.documentType).toBe('text_pdf');
    expect(result.text).toContain('Jane Developer');
    expect(result.wordCount).toBeGreaterThan(5);
  });

  it('should reject completely empty files with DocumentParserError', async () => {
    const emptyBuffer = Buffer.from('');
    await expect(
      parseDocument(emptyBuffer, 'application/pdf', 'empty.pdf')
    ).rejects.toThrow('The uploaded file is empty.');
  });

  it('should reject unsupported file extensions', async () => {
    const buffer = Buffer.from('some content');
    await expect(
      parseDocument(buffer, 'application/zip', 'archive.zip')
    ).rejects.toThrow(/Unsupported file format/);
  });

  it('should return needs_ocr status when image-only PDF is processed without OCR allowed', async () => {
    // Create an empty visual page with zero text characters
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await parseDocument(buffer, 'application/pdf', 'scanned.pdf', { allowOcr: false });
    expect(result.needsOcr).toBe(true);
    expect(result.message).toContain('requires OCR');
  });

  it('should parse plain text documents seamlessly', async () => {
    const textContent = 'John Doe\njohn@example.com\nSoftware Engineer with React experience.';
    const buffer = Buffer.from(textContent, 'utf-8');

    const result = await parseDocument(buffer, 'text/plain', 'resume.txt');
    expect(result.documentType).toBe('text');
    expect(result.text).toContain('John Doe');
    expect(result.wordCount).toBe(8);
  });
});
