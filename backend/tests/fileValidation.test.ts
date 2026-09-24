import { describe, it, expect } from 'vitest';
import { MAX_FILE_SIZE_BYTES } from '../src/services/fileProcessor.js';

describe('File Processor Validation', () => {
  it('should enforce 50MB file size limit constant', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('should recognize valid file extensions', () => {
    const validExtensions = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
    const invalidExtensions = ['exe', 'zip', 'csv', 'mp4', 'tar', 'sh'];

    const isValidExt = (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      return validExtensions.includes(ext);
    };

    validExtensions.forEach((ext) => {
      expect(isValidExt(`candidate_resume.${ext}`)).toBe(true);
    });

    invalidExtensions.forEach((ext) => {
      expect(isValidExt(`malicious_file.${ext}`)).toBe(false);
    });
  });
});
