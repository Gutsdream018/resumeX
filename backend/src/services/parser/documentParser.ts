import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { performImageOcr, performPdfOcr, extractPdfNativeText } from '../ocrService.js';
import { sanitizeText, countWords } from '../../utils/textUtils.js';

export type DocumentType = 'text_pdf' | 'scanned_pdf' | 'docx' | 'text' | 'image';

export interface DocumentParseResult {
  text: string;
  wordCount: number;
  charCount: number;
  documentType: DocumentType;
  needsOcr?: boolean;
  message?: string;
  preservedDocument?: {
    mimeType: string;
    originalName: string;
    previewDataUrl?: string;
  };
}

export class DocumentParserError extends Error {
  constructor(message: string, public statusCode: number = 400, public code: string = 'PARSER_ERROR') {
    super(message);
    this.name = 'DocumentParserError';
  }
}

export interface ParseOptions {
  allowOcr?: boolean;
}

export async function parseDocument(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
  options: ParseOptions = { allowOcr: true }
): Promise<DocumentParseResult> {
  if (!buffer || buffer.length === 0) {
    throw new DocumentParserError('The uploaded file is empty.', 400, 'EMPTY_FILE');
  }

  const ext = (originalName.split('.').pop() || '').toLowerCase();
  const isImage = ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || mimetype.startsWith('image/');
  const isPdf = ext === 'pdf' || mimetype.includes('pdf');
  const isDocx =
    ext === 'docx' ||
    ext === 'doc' ||
    mimetype.includes('wordprocessingml') ||
    mimetype.includes('officedocument') ||
    mimetype.includes('msword');
  const isTxt = ext === 'txt' || mimetype.includes('text/plain');

  let rawText = '';
  let documentType: DocumentType = 'text';

  if (isImage) {
    documentType = 'image';
    if (!options.allowOcr) {
      return {
        text: '',
        wordCount: 0,
        charCount: 0,
        documentType: 'image',
        needsOcr: true,
        message: 'This resume appears to be image-based and requires OCR.',
      };
    }
    rawText = await performImageOcr(buffer);
  } else if (isPdf) {
    let primarySucceeded = false;
    let primaryError: any = null;
    let fallbackError: any = null;

    try {
      rawText = await extractPdfNativeText(buffer);
      primarySucceeded = true;
    } catch (err: any) {
      primaryError = err;
      rawText = '';
    }

    if (sanitizeText(rawText).length < 20) {
      try {
        const pdfData = await pdfParse(buffer);
        if (pdfData.text && sanitizeText(pdfData.text).length >= 20) {
          rawText = pdfData.text;
        }
      } catch (err: any) {
        fallbackError = err;
      }
    }

    // If both primary and fallback failed to read the document structure and text is empty, reject as corrupted
    if (!primarySucceeded && fallbackError && sanitizeText(rawText).length < 5) {
      throw new DocumentParserError(
        `Failed to parse PDF document: ${primaryError?.message || fallbackError?.message || 'Corrupted or unreadable format'}.`,
        422,
        'CORRUPTED_PDF'
      );
    }

    const cleanLength = sanitizeText(rawText).length;

    // If native text is insufficient, it is a scanned / image-only PDF
    if (cleanLength < 20) {
      documentType = 'scanned_pdf';
      if (!options.allowOcr) {
        return {
          text: '',
          wordCount: 0,
          charCount: 0,
          documentType: 'scanned_pdf',
          needsOcr: true,
          message: 'This resume appears to be image-based and requires OCR.',
        };
      }
      // Perform PDF OCR
      const ocrText = await performPdfOcr(buffer);
      if (ocrText && ocrText.trim().length > 0) {
        rawText = ocrText;
      }
    } else {
      documentType = 'text_pdf';
    }
  } else if (isDocx) {
    documentType = 'docx';
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } catch (err: any) {
      throw new DocumentParserError(`Failed to parse Word document: ${err.message}`, 422, 'DOCX_PARSE_FAILED');
    }
  } else if (isTxt) {
    documentType = 'text';
    rawText = buffer.toString('utf-8');
  } else {
    throw new DocumentParserError(
      `Unsupported file format (.${ext || 'unknown'}). Supported formats are PDF, DOCX, TXT, PNG, and JPG.`,
      415,
      'UNSUPPORTED_FORMAT'
    );
  }

  const cleaned = sanitizeText(rawText);
  if (cleaned.length === 0) {
    if (documentType === 'scanned_pdf' || documentType === 'image') {
      return {
        text: '',
        wordCount: 0,
        charCount: 0,
        documentType,
        needsOcr: true,
        message: 'This resume appears to be image-based and requires OCR.',
      };
    }
    throw new DocumentParserError(
      'No readable content could be extracted from this document. Please ensure the file is not blank or corrupted.',
      422,
      'EMPTY_CONTENT'
    );
  }

  // Preserve image preview if applicable
  let previewDataUrl: string | undefined = undefined;
  if (isImage && buffer.length <= 15 * 1024 * 1024) {
    const effectiveMime = mimetype.startsWith('image/') ? mimetype : ext === 'png' ? 'image/png' : 'image/jpeg';
    previewDataUrl = `data:${effectiveMime};base64,${buffer.toString('base64')}`;
  }

  return {
    text: cleaned,
    wordCount: countWords(cleaned),
    charCount: cleaned.length,
    documentType,
    preservedDocument: {
      mimeType: mimetype,
      originalName,
      previewDataUrl,
    },
  };
}
