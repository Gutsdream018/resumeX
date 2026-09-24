import multer from 'multer';
import { Request } from 'express';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/octet-stream', // sometimes sent for text files by certain clients
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg', 'webp']);

export const uploadMiddleware = multer({
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
          `Unsupported file extension (.${ext}). Accepted formats are .pdf, .docx, .txt, .png, and .jpg/.jpeg.`
        )
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          `Invalid file format (${file.mimetype}). Please upload a valid document (PDF, DOCX, TXT) or image (PNG, JPG).`
        )
      );
    }

    cb(null, true);
  },
});
