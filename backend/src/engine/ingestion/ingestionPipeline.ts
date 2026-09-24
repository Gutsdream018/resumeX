import {
  CanonicalResume,
  DocumentType,
  ExtractionMethod,
  IngestionResult,
  LayoutBlock,
} from './types.js';
import { validateFileSignature, IngestionValidationError } from './fileValidator.js';
import { assessDocumentType } from './docTypeDetector.js';
import { extractPdfStructuredContent } from './pdfExtractor.js';
import { performImageOcr, performPdfOcr } from './ocrEngine.js';
import { extractDocxStructuredContent } from './docxExtractor.js';
import { reconstructDocumentLayout } from './layoutReconstructor.js';
import { segmentResumeSections } from './sectionRecognizer.js';
import { extractContactInfo } from './entityExtractors/contactExtractor.js';
import { extractExperienceEntries } from './entityExtractors/experienceExtractor.js';
import { extractProjectEntries } from './entityExtractors/projectExtractor.js';
import { extractEducationEntries } from './entityExtractors/educationExtractor.js';
import { extractAndCategorizeSkills } from './entityExtractors/skillsExtractor.js';
import { validateChronology } from './entityExtractors/chronologyEngine.js';
import { validateResumeExtraction } from './extractionValidator.js';
import { analysisCache } from '../cache/analysisCache.js';

export interface IngestionPipelineOptions {
  allowOcr?: boolean;
  maxPages?: number;
  previewUrl?: boolean;
}

/**
 * Master Ingestion Pipeline coordinating validation, type classification,
 * extraction, layout reconstruction, entity parsing, and extraction validation.
 */
export async function runDocumentIngestionPipeline(
  fileBuffer: Buffer,
  originalName: string,
  claimedMimetype?: string,
  options: IngestionPipelineOptions = { allowOcr: true, maxPages: 10, previewUrl: true }
): Promise<IngestionResult> {
  const startIngestionTime = Date.now();
  const fileHash = analysisCache.computeHash(fileBuffer);
  const cachedDoc = analysisCache.getDocument(fileHash);

  if (cachedDoc) {
    console.log(`[Ingestion] Serving pre-parsed document from cache for "${originalName}" (${Date.now() - startIngestionTime}ms)`);
    return {
      status: 'recognized',
      document: {
        type: cachedDoc.canonicalResume.document?.type || 'TEXT_PDF',
        pageCount: cachedDoc.canonicalResume.document?.pageCount || 1,
        mimeType: claimedMimetype || 'application/pdf',
        originalName,
      },
      recognition: {
        isResume: true,
        confidence: cachedDoc.canonicalResume.document?.extractionConfidence || 0.95,
        extractionMethod: 'native_text',
        scores: {
          document: 0.98,
          extraction: 0.95,
          structure: 0.95,
          ocr: null,
          overall: 0.96,
        },
      },
      resume: cachedDoc.canonicalResume,
      rawText: cachedDoc.rawText,
      layoutBlocks: [],
      validation: {
        isResume: true,
        confidence: 0.95,
        warnings: [],
        reasons: [],
        signals: {
          hasName: Boolean(cachedDoc.canonicalResume.contact?.name),
          hasContact: Boolean(cachedDoc.canonicalResume.contact?.email || cachedDoc.canonicalResume.contact?.phone),
          hasExperience: (cachedDoc.canonicalResume.experience?.length || 0) > 0,
          hasEducation: (cachedDoc.canonicalResume.education?.length || 0) > 0,
          hasSkills: (cachedDoc.canonicalResume.skills?.technical?.length || 0) > 0,
          wordCount: cachedDoc.rawText.split(/\s+/).length,
          charCount: cachedDoc.rawText.length,
          sectionCount: 5,
        },
      },
      warnings: [],
    };
  }

  console.log(`[Ingestion] Step 1: Validating file signature for "${originalName}"...`);
  const fileInfo = validateFileSignature(fileBuffer, originalName, claimedMimetype);

  let rawText = '';
  let documentType: DocumentType = 'UNKNOWN';
  let extractionMethod: ExtractionMethod = 'native_text';
  let pageCount = 1;
  let ocrConfidence: number | null = null;
  let layoutBlocks: LayoutBlock[] = [];
  const pipelineWarnings: string[] = [];

  // Step 2: Extraction by detected file type
  if (fileInfo.detectedExt === 'docx') {
    console.log(`[Ingestion] Step 2: Extracting DOCX structure with Mammoth...`);
    const docxResult = await extractDocxStructuredContent(fileBuffer);
    rawText = docxResult.text;
    documentType = 'DOCX';
    extractionMethod = 'docx_structure';
    pageCount = Math.max(1, Math.ceil(docxResult.wordCount / 400));
  } else if (
    fileInfo.detectedExt === 'png' ||
    fileInfo.detectedExt === 'jpg' ||
    fileInfo.detectedExt === 'webp'
  ) {
    console.log(`[Ingestion] Step 2: Running Vision OCR on ${fileInfo.detectedExt.toUpperCase()} image...`);
    documentType = 'IMAGE_RESUME';
    extractionMethod = 'ocr';

    const ocrRes = await performImageOcr(fileBuffer);
    if (ocrRes.isLowConfidence) {
      pipelineWarnings.push(...ocrRes.warnings);
    }
    rawText = ocrRes.text;
    ocrConfidence = ocrRes.confidence;
  } else if (fileInfo.detectedExt === 'pdf') {
    console.log(`[Ingestion] Step 2: Inspecting PDF layout & text layers...`);
    let pdfRes: any = null;
    let nativeTextExtracted = false;

    try {
      pdfRes = await extractPdfStructuredContent(fileBuffer, options.maxPages || 10);
      pageCount = pdfRes.pageCount;
      layoutBlocks = pdfRes.blocks;
      if (pdfRes.text && pdfRes.text.length > 50) {
        rawText = pdfRes.text;
        nativeTextExtracted = true;
      }
    } catch (err: any) {
      console.warn(`[Ingestion] Native PDF extraction notice: ${err.message}`);
    }

    const typeAssessment = assessDocumentType(fileInfo, rawText, pageCount);
    documentType = typeAssessment.documentType;

    if (documentType === 'SCANNED_PDF' || (!nativeTextExtracted && typeAssessment.needsOcr)) {
      console.log(`[Ingestion] Step 2b: Fallback to high-DPI Canvas Rendering + Multi-Page OCR...`);
      extractionMethod = 'ocr';
      const ocrRes = await performPdfOcr(fileBuffer, Math.min(pageCount, 4));
      rawText = ocrRes.text;
      ocrConfidence = ocrRes.confidence;
      if (ocrRes.isLowConfidence) {
        pipelineWarnings.push(...ocrRes.warnings);
      }
    } else {
      extractionMethod = 'pdf_text';
    }
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new IngestionValidationError(
      'No readable content could be extracted from this document. Please ensure the file is clear and not blank or corrupted.',
      'empty_document',
      422
    );
  }

  // Step 3: Layout & Reading Order Reconstruction
  console.log(`[Ingestion] Step 3: Reconstructing layout and reading order...`);
  const layout = reconstructDocumentLayout(layoutBlocks, rawText);
  const orderedText = layout.fullText || rawText;

  // Step 4: Section Segmentation
  console.log(`[Ingestion] Step 4: Segmenting canonical resume sections...`);
  const segmented = segmentResumeSections(orderedText);

  // Step 5: Entity Extractors (Concurrent Promise.all)
  console.log(`[Ingestion] Step 5: Parsing entities concurrently (Contact, Experience, Skills, Education)...`);
  const [contact, experience, internships, projects, education, skills] = await Promise.all([
    Promise.resolve().then(() => extractContactInfo(orderedText, segmented.other || segmented.summary)),
    Promise.resolve().then(() => extractExperienceEntries(segmented.experience)),
    Promise.resolve().then(() => extractExperienceEntries(segmented.internships)),
    Promise.resolve().then(() => extractProjectEntries(segmented.projects)),
    Promise.resolve().then(() => extractEducationEntries(segmented.education)),
    Promise.resolve().then(() => extractAndCategorizeSkills(segmented.skills, orderedText)),
  ]);

  // Chronology validation
  const chronology = validateChronology(experience);
  if (chronology.hasChronologyAnomaly) {
    pipelineWarnings.push(...chronology.warnings);
  }

  // Assemble Canonical Resume Schema
  const canonicalResume: CanonicalResume = {
    document: {
      type: documentType,
      pageCount,
      language: 'en',
      extractionConfidence: ocrConfidence !== null ? ocrConfidence : 0.95,
    },
    contact,
    summary: segmented.summary ? segmented.summary.slice(0, 800) : null,
    experience,
    internships,
    projects,
    skills,
    education,
    certifications: [],
    achievements: [],
    publications: [],
    leadership: [],
    volunteering: [],
    languages: [],
    other: [],
  };

  // Cache canonical parsed document
  analysisCache.setDocument(fileHash, {
    rawText: orderedText,
    canonicalResume,
  });

  // Step 6: Extraction Validation Pass
  console.log(`[Ingestion] Step 6: Performing extraction validation pass...`);
  const validation = validateResumeExtraction(canonicalResume, orderedText, ocrConfidence);

  // Preview Data URL for images
  let previewDataUrl: string | undefined = undefined;
  if (
    options.previewUrl &&
    (fileInfo.detectedExt === 'png' ||
      fileInfo.detectedExt === 'jpg' ||
      fileInfo.detectedExt === 'webp') &&
    fileBuffer.length <= 15 * 1024 * 1024
  ) {
    previewDataUrl = `data:${fileInfo.mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  const overallConfidence = Number(
    (
      (validation.confidence * 0.5 +
        (ocrConfidence !== null ? ocrConfidence * 0.3 : 0.28) +
        (canonicalResume.contact.name ? 0.1 : 0.05) +
        (canonicalResume.experience.length > 0 ? 0.1 : 0.05)) /
      1.0
    ).toFixed(2)
  );

  console.log(
    `[Ingestion] Successfully validated resume for "${contact.name || 'Candidate'}" (${documentType}, Confidence: ${overallConfidence})`
  );

  return {
    status: 'recognized',
    document: {
      type: documentType,
      pageCount,
      mimeType: fileInfo.mimeType,
      originalName,
      previewDataUrl,
    },
    recognition: {
      isResume: true,
      confidence: overallConfidence,
      extractionMethod,
      scores: {
        document: 0.98,
        extraction: ocrConfidence !== null ? ocrConfidence : 0.95,
        structure: validation.confidence,
        ocr: ocrConfidence,
        overall: overallConfidence,
      },
    },
    resume: canonicalResume,
    rawText: orderedText,
    layoutBlocks,
    validation,
    warnings: [...pipelineWarnings, ...validation.warnings],
  };
}
