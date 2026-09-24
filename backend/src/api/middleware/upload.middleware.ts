import multer from 'multer';
import { Request } from 'express';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/octet-stream',
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const originalName = file.originalname || '';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          'Please upload your resume as PDF, DOCX, PNG, JPG, JPEG, or WEBP.'
        )
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          'Please upload your resume as PDF, DOCX, PNG, JPG, JPEG, or WEBP.'
        )
      );
    }

    cb(null, true);
  },
});
