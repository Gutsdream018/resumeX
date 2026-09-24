import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DocumentParserError } from '../../services/parser/documentParser.js';
import { IngestionValidationError } from '../../engine/ingestion/fileValidator.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Resume Engine Error]:', err.message || err);

  if (err instanceof IngestionValidationError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err.message,
      code: err.status.toUpperCase(),
      details: err.details,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'invalid_file',
        message: 'File size exceeds the 15MB limit. Please upload a smaller resume.',
        error: 'File size exceeds the 15MB limit. Please upload a smaller resume.',
        code: 'LIMIT_FILE_SIZE',
      });
    }
    return res.status(400).json({
      status: 'invalid_file',
      message: `File upload error: ${err.message}`,
      error: `File upload error: ${err.message}`,
      code: 'UPLOAD_ERROR',
    });
  }

  if (err instanceof DocumentParserError) {
    return res.status(err.statusCode).json({
      status: err.code.toLowerCase(),
      message: err.message,
      error: err.message,
      code: err.code,
    });
  }

  if (
    err.message &&
    (err.message.includes('Please upload your resume as') ||
      err.message.includes('Unsupported file extension') ||
      err.message.includes('Invalid file format'))
  ) {
    return res.status(415).json({
      status: 'unsupported_format',
      message: 'Please upload your resume as PDF, DOCX, PNG, JPG, JPEG, or WEBP.',
      error: 'Please upload your resume as PDF, DOCX, PNG, JPG, JPEG, or WEBP.',
      code: 'UNSUPPORTED_FORMAT',
    });
  }

  const statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  const userMessage =
    statusCode < 500
      ? err.message
      : 'An unexpected error occurred during resume processing. Please verify document format and try again.';

  return res.status(statusCode).json({
    status: 'internal_error',
    message: userMessage,
    error: userMessage,
    code: err.code || 'INTERNAL_ERROR',
  });
}
