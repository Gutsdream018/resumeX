export interface FileValidationConfig {
  maxSizeBytes?: number;
  allowedExtensions?: Set<string>;
}

export const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  maxSizeBytes: 15 * 1024 * 1024, // 15MB
  allowedExtensions: new Set(['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp']),
};

export class IngestionValidationError extends Error {
  constructor(
    message: string,
    public status: string = 'unsupported_format',
    public statusCode: number = 415,
    public details?: any
  ) {
    super(message);
    this.name = 'IngestionValidationError';
  }
}

export interface ValidatedFileInfo {
  detectedExt: 'pdf' | 'docx' | 'png' | 'jpg' | 'webp';
  mimeType: string;
  sizeBytes: number;
  isValid: boolean;
  signature: string;
}

/**
 * Validates file signature (magic bytes) to ensure the file is what it claims to be,
 * preventing renamed executables or corrupted payloads from reaching parsers.
 */
export function validateFileSignature(
  buffer: Buffer,
  originalName: string,
  mimetype?: string,
  config: FileValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidatedFileInfo {
  if (!buffer || buffer.length === 0) {
    throw new IngestionValidationError(
      'The uploaded file is completely empty (0 bytes).',
      'empty_document',
      422
    );
  }

  const maxBytes = config.maxSizeBytes || 15 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new IngestionValidationError(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${(maxBytes / (1024 * 1024)).toFixed(0)}MB.`,
      'invalid_file',
      413
    );
  }

  const claimedExt = (originalName.split('.').pop() || '').toLowerCase();
  const allowed = config.allowedExtensions || DEFAULT_VALIDATION_CONFIG.allowedExtensions!;

  if (!allowed.has(claimedExt)) {
    throw new IngestionValidationError(
      'Please upload your resume as PDF, DOCX, PNG, JPG, JPEG, or WEBP.',
      'unsupported_format',
      415
    );
  }

  // 1. PDF Magic Bytes: %PDF (0x25 0x50 0x44 0x46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return {
      detectedExt: 'pdf',
      mimeType: 'application/pdf',
      sizeBytes: buffer.length,
      isValid: true,
      signature: 'PDF',
    };
  }

  // 2. PNG Magic Bytes: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      detectedExt: 'png',
      mimeType: 'image/png',
      sizeBytes: buffer.length,
      isValid: true,
      signature: 'PNG',
    };
  }

  // 3. JPEG Magic Bytes: 0xFF 0xD8 0xFF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      detectedExt: 'jpg',
      mimeType: 'image/jpeg',
      sizeBytes: buffer.length,
      isValid: true,
      signature: 'JPEG',
    };
  }

  // 4. WEBP Magic Bytes: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 && // RIFF
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50 // WEBP
  ) {
    return {
      detectedExt: 'webp',
      mimeType: 'image/webp',
      sizeBytes: buffer.length,
      isValid: true,
      signature: 'WEBP',
    };
  }

  // 5. DOCX Magic Bytes: PK\x03\x04 (0x50 0x4B 0x03 0x04)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    // Verify it contains word/ or [Content_Types].xml to distinguish from random zip files
    const sample = buffer.subarray(0, Math.min(buffer.length, 4000)).toString('binary');
    const isDocxZip =
      sample.includes('word/') ||
      sample.includes('[Content_Types].xml') ||
      claimedExt === 'docx' ||
      claimedExt === 'doc';

    if (isDocxZip) {
      return {
        detectedExt: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: buffer.length,
        isValid: true,
        signature: 'DOCX_ZIP',
      };
    }
  }

  // If buffer doesn't match any known signature:
  throw new IngestionValidationError(
    `The file format could not be verified by its signature. Expected a valid PDF, DOCX, PNG, JPG, or WEBP document.`,
    'corrupted_file',
    422,
    { claimedExt, mimetype }
  );
}
