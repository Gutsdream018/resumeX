import { parseStructuredResume } from '../services/parser/sectionParser.js';
import { analyzeContactInfo } from './analyzers/contactAnalyzer.js';
import { analyzeDocumentSections } from './analyzers/sectionAnalyzer.js';
import { analyzeDocumentFormatting } from './analyzers/formattingAnalyzer.js';
import { analyzeAtsReadability } from './analyzers/atsReadabilityAnalyzer.js';
import { analyzeKeywords } from './analyzers/keywordAnalyzer.js';
import { analyzeExperienceEntries } from './analyzers/experienceAnalyzer.js';
import { analyzeProjects } from './analyzers/projectAnalyzer.js';
import { analyzeEducation } from './analyzers/educationAnalyzer.js';
import { analyzeAchievements } from './analyzers/achievementAnalyzer.js';
import { runMuseSemanticAnalysis } from './ai/museAnalyzer.js';
import { calculateComprehensiveAtsScores } from './scoring/scoreEngine.js';
import { generateActionableRecommendations } from './recommendations/recommendationEngine.js';
import { executeJobMatch } from '../services/ats/jobMatchService.js';
import { countWords } from '../utils/textUtils.js';
import { runCritiqueEngine } from './critique/critiqueEngine.js';
import { runDiagnosticEngine } from './diagnostic/diagnosticEngine.js';
import { CanonicalResume } from './ingestion/types.js';
import {
  ComprehensiveAnalysisResult,
  CareerLevel,
} from './schemas/analysisSchema.js';
import { CategoryScores, StructuredResume } from '../models/resume.types.js';
import { analysisCache } from './cache/analysisCache.js';

export interface PipelineExecutionOptions {
  resumeId: string;
  fileType?: string;
  extractionMethod?: 'native_text' | 'ocr_image' | 'ocr_scanned_pdf';
  preservedDocument?: {
    mime_type: string;
    original_name?: string;
    preview_data_url?: string;
  };
  jobDescription?: string;
  careerLevel?: CareerLevel;
  canonicalResume?: CanonicalResume;
}

function convertStructuredToCanonical(structured: StructuredResume, rawText: string): CanonicalResume {
  return {
    document: {
      type: 'TEXT_PDF',
      pageCount: 1,
      language: 'en',
      extractionConfidence: 0.95,
    },
    contact: {
      name: structured.contact.name || null,
      title: null,
      email: structured.contact.email || null,
      phone: structured.contact.phone || null,
      location: null,
      linkedin: structured.contact.linkedin || null,
      github: structured.contact.github || null,
      portfolio: null,
    },
    summary: structured.summary || null,
    experience: (structured.experience || []).map((e) => ({
      company: e.company || null,
      title: e.role || null,
      location: e.location || null,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      isCurrent: /present|current/i.test(e.endDate || ''),
      bullets: e.bullets || [],
      technologies: [],
    })),
    internships: [],
    projects: (structured.projects || []).map((p) => ({
      name: p.name || null,
      description: p.description || null,
      technologies: p.technologies || [],
      bullets: p.bullets || [],
    })),
    skills: {
      technical: structured.skills?.technical || [],
      frameworks: [],
      databases: [],
      tools: structured.skills?.tools || [],
      domain: [],
      soft: structured.skills?.soft || [],
    },
    education: (structured.education || []).map((edu) => ({
      degree: edu.degree || null,
      institution: edu.institution || null,
      graduationDate: edu.graduationDate || null,
      gpa: edu.gpa || null,
    })),
    certifications: (structured.certifications || []).map((c) => ({ name: c })),
    achievements: (structured.achievements || []).map((a) => ({ title: a, description: a })),
    publications: [],
    leadership: [],
    volunteering: [],
    languages: structured.skills?.languages || [],
    other: structured.other || [],
  };
}

export async function runComprehensiveAtsPipeline(
  rawText: string,
  options: PipelineExecutionOptions
): Promise<ComprehensiveAnalysisResult & { performance?: any }> {
  const startPipelineTime = Date.now();
  console.log('[ATS] High-performance pipeline initiated for resumeId:', options.resumeId);

  // 1. Structure Extraction & Normalization
  const tParsingStart = Date.now();
  const structuredResume = parseStructuredResume(rawText);
  const canonicalResume = options.canonicalResume || convertStructuredToCanonical(structuredResume, rawText);
  const parsingMs = Date.now() - tParsingStart;

  // Check Deterministic & Full Analysis Cache
  const resumeHash = analysisCache.computeHash(rawText);
  const jobHash = options.jobDescription ? analysisCache.computeHash(options.jobDescription) : 'none';
  const cachedAnalysis = analysisCache.getDeterministicAnalysis(resumeHash, jobHash);
  if (cachedAnalysis) {
    console.log(`[ATS] Full pipeline completed via instant cache in ${Date.now() - startPipelineTime}ms.`);
    return {
      ...cachedAnalysis,
      resumeId: options.resumeId,
      performance: {
        cacheHit: true,
        elapsedMs: Date.now() - startPipelineTime,
      },
    };
  }

  // 2. Career Level Detection (Contextual Adaptation)
  let detectedLevel: CareerLevel = options.careerLevel || 'mid';
  if (!options.careerLevel) {
    const isStudent = /student|undergraduate|intern\b/i.test(rawText) && structuredResume.experience.length <= 1;
    const isSenior = /(?:senior|staff|lead|principal|director|head\s+of|architect)\b/i.test(rawText);
    const isExecutive = /(?:vp|vice\s+president|cto|cio|ciso|executive)\b/i.test(rawText);

    if (isExecutive) detectedLevel = 'executive';
    else if (isSenior) detectedLevel = 'senior';
    else if (isStudent) detectedLevel = 'student';
    else if (structuredResume.experience.length === 0) detectedLevel = 'entry';
  }

  // 3. Independent Deterministic Analyzers (PARALLEL EXECUTION via Promise.all)
  const tDeterministicStart = Date.now();
  const [
    contactResult,
    sectionResult,
    formattingResult,
    keywordResult,
    experienceResult,
    projectResult,
    educationResult,
    achievementResult,
    jobMatchResult,
    critiqueOutput,
  ] = await Promise.all([
    Promise.resolve().then(() => analyzeContactInfo(structuredResume.contact, rawText)),
    Promise.resolve().then(() => analyzeDocumentSections(structuredResume, rawText, detectedLevel)),
    Promise.resolve().then(() => analyzeDocumentFormatting(rawText)),
    Promise.resolve().then(() => analyzeKeywords(rawText, options.jobDescription)),
    Promise.resolve().then(() => analyzeExperienceEntries(structuredResume.experience, rawText, detectedLevel)),
    Promise.resolve().then(() => analyzeProjects(structuredResume.projects, rawText, detectedLevel, structuredResume.experience.length)),
    Promise.resolve().then(() => analyzeEducation(structuredResume.education, rawText)),
    Promise.resolve().then(() => analyzeAchievements(rawText, structuredResume.certifications.length, structuredResume.achievements.length)),
    options.jobDescription && options.jobDescription.trim().length > 0
      ? Promise.resolve().then(() => executeJobMatch(rawText, options.jobDescription!, structuredResume))
      : Promise.resolve(null),
    Promise.resolve().then(() => runCritiqueEngine(canonicalResume)),
  ]);

  const readabilityResult = analyzeAtsReadability(contactResult, sectionResult, formattingResult, rawText);
  const deterministicMs = Date.now() - tDeterministicStart;

  // 4. Baseline Scores for NVIDIA Muse Pass
  const baselineScores = {
    overall: Math.round((readabilityResult.score + keywordResult.keywordScore + experienceResult.score) / 3),
    ats: readabilityResult.score,
    experience: experienceResult.score,
  };

  // 5. NVIDIA Muse Glimmer 30B Semantic Analysis Pass
  const tMuseStart = Date.now();
  const museResult = await runMuseSemanticAnalysis(structuredResume, rawText, baselineScores, options.jobDescription);
  const museMs = Date.now() - tMuseStart;

  // 6. Comprehensive Hybrid Scoring Engine & Actionable Recommendations (Parallel synthesis)
  const tScoringStart = Date.now();
  const scoringOutput = calculateComprehensiveAtsScores(
    {
      readability: readabilityResult,
      keywords: keywordResult,
      experience: experienceResult,
      projects: projectResult,
      formatting: formattingResult,
      education: educationResult,
      achievements: achievementResult,
      sections: sectionResult,
      muse: museResult,
    },
    detectedLevel
  );

  const recommendationOutput = generateActionableRecommendations({
    structuredResume,
    museResult,
    experienceResult,
    keywordResult,
    readabilityResult,
    overallScore: scoringOutput.overall,
  });

  // 7. Diagnostic Intelligence Engine
  const diagnosticOutput = runDiagnosticEngine({
    resume: canonicalResume,
    rawText,
    scoringOutput,
    critiqueOutput,
    jobDescriptionProvided: Boolean(options.jobDescription),
  });
  const scoringMs = Date.now() - tScoringStart;

  // 8. Backward-Compatible Frontend Category Scores (8 dimensions)
  const frontendCategoryScores: CategoryScores = {
    ats: scoringOutput.categoryScores.atsReadability,
    content: Math.round((scoringOutput.categoryScores.experience * 0.6 + scoringOutput.categoryScores.achievements * 0.4)),
    skills: scoringOutput.categoryScores.keywordRelevance,
    experience: scoringOutput.categoryScores.experience,
    impact: scoringOutput.categoryScores.achievements,
    formatting: scoringOutput.categoryScores.formatting,
    grammar: Math.round(scoringOutput.categoryScores.formatting * 0.95),
    professionalism: Math.round(scoringOutput.categoryScores.atsReadability * 0.6 + scoringOutput.categoryScores.education * 0.4),
  };

  const professionalismSummary =
    scoringOutput.overall >= 80
      ? 'Strong professional presentation with clear technical competencies and recognized section formatting.'
      : scoringOutput.overall >= 65
      ? 'Solid background that requires sharper metrics and decisive action verb phrasing to maximize interview callbacks.'
      : 'Fundamental profile requiring structural overhaul to satisfy modern Applicant Tracking System (ATS) screening.';

  const elapsedTotal = Date.now() - startPipelineTime;
  console.log(
    `[ATS] Pipeline completed successfully in ${elapsedTotal}ms (Parsing: ${parsingMs}ms, Deterministic: ${deterministicMs}ms, Muse: ${museMs}ms, Synthesis: ${scoringMs}ms). Overall ATS Score: ${scoringOutput.overall}/100`
  );

  const result: ComprehensiveAnalysisResult & { performance?: any } = {
    status: 'completed',
    resumeId: options.resumeId,
    mode: options.jobDescription ? 'job-match' : 'general',
    careerLevel: detectedLevel,
    confidence: scoringOutput.confidence,

    score: {
      overall: scoringOutput.overall,
      atsReadability: scoringOutput.categoryScores.atsReadability,
      keywordRelevance: scoringOutput.categoryScores.keywordRelevance,
      experience: scoringOutput.categoryScores.experience,
      projects: scoringOutput.categoryScores.projects,
      formatting: scoringOutput.categoryScores.formatting,
      education: scoringOutput.categoryScores.education,
      achievements: scoringOutput.categoryScores.achievements,

      // Aliases for backwards-compatibility
      atsCompatibility: scoringOutput.categoryScores.atsReadability,
      ats: scoringOutput.categoryScores.atsReadability,
      keywords: scoringOutput.categoryScores.keywordRelevance,
    },

    breakdown: scoringOutput.breakdown,
    keywords: keywordResult,
    sections: sectionResult.detectedSections,
    sectionQualities: scoringOutput.sectionQualities,

    strengths: diagnosticOutput.strengths.length > 0 ? diagnosticOutput.strengths : recommendationOutput.strengths,
    criticalIssues: recommendationOutput.criticalIssues,
    warnings: recommendationOutput.warnings,
    recommendations: recommendationOutput.formattedRecommendations,
    detailedRecommendations: recommendationOutput.detailedRecommendations,

    aiAnalysis: {
      strengths: museResult.strengths,
      criticalIssues: museResult.criticalIssues,
      warnings: museResult.warnings,
      recommendations: museResult.recommendations,
      semanticStrength: museResult.semanticStrength,
      experienceQuality: museResult.experienceQuality,
      projectQuality: museResult.projectQuality,
      summaryQuality: museResult.summaryQuality,
      museStatus: museResult.museStatus,
    },

    structuredResume,
    canonicalResume,
    critique: critiqueOutput,
    diagnostic: diagnosticOutput,
    jobMatch: jobMatchResult,

    // Frontend backwards-compatibility fields
    overall_score: scoringOutput.overall,
    category_scores: frontendCategoryScores,
    score_grade: scoringOutput.scoreGrade,
    critical_flaws: recommendationOutput.criticalIssues,
    minor_flaws: recommendationOutput.warnings,
    ats_issues: readabilityResult.deductions.concat(formattingResult.warnings).slice(0, 8),
    missing_information: sectionResult.missingSections.map((s) => `Missing ${s} section`).slice(0, 8),
    missingKeywords: keywordResult.missing,
    bullet_point_improvements: recommendationOutput.bulletPointImprovements,
    professionalism_summary: professionalismSummary,

    metadata: {
      word_count: countWords(rawText),
      char_count: rawText.length,
      file_type: options.fileType,
      extraction_method: options.extractionMethod,
      preserved_document: options.preservedDocument,
      raw_text: rawText,
      analysis_mode: 'ai_live',
      analyzed_at: new Date().toISOString(),
    },

    performance: {
      elapsedMs: elapsedTotal,
      cacheHit: false,
      pipeline: {
        parsingMs,
        deterministicMs,
        museMs,
        scoringMs,
        totalMs: elapsedTotal,
      },
    },
  };

  // Cache full analysis result
  analysisCache.setDeterministicAnalysis(resumeHash, jobHash, result);

  return result;
}
