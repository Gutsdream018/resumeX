import { parseDocument, DocumentParserError, ParseOptions } from './documentParser.js';
import { parseStructuredResume } from './sectionParser.js';
import { StructuredResume } from '../../models/resume.types.js';

export interface ParsePipelineSuccess {
  status: 'success';
  rawText: string;
  documentType: string;
  wordCount: number;
  charCount: number;
  structuredResume: StructuredResume;
  preservedDocument?: {
    mimeType: string;
    originalName: string;
    previewDataUrl?: string;
  };
}

export interface ParsePipelineNeedsOcr {
  status: 'needs_ocr';
  message: string;
  documentType: 'scanned_pdf' | 'image';
}

export type ParsePipelineResult = ParsePipelineSuccess | ParsePipelineNeedsOcr;

/**
 * PHASE 1 — Resume Parser Pipeline
 *
 * File
 *  → Validation
 *  → Text Extraction (PDF, DOCX, TXT, OCR detection)
 *  → Section Detection
 *  → Structured Resume JSON
 */
export async function executeResumeParserPipeline(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
  options: ParseOptions = { allowOcr: false }
): Promise<ParsePipelineResult> {
  // Step 1: Validation & Text Extraction
  const parseResult = await parseDocument(buffer, mimetype, originalName, options);

  // Handle scanned/image PDF requiring OCR
  if (parseResult.needsOcr || (parseResult.documentType === 'scanned_pdf' && parseResult.text.trim().length === 0)) {
    return {
      status: 'needs_ocr',
      message: parseResult.message || 'This resume appears to be image-based and requires OCR.',
      documentType: parseResult.documentType as any,
    };
  }

  // Step 2 & 3: Section Detection & Structured Resume JSON
  const structuredResume = parseStructuredResume(parseResult.text);

  return {
    status: 'success',
    rawText: parseResult.text,
    documentType: parseResult.documentType,
    wordCount: parseResult.wordCount,
    charCount: parseResult.charCount,
    structuredResume,
    preservedDocument: parseResult.preservedDocument,
  };
}
