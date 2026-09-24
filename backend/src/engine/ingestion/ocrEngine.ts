import path from 'path';
import * as napiCanvas from '@napi-rs/canvas';
import Tesseract from 'tesseract.js';

let pdfjsLib: any = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist/legacy/build/pdf.js');
    pdfjsLib = mod.default || mod;
  }
  return pdfjsLib;
}

export interface OcrResult {
  text: string;
  confidence: number;
  wordCount: number;
  charCount: number;
  pagesProcessed: number;
  isLowConfidence: boolean;
  warnings: string[];
}

/**
 * Cleans and normalizes raw OCR text for resumes, fixing character misreads,
 * joining wrapped bullet points, and repairing spaced section headers.
 */
export function cleanOcrResumeText(raw: string): string {
  if (!raw) return '';

  return raw
    // Normalize unicode dashes and quotes
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Standardize bullet points
    .replace(/^[\s]*[o*•\u25CF\u25CB\u25AA\u25AB\u2022\u2023\u2043\u2219-]\s+/gm, '• ')
    // Fix spaced out letters in common section headers
    .replace(/\bE\s+X\s+P\s+E\s+R\s+I\s+E\s+N\s+C\s+E\b/gi, 'EXPERIENCE')
    .replace(/\bS\s+K\s+I\s+L\s+L\s+S\b/gi, 'SKILLS')
    .replace(/\bE\s+D\s+U\s+C\s+A\s+T\s+I\s+O\s+N\b/gi, 'EDUCATION')
    .replace(/\bP\s+R\s+O\s+J\s+E\s+C\s+T\s+S\b/gi, 'PROJECTS')
    .replace(/\bS\s+U\s+M\s+M\s+A\s+R\s+Y\b/gi, 'SUMMARY')
    // Fix common OCR misreads in technical terms
    .replace(/\bTypeScnpt\b/gi, 'TypeScript')
    .replace(/\bJavaScnpt\b/gi, 'JavaScript')
    .replace(/\bPostgre\s*SQL\b/gi, 'PostgreSQL')
    .replace(/\bN0de(?:\.js)?\b/gi, 'Node.js')
    .replace(/\bD0cker\b/gi, 'Docker')
    .replace(/\bKubemetes\b/gi, 'Kubernetes')
    .replace(/\bG1tHub\b/gi, 'GitHub')
    // Fix broken words split by hyphen at end of line
    .replace(/(\w+)-\n\s*(\w+)/g, '$1$2')
    // Rejoin soft line breaks within sentences (lowercase starting line without bullet)
    .replace(/([a-zA-Z0-9,])\n([a-z])/g, '$1 $2')
    // Collapse excessive empty lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Computes heuristic OCR quality metric based on dictionary/word validity and symbol ratios.
 */
function evaluateOcrConfidence(
  text: string,
  tesseractConfidence: number
): { confidence: number; isLow: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!text || text.length < 30) {
    return {
      confidence: 0.1,
      isLow: true,
      warnings: ['Extracted text is too short or empty.'],
    };
  }

  const words = text.match(/[a-zA-Z0-9_\-\u00C0-\u017F]+/g) || [];
  if (words.length < 10) {
    return {
      confidence: 0.2,
      isLow: true,
      warnings: ['Very few recognizable words detected.'],
    };
  }

  // Count unreadable / non-alphanumeric noise characters
  const noiseChars = text.match(/[^a-zA-Z0-9\s.,!?:;()\-•/@+#&]/g) || [];
  const noiseRatio = noiseChars.length / text.length;

  if (noiseRatio > 0.15) {
    warnings.push('High concentration of garbled OCR noise characters.');
  }

  const normalizedTesseract = Math.max(0, Math.min(1, tesseractConfidence / 100));
  const textQualityScore = Math.max(0, 1 - noiseRatio * 3);
  const combined = Number((normalizedTesseract * 0.6 + textQualityScore * 0.4).toFixed(2));

  const isLow = combined < 0.45 || words.length < 20;
  if (isLow) {
    warnings.push('Low OCR confidence: text may contain severe misreads.');
  }

  return { confidence: combined, isLow, warnings };
}

/**
 * Preprocesses and enhances image resolution for optimal OCR recognition.
 */
async function preprocessImageBuffer(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const img = await napiCanvas.loadImage(imageBuffer);
    // Optimal OCR width between 1800px and 2600px
    const targetWidth = Math.max(1800, Math.min(2800, img.width * 2));
    const scale = targetWidth / img.width;
    const targetHeight = Math.round(img.height * scale);

    const canvas = napiCanvas.createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas.toBuffer('image/png');
  } catch {
    return imageBuffer;
  }
}

/**
 * Runs OCR on a single image buffer (PNG, JPG, WEBP).
 */
export async function performImageOcr(imageBuffer: Buffer): Promise<OcrResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    return {
      text: '',
      confidence: 0,
      wordCount: 0,
      charCount: 0,
      pagesProcessed: 0,
      isLowConfidence: true,
      warnings: ['Image buffer was empty.'],
    };
  }

  const processedBuffer = await preprocessImageBuffer(imageBuffer);

  const { data } = await Tesseract.recognize(processedBuffer, 'eng', {
    errorHandler: (err) => console.warn('[Tesseract Warning]:', err),
  });

  const rawText = (data?.text || '').trim();
  const cleaned = cleanOcrResumeText(rawText);
  const quality = evaluateOcrConfidence(cleaned, data?.confidence || 60);

  return {
    text: cleaned,
    confidence: quality.confidence,
    wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    charCount: cleaned.length,
    pagesProcessed: 1,
    isLowConfidence: quality.isLow,
    warnings: quality.warnings,
  };
}

/**
 * Renders pages of a PDF into high-res PNG buffers and executes multi-page OCR.
 */
export async function performPdfOcr(
  pdfBuffer: Buffer,
  maxPages: number = 4
): Promise<OcrResult> {
  const pdfjs = await getPdfJs();
  const standardFontDataUrl =
    path.resolve(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts') + '/';

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    standardFontDataUrl,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = Math.min(pdfDoc.numPages, maxPages);
  const pageTexts: string[] = [];
  let totalConfidence = 0;
  const allWarnings: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // Scale 2.0 provides optimal resolution for Tesseract OCR recognition
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = napiCanvas.createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer('image/png');
    const pageResult = await performImageOcr(pngBuffer);

    if (pageResult.text.length > 0) {
      pageTexts.push(pageResult.text);
      totalConfidence += pageResult.confidence;
      allWarnings.push(...pageResult.warnings);
    }
  }

  const combinedText = pageTexts.join('\n\n');
  const avgConfidence = numPages > 0 ? Number((totalConfidence / numPages).toFixed(2)) : 0;
  const isLow = avgConfidence < 0.45 || combinedText.length < 50;

  return {
    text: combinedText,
    confidence: avgConfidence,
    wordCount: combinedText.split(/\s+/).filter(Boolean).length,
    charCount: combinedText.length,
    pagesProcessed: numPages,
    isLowConfidence: isLow,
    warnings: Array.from(new Set(allWarnings)),
  };
}
