import { z } from 'zod';

export type DocumentType = 'TEXT_PDF' | 'SCANNED_PDF' | 'IMAGE_RESUME' | 'DOCX' | 'UNKNOWN';

export type ExtractionMethod = 'pdf_text' | 'ocr' | 'docx_structure' | 'ai_validation' | 'native_text';

export type IngestionErrorStatus =
  | 'INVALID_FILE'
  | 'UNSUPPORTED_FORMAT'
  | 'CORRUPTED_FILE'
  | 'PDF_NO_TEXT'
  | 'OCR_REQUIRED'
  | 'OCR_LOW_CONFIDENCE'
  | 'EMPTY_DOCUMENT'
  | 'NOT_A_RESUME'
  | 'EXTRACTION_FAILED'
  | 'STRUCTURE_RECOGNITION_FAILED'
  | 'AI_VALIDATION_FAILED';

export interface LayoutBlock {
  text: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  isBold?: boolean;
  column?: number;
}

export interface FieldSource {
  page?: number;
  method: ExtractionMethod;
  confidence?: number;
}

export interface ContactInfo {
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

export interface NormalizedDate {
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  rawText?: string;
}

export interface ExperienceEntry {
  company: string | null;
  title: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
  bullets: string[];
  technologies: string[];
  source?: FieldSource;
}

export interface ProjectEntry {
  name: string | null;
  description: string | null;
  technologies: string[];
  role?: string | null;
  outcomes?: string[];
  links?: string[];
  bullets: string[];
  source?: FieldSource;
}

export interface EducationEntry {
  degree: string | null;
  institution: string | null;
  fieldOfStudy?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  graduationDate?: string | null;
  gpa?: string | null;
  honors?: string[];
  bullets?: string[];
  source?: FieldSource;
}

export interface CategorizedSkills {
  technical: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  domain: string[];
  soft: string[];
}

export interface CertificationEntry {
  name: string;
  issuer?: string | null;
  date?: string | null;
  url?: string | null;
}

export interface AchievementEntry {
  title: string;
  description: string;
  metric?: string | null;
  date?: string | null;
}

export interface PublicationEntry {
  title: string;
  publisher?: string | null;
  date?: string | null;
  url?: string | null;
}

export interface LeadershipEntry {
  role: string;
  organization?: string | null;
  description?: string | null;
  period?: string | null;
}

export interface VolunteeringEntry {
  organization: string;
  role?: string | null;
  description?: string | null;
  period?: string | null;
}

export interface CanonicalResume {
  document: {
    type: DocumentType;
    pageCount: number;
    language: string;
    extractionConfidence: number;
  };
  contact: ContactInfo;
  summary: string | null;
  experience: ExperienceEntry[];
  internships: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: CategorizedSkills;
  education: EducationEntry[];
  certifications: CertificationEntry[];
  achievements: AchievementEntry[];
  publications: PublicationEntry[];
  leadership: LeadershipEntry[];
  volunteering: VolunteeringEntry[];
  languages: string[];
  other: string[];
}

export interface RecognitionConfidence {
  document: number;
  extraction: number;
  structure: number;
  ocr: number | null;
  overall: number;
}

export interface ExtractionValidationResult {
  isResume: boolean;
  confidence: number;
  warnings: string[];
  reasons: string[];
  signals: {
    hasName: boolean;
    hasContact: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    wordCount: number;
    charCount: number;
    sectionCount: number;
  };
}

export interface IngestionResult {
  status: 'recognized';
  document: {
    type: DocumentType;
    pageCount: number;
    mimeType: string;
    originalName: string;
    previewDataUrl?: string;
  };
  recognition: {
    isResume: boolean;
    confidence: number;
    extractionMethod: ExtractionMethod;
    scores: RecognitionConfidence;
  };
  resume: CanonicalResume;
  rawText: string;
  layoutBlocks?: LayoutBlock[];
  validation: ExtractionValidationResult;
  warnings: string[];
}
