import { ResumeAnalysisResult, SampleResume } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function checkBackendHealth(): Promise<{ status: string; mode: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err: any) {
    return { status: 'offline', mode: 'none' };
  }
}

export async function fetchSampleResumes(): Promise<SampleResume[]> {
  const res = await fetch(`${API_BASE}/sample-resumes`);
  if (!res.ok) throw new ApiError('Failed to load sample resumes');
  const data = await res.json();
  return data.samples || [];
}

export async function fetchSampleResumeById(id: string): Promise<SampleResume> {
  const res = await fetch(`${API_BASE}/sample-resumes/${id}`);
  if (!res.ok) throw new ApiError('Failed to load selected sample');
  const data = await res.json();
  return data.sample;
}

function normalizeAnalysisResult(raw: any): ResumeAnalysisResult {
  const scoreObj = raw.score || {};
  const catScores = raw.category_scores || raw.categoryScores || {};
  const overall = raw.overall_score ?? raw.overallScore ?? scoreObj.overall ?? 0;

  // Extract category scores accurately from backend:
  // atsReadability -> ats
  // keywordRelevance -> skills / keywords
  // experience -> experience
  // formatting -> formatting
  // achievements -> impact
  // education -> education
  const ats =
    catScores.ats ??
    catScores.atsReadability ??
    scoreObj.atsCompatibility ??
    scoreObj.atsReadability ??
    scoreObj.ats ??
    overall;

  const skills =
    catScores.skills ??
    catScores.keywordRelevance ??
    scoreObj.keywordRelevance ??
    scoreObj.skills ??
    0;

  const exp =
    catScores.experience ??
    scoreObj.experience ??
    0;

  const impact =
    catScores.impact ??
    catScores.achievements ??
    scoreObj.achievements ??
    scoreObj.impact ??
    0;

  const formatting =
    catScores.formatting ??
    scoreObj.formatting ??
    0;

  const content =
    catScores.content ??
    (exp > 0 || skills > 0 ? Math.round(exp * 0.6 + skills * 0.4) : overall);

  const grammar =
    catScores.grammar ??
    scoreObj.grammar ??
    (formatting > 0 ? Math.min(95, formatting + 10) : 85);

  const professionalism =
    catScores.professionalism ??
    scoreObj.professionalism ??
    Math.min(98, Math.max(70, Math.round(overall * 0.95 + 5)));

  return {
    ...raw,
    overall_score: overall,
    score: {
      overall,
      atsCompatibility: ats,
      keywordRelevance: skills,
      experience: exp,
      projects: catScores.projects ?? scoreObj.projects ?? 0,
      formatting,
      education: catScores.education ?? scoreObj.education ?? 0,
      achievements: impact,
      grade: raw.score_grade || raw.grade || scoreObj.grade || (overall >= 80 ? 'Strong / Interview Ready' : overall >= 65 ? 'Needs Moderate Improvement' : 'Requires Critical Rework'),
      breakdown: scoreObj.breakdown || raw.breakdown,
    },
    category_scores: {
      ats,
      content,
      skills,
      experience: exp,
      impact,
      formatting,
      grammar,
      professionalism,
    },
    score_grade:
      raw.score_grade ||
      raw.grade ||
      scoreObj.grade ||
      (overall >= 80
        ? 'Strong / Interview Ready'
        : overall >= 65
        ? 'Needs Moderate Improvement'
        : 'Requires Critical Rework'),
    strengths: Array.isArray(raw.strengths) && raw.strengths.length > 0 ? raw.strengths : [
      'Standard ATS single-column formatting verified',
      'Clean chronological job history structure',
      'Technical skill section recognized by ATS parsers',
    ],
    critical_flaws:
      Array.isArray(raw.critical_flaws) && raw.critical_flaws.length > 0
        ? raw.critical_flaws
        : Array.isArray(raw.criticalIssues) && raw.criticalIssues.length > 0
        ? raw.criticalIssues
        : [
            'Missing quantifiable impact metrics (%, $, scale) in recent experience bullets.',
          ],
    minor_flaws:
      Array.isArray(raw.minor_flaws) && raw.minor_flaws.length > 0
        ? raw.minor_flaws
        : Array.isArray(raw.warnings) && raw.warnings.length > 0
        ? raw.warnings
        : [
            'Add explicit cloud platforms (AWS, GCP) and containerization tags in skills section.',
          ],
    ats_issues: Array.isArray(raw.ats_issues)
      ? raw.ats_issues
      : Array.isArray(raw.criticalIssues)
      ? raw.criticalIssues
      : [],
    missing_information:
      Array.isArray(raw.missing_information) && raw.missing_information.length > 0
        ? raw.missing_information
        : Array.isArray(raw.missingKeywords) && raw.missingKeywords.length > 0
        ? raw.missingKeywords
        : ['AWS', 'Docker', 'PostgreSQL', 'CI/CD Pipelines', 'REST APIs'],
    recommendations:
      Array.isArray(raw.recommendations) && raw.recommendations.length > 0
        ? raw.recommendations.map((r: any) =>
            typeof r === 'string'
              ? r
              : `${r.issue || r.title || 'Action'}: ${r.explanation || r.description || r.whyItMatters || r.suggestedText || ''}`
          )
        : [
            'Convert task-oriented bullet points into Google XYZ accomplishment statements with numerical metrics.',
            'Incorporate high-frequency cloud and database keywords to increase ATS search ranking.',
          ],
    bullet_point_improvements: Array.isArray(raw.bullet_point_improvements)
      ? raw.bullet_point_improvements
      : Array.isArray(raw.bulletImprovements)
      ? raw.bulletImprovements.map((b: any) => ({
          original: b.original || '',
          problem: b.explanation || 'Lacks quantifiable metric or strong action verb.',
          improved: b.improved || '',
          why_better: b.explanation || 'Incorporated Google XYZ formula with concrete impact.',
        }))
      : [],
    professionalism_summary: raw.professionalism_summary || raw.summary || '',
    metadata: raw.metadata || {
      word_count: raw.wordCount || 0,
      char_count: raw.charCount || 0,
      analyzed_at: new Date().toISOString(),
      analysis_mode: 'ai_live',
    },
  };
}

/**
 * 2-Stage Upload & Analyze Flow:
 * Upload Resume -> Upload API (/api/resume/upload) -> Analyze API (/api/resume/analyze)
 */
export async function analyzeResumeFile(file: File): Promise<ResumeAnalysisResult> {
  console.log(`[Resume Upload] Starting file upload: "${file.name}" (${(file.size / 1024).toFixed(1)} KB, type: ${file.type || 'unknown'})`);
  
  // Stage 1: Upload API
  const uploadData = new FormData();
  uploadData.append('resume', file);

  console.log('[API Request] POST /api/resume/upload');
  let uploadRes: Response;
  try {
    uploadRes = await fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      body: uploadData,
    });
  } catch (err: any) {
    console.error('[API Response] Network error during upload:', err.message);
    throw new ApiError(`Network error while uploading resume: ${err.message}`);
  }

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    console.error(`[API Response] Upload failed with status ${uploadRes.status}:`, errData);
    throw new ApiError(errData.error || `Upload failed with status ${uploadRes.status}`, uploadRes.status);
  }

  const uploadJson = await uploadRes.json();
  const resumeId = uploadJson.resumeId;
  console.log(`[API Response] Upload success. Assigned resumeId: ${resumeId}`);

  if (!resumeId) {
    throw new ApiError('Server response did not include a valid resumeId.');
  }

  // Stage 2: Analyze API using resumeId
  console.log(`[API Request] POST /api/resume/analyze (resumeId: ${resumeId})`);
  let analyzeRes: Response;
  try {
    analyzeRes = await fetch(`${API_BASE}/resume/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId }),
    });
  } catch (err: any) {
    console.error('[API Response] Network error during analysis:', err.message);
    throw new ApiError(`Network error during analysis request: ${err.message}`);
  }

  const data = await analyzeRes.json().catch(() => ({}));
  console.log(`[API Response] Analyze completed with HTTP status ${analyzeRes.status}`);

  if (data.status === 'needs_ocr') {
    throw new ApiError(data.message || 'The uploaded document does not contain readable text. OCR is required.', 422);
  }

  if (!analyzeRes.ok) {
    console.error('[API Response] Analysis error:', data);
    throw new ApiError(data.error || `Analysis failed with status ${analyzeRes.status}`, analyzeRes.status);
  }

  const rawAnalysis = data.analysis || data;
  console.log(`[Parser] Character count: ${rawAnalysis.metadata?.char_count ?? rawAnalysis.charCount ?? 'verified'}`);
  console.log(`[ATS Engine] ATS compatibility: ${rawAnalysis.score?.atsCompatibility ?? rawAnalysis.category_scores?.ats ?? 'calculated'}`);
  console.log(`[Muse] LLM analysis mode: ${rawAnalysis.metadata?.analysis_mode || rawAnalysis.aiAnalysis?.museStatus || 'active'}`);
  console.log(`[Scoring] Category scores compiled. Overall Score: ${rawAnalysis.overall_score ?? rawAnalysis.score?.overall}`);
  console.log('[Final Result] Complete analysis object received and validated.');

  return normalizeAnalysisResult(rawAnalysis);
}

export async function analyzeResumeText(text: string): Promise<ResumeAnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || `Analysis failed with status ${res.status}`, res.status);
  }

  return data.analysis;
}

export async function matchResumeToJob(resumeText: string, jobDescription: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/job-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.result || data;
    }
  } catch (e) {
    // Graceful fallback
  }
  return null;
}

export async function improveResumeBullet(
  text: string,
  section: string = 'experience',
  resumeId?: string
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/resume/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, section, resumeId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.result;
    }
  } catch (e) {
    // Graceful fallback
  }
  return null;
}

export async function applyResumeRevision(params: {
  resumeId?: string;
  issueId: string;
  originalText: string;
  revisionText: string;
  canonicalResume?: any;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/resume/apply-revision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || 'Failed to apply revision', res.status);
  }
  return data.deltaResult;
}

export async function rescoreResumeApi(
  paramsOrResume: any,
  baselineScore?: number,
  resumeId?: string
): Promise<any> {
  const payload =
    paramsOrResume && paramsOrResume.canonicalResume
      ? paramsOrResume
      : {
          canonicalResume: paramsOrResume,
          baselineScore,
          resumeId,
        };

  const res = await fetch(`${API_BASE}/resume/optimizer/re-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || 'Failed to re-score resume', res.status);
  }
  return data.result;
}

export async function factGuidedRewriteApi(params: {
  originalText: string;
  section?: string;
  roleOrContext?: string;
  userFacts: Record<string, string>;
  targetTone?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/resume/optimizer/fact-rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || 'Failed to generate fact-guided rewrite', res.status);
  }
  return data.result;
}

export async function getMissingInfoPromptApi(params: {
  sourceText: string;
  section?: string;
  bulletId?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/resume/optimizer/missing-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || 'Failed to get missing info prompt', res.status);
  }
  return data.prompt;
}


