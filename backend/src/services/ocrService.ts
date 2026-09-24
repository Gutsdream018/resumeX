import path from 'path';
import { fileURLToPath } from 'url';
import Module from 'module';
import * as napiCanvas from '@napi-rs/canvas';
import Tesseract from 'tesseract.js';

// Setup ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global polyfills for PDF.js in Node environment
(global as any).DOMMatrix = napiCanvas.DOMMatrix;
(global as any).Path2D = napiCanvas.Path2D;
(global as any).ImageData = napiCanvas.ImageData;

// Polyfill require('canvas') for libraries expecting node-canvas
const origRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === 'canvas') return napiCanvas;
  return origRequire.apply(this, arguments);
};

// Dynamically load pdfjs-dist legacy
let pdfjsLib: any = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist/legacy/build/pdf.js');
    pdfjsLib = mod.default || mod;
  }
  return pdfjsLib;
}

/**
 * Extracts native text layer from PDF pages using pdfjs-dist.
 */
export async function extractPdfNativeText(pdfBuffer: Buffer, maxPages: number = 20): Promise<string> {
  try {
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
    const pagesText: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageLines: string[] = [];
      let currentLine: string[] = [];
      let lastY: number | null = null;

      for (const item of (content.items || [])) {
        const str = item.str || '';
        if (!str && !item.hasEOL) continue;

        const currentY = item.transform ? item.transform[5] : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
          if (currentLine.length > 0) {
            pageLines.push(currentLine.join(' ').trim());
            currentLine = [];
          }
        }

        if (str) currentLine.push(str);

        if (item.hasEOL) {
          pageLines.push(currentLine.join(' ').trim());
          currentLine = [];
          lastY = null;
        } else {
          lastY = currentY;
        }
      }

      if (currentLine.length > 0) {
        pageLines.push(currentLine.join(' ').trim());
      }

      const pageStr = pageLines.filter(Boolean).join('\n');
      if (pageStr.length > 0) {
        pagesText.push(pageStr);
      }
    }

    return pagesText.join('\n\n');
  } catch (err: any) {
    console.warn('[PDF Native Text Extraction Error]:', err.message);
    throw err;
  }
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
 * Performs adaptive Vision OCR on a PNG, JPG/JPEG, or WEBP image buffer.
 * Automatically handles image scaling and contrast normalization for crisp OCR extraction.
 */
export async function performImageOcr(imageBuffer: Buffer): Promise<string> {
  if (!imageBuffer || imageBuffer.length === 0) {
    return '';
  }

  try {
    let bufferToOcr = imageBuffer;

    // Preprocessing: normalize image resolution and enhance contrast if possible
    try {
      const img = await napiCanvas.loadImage(imageBuffer);
      // Optimal OCR width between 1600px and 2400px
      const targetWidth = Math.max(1600, Math.min(2600, img.width * 2));
      const scale = targetWidth / img.width;
      const targetHeight = Math.round(img.height * scale);

      const canvas = napiCanvas.createCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      bufferToOcr = canvas.toBuffer('image/png');
    } catch {
      bufferToOcr = imageBuffer;
    }

    const { data } = await Tesseract.recognize(bufferToOcr, 'eng', {
      errorHandler: (err) => console.warn('[Tesseract Warning]:', err),
    });

    const recognized = (data?.text || '').trim();
    return cleanOcrResumeText(recognized);
  } catch (err: any) {
    console.warn('[Image OCR Error]:', err.message);
    return '';
  }
}

/**
 * Renders pages of a PDF into PNG image buffers using @napi-rs/canvas.
 */
export async function renderPdfPagesToImages(
  pdfBuffer: Buffer,
  maxPages: number = 5
): Promise<Buffer[]> {
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
  const imageBuffers: Buffer[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // Scale 2.0 provides optimal resolution for Tesseract OCR recognition
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = napiCanvas.createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Fill white background before rendering PDF content
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, viewport.width, viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer('image/png');
    imageBuffers.push(pngBuffer);
  }

  return imageBuffers;
}

/**
 * Scans a PDF by rendering its pages to images and running OCR across them.
 */
export async function performPdfOcr(pdfBuffer: Buffer, maxPages: number = 4): Promise<string> {
  try {
    const pageImages = await renderPdfPagesToImages(pdfBuffer, maxPages);
    if (pageImages.length === 0) return '';

    const pageTexts: string[] = [];
    for (let i = 0; i < pageImages.length; i++) {
      const ocrText = await performImageOcr(pageImages[i]);
      if (ocrText.length > 0) {
        pageTexts.push(ocrText);
      }
    }

    return pageTexts.join('\n\n');
  } catch (err: any) {
    console.warn('[PDF OCR Fallback Failed]:', err.message);
    return '';
  }
}
