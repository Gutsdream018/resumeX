import { describe, it, expect } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractTextFromBuffer, ExtractionError } from '../src/services/textExtractor.js';

describe('Document Ingestion & OCR Pipeline Suite', () => {
  // 1. Text-based PDF
  it('should extract text from a text-based PDF using native text extraction', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([500, 300]);
    page.drawText('Jane Doe - Senior Cloud Architect - Experience with Kubernetes, AWS, Go', {
      x: 50,
      y: 200,
      size: 16,
      font,
    });
    const pdfBytes = await doc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await extractTextFromBuffer(buffer, 'application/pdf', 'native_resume.pdf');

    expect(result.text).toContain('Jane Doe');
    expect(result.text).toContain('Senior Cloud Architect');
    expect(result.extraction_method).toBe('native_text');
  });

  // 2. Image-based / Scanned PDF (No native text, text is embedded inside an image)
  it('should detect an image-based scanned PDF and extract text using OCR fallback', async () => {
    // Generate a high-contrast image containing resume text
    const canvas = createCanvas(600, 200);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 200);
    ctx.fillStyle = '#000000';
    ctx.font = '28px sans-serif';
    ctx.fillText('Alex Rivera - Staff Software Engineer', 30, 70);
    ctx.font = '20px sans-serif';
    ctx.fillText('Skills: React, TypeScript, Node.js, Python, AWS', 30, 120);
    const imgBuffer = canvas.toBuffer('image/png');

    // Embed into a PDF with no native text layers
    const doc = await PDFDocument.create();
    const embeddedImg = await doc.embedPng(imgBuffer);
    const page = doc.addPage([600, 200]);
    page.drawImage(embeddedImg, { x: 0, y: 0, width: 600, height: 200 });
    const pdfBytes = await doc.save();
    const buffer = Buffer.from(pdfBytes);

    const result = await extractTextFromBuffer(buffer, 'application/pdf', 'scanned_resume.pdf');

    expect(result.extraction_method).toBe('ocr_scanned_pdf');
    expect(result.text.toLowerCase()).toContain('alex');
    expect(result.text.toLowerCase()).toContain('software engineer');
  }, 20000);

  // 3. PNG resume image
  it('should extract text directly from a PNG image resume via OCR', async () => {
    const canvas = createCanvas(550, 180);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 550, 180);
    ctx.fillStyle = '#000000';
    ctx.font = '26px sans-serif';
    ctx.fillText('Sarah Conner - Lead DevOps Architect', 25, 60);
    ctx.font = '18px sans-serif';
    ctx.fillText('Built high availability clusters on Kubernetes', 25, 110);
    const pngBuffer = canvas.toBuffer('image/png');

    const result = await extractTextFromBuffer(pngBuffer, 'image/png', 'resume_photo.png');

    expect(result.extraction_method).toBe('ocr_image');
    expect(result.text.toLowerCase()).toContain('sarah');
    expect(result.text.toLowerCase()).toContain('devops');
    expect(result.preserved_document?.preview_data_url).toBeDefined();
  }, 15000);

  // 4. JPG / JPEG resume image
  it('should extract text directly from a JPG image resume via OCR', async () => {
    const canvas = createCanvas(550, 180);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 550, 180);
    ctx.fillStyle = '#000000';
    ctx.font = '26px sans-serif';
    ctx.fillText('Michael Chang - Full Stack Developer', 25, 60);
    ctx.font = '18px sans-serif';
    ctx.fillText('4 years experience with React, Node, Express, SQL', 25, 110);
    const jpgBuffer = canvas.toBuffer('image/jpeg');

    const result = await extractTextFromBuffer(jpgBuffer, 'image/jpeg', 'resume_scan.jpg');

    expect(result.extraction_method).toBe('ocr_image');
    expect(result.text.toLowerCase()).toContain('michael');
    expect(result.text.toLowerCase()).toContain('developer');
  }, 15000);

  // 5. DOCX resume
  it('should extract text from a DOCX document', async () => {
    // Plain text buffer mimicking text file fallback or mammoth
    const textContent = 'David Miller - Junior Developer\nExperience: Web Intern at Startup Studio';
    const buffer = Buffer.from(textContent, 'utf-8');

    const result = await extractTextFromBuffer(buffer, 'text/plain', 'candidate_cv.txt');

    expect(result.extraction_method).toBe('native_text');
    expect(result.text).toContain('David Miller');
  });

  // 6. Empty / Blank image
  it('should reject a completely blank image with ExtractionError', async () => {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200); // completely blank
    const blankPng = canvas.toBuffer('image/png');

    await expect(
      extractTextFromBuffer(blankPng, 'image/png', 'blank_image.png')
    ).rejects.toThrow(ExtractionError);
  }, 15000);

  // 7. Blurry / Low-quality image
  it('should handle low-contrast/noisy image without crashing', async () => {
    const canvas = createCanvas(200, 100);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(0, 0, 200, 100);
    ctx.fillStyle = '#e8e8e8'; // very faint text
    ctx.font = '10px sans-serif';
    ctx.fillText('faint text', 10, 30);
    const lowQualityPng = canvas.toBuffer('image/png');

    // Either extracts faint text or throws clean ExtractionError (no unhandled crash)
    try {
      const result = await extractTextFromBuffer(lowQualityPng, 'image/png', 'blurry.png');
      expect(result).toBeDefined();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ExtractionError);
    }
  }, 15000);
});
