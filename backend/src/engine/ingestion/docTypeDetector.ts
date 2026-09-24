import { DocumentType } from './types.js';
import { ValidatedFileInfo } from './fileValidator.js';

export interface DocTypeAssessment {
  documentType: DocumentType;
  usableTextRatio: number;
  wordCount: number;
  charCount: number;
  alphabeticRatio: number;
  isImageBased: boolean;
  needsOcr: boolean;
  confidence: number;
  reason: string;
}

/**
 * Assesses the extracted text and document structure to determine whether a document is
 * a Native Text PDF, a Scanned PDF (image-heavy), an Image Resume, or DOCX.
 */
export function assessDocumentType(
  fileInfo: ValidatedFileInfo,
  extractedSampleText: string,
  pageCount: number = 1
): DocTypeAssessment {
  const { detectedExt } = fileInfo;

  if (detectedExt === 'docx') {
    return {
      documentType: 'DOCX',
      usableTextRatio: 1.0,
      wordCount: countWords(extractedSampleText),
      charCount: extractedSampleText.length,
      alphabeticRatio: calculateAlphabeticRatio(extractedSampleText),
      isImageBased: false,
      needsOcr: false,
      confidence: 0.98,
      reason: 'Standard Word DOCX document with structured markup.',
    };
  }

  if (detectedExt === 'png' || detectedExt === 'jpg' || detectedExt === 'webp') {
    return {
      documentType: 'IMAGE_RESUME',
      usableTextRatio: 0.0,
      wordCount: 0,
      charCount: 0,
      alphabeticRatio: 0.0,
      isImageBased: true,
      needsOcr: true,
      confidence: 0.95,
      reason: `Direct image upload (${detectedExt.toUpperCase()}) requiring optical character recognition.`,
    };
  }

  if (detectedExt === 'pdf') {
    const rawLen = extractedSampleText.length;
    const cleanText = extractedSampleText.replace(/\s+/g, ' ').trim();
    const wordCount = countWords(cleanText);
    const alphaRatio = calculateAlphabeticRatio(cleanText);

    // Heuristics to evaluate if PDF has a usable text layer:
    // 1. Min character threshold: > 120 chars for a 1-page resume
    // 2. Min word threshold: > 25 meaningful words
    // 3. Alphabetic ratio: > 0.55 (to filter out random font encoding noise)
    const hasSufficientChars = rawLen >= Math.max(120, pageCount * 100);
    const hasSufficientWords = wordCount >= Math.max(25, pageCount * 20);
    const hasGoodAlphaRatio = alphaRatio >= 0.55;

    if (hasSufficientChars && hasSufficientWords && hasGoodAlphaRatio) {
      return {
        documentType: 'TEXT_PDF',
        usableTextRatio: Math.min(1.0, alphaRatio),
        wordCount,
        charCount: rawLen,
        alphabeticRatio: alphaRatio,
        isImageBased: false,
        needsOcr: false,
        confidence: 0.95,
        reason: 'Native text layer present with coherent typography and high character density.',
      };
    } else {
      return {
        documentType: 'SCANNED_PDF',
        usableTextRatio: alphaRatio,
        wordCount,
        charCount: rawLen,
        alphabeticRatio: alphaRatio,
        isImageBased: true,
        needsOcr: true,
        confidence: 0.9,
        reason:
          rawLen < 50
            ? 'PDF contains minimal or no embedded text; detected as scanned/image-based PDF.'
            : 'PDF embedded text layer has low density or corrupted glyph mappings; fallback to OCR required.',
      };
    }
  }

  return {
    documentType: 'UNKNOWN',
    usableTextRatio: 0.0,
    wordCount: 0,
    charCount: 0,
    alphabeticRatio: 0.0,
    isImageBased: false,
    needsOcr: false,
    confidence: 0.3,
    reason: 'Unrecognized document type.',
  };
}

function countWords(str: string): number {
  if (!str) return 0;
  const matches = str.match(/[a-zA-Z0-9_\-\u00C0-\u017F]+/g);
  return matches ? matches.length : 0;
}

function calculateAlphabeticRatio(str: string): number {
  if (!str || str.length === 0) return 0;
  const alphaMatches = str.match(/[a-zA-Z\u00C0-\u017F]/g);
  return alphaMatches ? alphaMatches.length / str.length : 0;
}
