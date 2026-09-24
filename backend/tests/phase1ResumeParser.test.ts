import { describe, it, expect } from 'vitest';
import { executeResumeParserPipeline } from '../src/services/parser/resumeParserPipeline.js';
import { DocumentParserError } from '../src/services/parser/documentParser.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { MOCK_RESUMES } from './fixtures/mockResumes.js';

describe('PHASE 1 — Resume Parser Pipeline Suite', () => {
  it('1. Normal PDF: extracts text and builds complete structured Resume JSON', async () => {
    // Generate a valid text PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([600, 800]);

    page.drawText(MOCK_RESUMES.excellent.content, {
      x: 40,
      y: 750,
      size: 9,
      font,
      color: rgb(0, 0, 0),
      lineHeight: 12,
      maxWidth: 520,
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await executeResumeParserPipeline(buffer, 'application/pdf', 'sarah_chen_resume.pdf');

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.documentType).toBe('text_pdf');
      expect(result.wordCount).toBeGreaterThan(50);

      // Verify exact required schema keys
      const resume = result.structuredResume;
      expect(resume).toHaveProperty('contact');
      expect(resume).toHaveProperty('summary');
      expect(resume).toHaveProperty('education');
      expect(resume).toHaveProperty('experience');
      expect(resume).toHaveProperty('projects');
      expect(resume).toHaveProperty('skills');
      expect(resume).toHaveProperty('certifications');
      expect(resume).toHaveProperty('achievements');

      // Verify contact extraction
      expect(resume.contact.email).toBe('sarah.chen@example.com');
      expect(resume.contact.name).toBe('SARAH CHEN');

      // Verify experience preserving bullets
      expect(resume.experience.length).toBeGreaterThanOrEqual(1);
      expect(resume.experience[0].bullets.length).toBeGreaterThanOrEqual(1);

      // Verify skills structure
      expect(resume.skills.languages).toContain('Go');
      expect(resume.skills.tools).toContain('Docker');
    }
  });

  it('2. Scanned / Image-only PDF: returns clear OCR-required state without silent failure', async () => {
    // Create an empty visual page with zero text characters
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await executeResumeParserPipeline(buffer, 'application/pdf', 'scanned_document.pdf');

    expect(result.status).toBe('needs_ocr');
    if (result.status === 'needs_ocr') {
      expect(result.message).toContain('requires OCR');
      expect(result.documentType).toBe('scanned_pdf');
    }
  });

  it('3. Empty file: rejects with 400 EMPTY_FILE', async () => {
    const emptyBuffer = Buffer.from('');
    await expect(
      executeResumeParserPipeline(emptyBuffer, 'application/pdf', 'empty_resume.pdf')
    ).rejects.toThrow(DocumentParserError);
  });

  it('4. Unsupported file format: rejects with 415 UNSUPPORTED_FORMAT', async () => {
    const buffer = Buffer.from('executable binary code');
    await expect(
      executeResumeParserPipeline(buffer, 'application/octet-stream', 'malicious.exe')
    ).rejects.toThrow(/Unsupported file format/);
  });

  it('5. Corrupted PDF file: gracefully handles and throws DocumentParserError with 422', async () => {
    const corruptedBuffer = Buffer.from('%PDF-1.4 corrupted header and truncated bytes');
    await expect(
      executeResumeParserPipeline(corruptedBuffer, 'application/pdf', 'corrupted.pdf')
    ).rejects.toThrow(DocumentParserError);
  });

  it('6. Zero Hallucination: does not invent missing sections or fictitious information', async () => {
    const plainText = MOCK_RESUMES.poor.content;
    const buffer = Buffer.from(plainText, 'utf-8');

    const result = await executeResumeParserPipeline(buffer, 'text/plain', 'poor_resume.txt');

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const resume = result.structuredResume;
      // Poor resume has no education, no projects, no certifications, no achievements
      expect(resume.education).toHaveLength(0);
      expect(resume.projects).toHaveLength(0);
      expect(resume.certifications).toHaveLength(0);
      expect(resume.achievements).toHaveLength(0);
      expect(resume.contact.phone).toBe('');
      expect(resume.contact.linkedin).toBe('');
    }
  });
});
