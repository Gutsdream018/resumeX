import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { performImageOcr, performPdfOcr, extractPdfNativeText } from './ocrService.js';

export interface ExtractedContent {
  text: string;
  word_count: number;
  char_count: number;
  detected_sections: string[];
  extraction_method: 'native_text' | 'ocr_image' | 'ocr_scanned_pdf';
  preserved_document?: {
    mime_type: string;
    original_name?: string;
    preview_data_url?: string;
  };
}

export class ExtractionError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/**
 * Common resume section markers for heuristic section detection
 */
const COMMON_SECTION_MARKERS = [
  'summary',
  'profile',
  'objective',
  'experience',
  'work experience',
  'employment',
  'education',
  'skills',
  'technical skills',
  'projects',
  'certifications',
  'awards',
  'publications',
  'contact',
];

/**
 * Robust document ingestion pipeline supporting:
 * - PDF (Native text extraction with automatic OCR fallback for scanned/image PDFs)
 * - PNG, JPG, JPEG (Direct OCR processing)
 * - DOCX, TXT (Native document parsing)
 * Preserves the original document/preview data for visual annotations.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  originalName: string
): Promise<ExtractedContent> {
  if (!buffer || buffer.length === 0) {
    throw new ExtractionError('The uploaded file is completely empty.', 400);
  }

  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  let rawText = '';
  let extractionMethod: 'native_text' | 'ocr_image' | 'ocr_scanned_pdf' = 'native_text';

  const isImage = ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || mimetype.startsWith('image/');
  const isPdf = ext === 'pdf' || mimetype.includes('pdf');
  const isDocx =
    ext === 'docx' ||
    ext === 'doc' ||
    mimetype.includes('wordprocessingml') ||
    mimetype.includes('officedocument') ||
    mimetype.includes('msword');
  const isTxt = ext === 'txt' || mimetype.includes('text/plain');

  try {
    if (isImage) {
      // 1. Direct OCR for Image Resumes (PNG, JPG, JPEG)
      extractionMethod = 'ocr_image';
      rawText = await performImageOcr(buffer);
    } else if (isPdf) {
      // 2. Dual-stage PDF Ingestion
      // First attempt native text extraction using modern pdfjs-dist
      try {
        rawText = await extractPdfNativeText(buffer);
      } catch {
        rawText = '';
      }

      // If native text is short, attempt pdfParse
      if (sanitizeText(rawText).length < 20) {
        try {
          const pdfData = await pdfParse(buffer);
          if (pdfData.text && sanitizeText(pdfData.text).length >= 20) {
            rawText = pdfData.text;
          }
        } catch {
          // Ignore
        }
      }

      // If PDF contains little or no extractable text, treat as scanned/image-based PDF and trigger OCR
      if (sanitizeText(rawText).length < 20) {
        const ocrText = await performPdfOcr(buffer);
        if (ocrText && ocrText.trim().length > 0) {
          rawText = ocrText;
          extractionMethod = 'ocr_scanned_pdf';
        }
      } else {
        extractionMethod = 'native_text';
      }
    } else if (isDocx) {
      // 3. Word Document Extraction
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
      extractionMethod = 'native_text';
    } else if (isTxt) {
      // 4. Plain Text Extraction
      rawText = buffer.toString('utf-8');
      extractionMethod = 'native_text';
    } else {
      throw new ExtractionError(
        `Unsupported file format (.${ext || 'unknown'}). Supported formats are PDF, DOCX, TXT, PNG, and JPG/JPEG.`,
        415
      );
    }
  } catch (err: any) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      `Failed to process document (${err.message || 'Corrupted or unreadable format'}). Ensure file is not password-protected.`,
      422
    );
  }

  const cleanedText = sanitizeText(rawText);
  const wordCount = countWords(cleanedText);
  const charCount = cleanedText.length;

  // Only reject if both normal extraction AND OCR fail
  if (cleanedText.length === 0) {
    throw new ExtractionError(
      'No readable content could be extracted from this document or image. Please ensure the file is not blank, completely blurred, or corrupted.',
      422
    );
  }

  const detectedSections = detectSections(cleanedText);

  // Preserve document preview data URL for image files
  let previewDataUrl: string | undefined = undefined;
  if (isImage && buffer.length <= 15 * 1024 * 1024) {
    const effectiveMime = mimetype.startsWith('image/')
      ? mimetype
      : ext === 'png'
      ? 'image/png'
      : 'image/jpeg';
    previewDataUrl = `data:${effectiveMime};base64,${buffer.toString('base64')}`;
  }

  return {
    text: cleanedText,
    word_count: wordCount,
    char_count: charCount,
    detected_sections: detectedSections,
    extraction_method: extractionMethod,
    preserved_document: {
      mime_type: mimetype || (isImage ? 'image/png' : 'application/octet-stream'),
      original_name: originalName,
      preview_data_url: previewDataUrl,
    },
  };
}

/**
 * Cleans excessive blank lines, non-standard carriage returns, and control chars.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove non-printable ASCII
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Accurately counts words in sanitized text
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/);
  return words.length;
}

/**
 * Detects presence of standard resume headings
 */
export function detectSections(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  for (const marker of COMMON_SECTION_MARKERS) {
    const regex = new RegExp(`(^|\\n)\\s*${marker}\\b`, 'i');
    if (regex.test(lower)) {
      detected.push(marker);
    }
  }

  return detected;
}
