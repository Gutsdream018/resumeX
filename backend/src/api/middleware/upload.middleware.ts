import multer from 'multer';
import { Request } from 'express';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit (low-cost / free-tier optimized)

const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'sh', 'cmd', 'bin', 'dll', 'so', 'zip', 'tar', 'gz', '7z', 'rar', 'iso', 'js', 'py', 'php'
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
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

    if (BLOCKED_EXTENSIONS.has(ext)) {
      return cb(new Error('Executable and archive files are strictly prohibited.'));
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error('Please upload your resume as PDF, DOCX, PNG, JPG, JPEG, or WEBP.')
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && file.mimetype !== 'application/octet-stream') {
      return cb(
        new Error('Invalid document format. Please upload PDF, DOCX, or supported images.')
      );
    }

    cb(null, true);
  },
});
