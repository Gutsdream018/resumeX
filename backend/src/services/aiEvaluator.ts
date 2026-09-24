import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, buildAnalysisUserPrompt } from '../prompts/resumeAnalysisPrompt.js';
import { RawAIResponseSchema, extractAndParseJSON } from '../validation/schema.js';
import { calculateWeightedScore } from './scorer.js';
import { ResumeAnalysisResult, RawAIResponse, BulletPointImprovement, CategoryScores } from '../types/index.js';

export interface EvaluatorOptions {
  forceHeuristic?: boolean;
  extractionMethod?: 'native_text' | 'ocr_image' | 'ocr_scanned_pdf';
  fileType?: string;
}

/**
 * Main evaluation entry point: checks for API key and dispatches to Gemini or heuristic engine.
 */
export async function evaluateResumeText(
  resumeText: string,
  options: EvaluatorOptions = {}
): Promise<ResumeAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey && !options.forceHeuristic) {
    try {
      return await evaluateWithGemini(resumeText, apiKey, options);
    } catch (err: any) {
      console.warn('Gemini API evaluation failed or timed out. Falling back to Heuristic Engine:', err.message);
      // Fall through to heuristic evaluation
    }
  }

  // Built-in intelligent heuristic engine
  return evaluateWithHeuristicEngine(resumeText, options);
}

/**
 * Live evaluation via Google Gemini API
 */
async function evaluateWithGemini(
  resumeText: string,
  apiKey: string,
  options: EvaluatorOptions = {}
): Promise<ResumeAnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = buildAnalysisUserPrompt(resumeText);
  const result = await model.generateContent(prompt);
  const rawResponseText = result.response.text();

  const parsedJson = extractAndParseJSON(rawResponseText);
  const validatedData: RawAIResponse = RawAIResponseSchema.parse(parsedJson);

  // Deterministically calculate overall score from AI's category scores
  const { overall_score, normalized_categories, score_grade } = calculateWeightedScore(validatedData.category_scores);

  return {
    overall_score,
    category_scores: normalized_categories,
    score_grade,
    strengths: validatedData.strengths.slice(0, 8),
    critical_flaws: validatedData.critical_flaws.slice(0, 8),
    minor_flaws: validatedData.minor_flaws.slice(0, 8),
    ats_issues: validatedData.ats_issues.slice(0, 8),
    missing_information: validatedData.missing_information.slice(0, 8),
    recommendations: validatedData.recommendations.slice(0, 8),
    bullet_point_improvements: validatedData.bullet_point_improvements.slice(0, 6),
    professionalism_summary: validatedData.professionalism_summary || 'Evaluated against modern hiring and ATS standards.',
    metadata: {
      word_count: resumeText.split(/\s+/).length,
      char_count: resumeText.length,
      file_type: options.fileType,
      extraction_method: options.extractionMethod,
      analysis_mode: 'ai_live',
      analyzed_at: new Date().toISOString(),
    },
  };
}

/**
 * Robust, high-fidelity Deterministic Heuristic Evaluation Engine.
 * Evaluates the resume text across all 8 dimensions with zero hallucination.
 */
export function evaluateWithHeuristicEngine(
  resumeText: string,
  options: EvaluatorOptions = {}
): ResumeAnalysisResult {
  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const lowerText = resumeText.toLowerCase();
  const words = resumeText.trim().split(/\s+/);
  const wordCount = words.length;

  // 1. Contact and Header Analysis
  const hasEmail = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(resumeText);
  const hasGitHub = /github\.com\/[\w-]+/i.test(resumeText);

  // 2. Section Checks
  const hasExperience = /(experience|employment|work history|career)/i.test(resumeText);
  const hasEducation = /(education|academic|degree|university|college|b\.s|m\.s|ph\.d|bachelor)/i.test(resumeText);
  const hasSkills = /(skills|technologies|proficiencies|tech stack)/i.test(resumeText);
  const hasSummary = /(summary|profile|about me|objective)/i.test(resumeText);
  const hasProjects = /(projects|portfolio|key projects)/i.test(resumeText);

  // 3. Impact & Metric Analysis
  const metricRegex = /(\b\d+(\.\d+)?%|\$\d+[\d,]*(\.\d+)?|\b\d+k\b|\b\d+x\b|\b\d+\s*(users|clients|customers|requests|transactions|team members|engineers|microservices|leads)\b)/gi;
  const metricsFound = resumeText.match(metricRegex) || [];
  const metricDensity = metricsFound.length;

  // 4. Action Verbs & Weak Starters
  const strongActionVerbs = [
    'spearheaded', 'architected', 'engineered', 'orchestrated', 'streamlined',
    'optimized', 'developed', 'deployed', 'built', 'reduced', 'increased',
    'boosted', 'automated', 'implemented', 'designed', 'delivered', 'generated',
    'scaled', 'negotiated', 'transformed'
  ];
  const weakStarters = [
    'responsible for', 'worked on', 'helped with', 'assisted in', 'handled',
    'participated in', 'tasked with', 'duties included', 'was involved in'
  ];

  let strongVerbHits = 0;
  for (const verb of strongActionVerbs) {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(resumeText)) strongVerbHits++;
  }

  let weakStarterHits = 0;
  for (const starter of weakStarters) {
    const regex = new RegExp(`\\b${starter}\\b`, 'i');
    if (regex.test(resumeText)) weakStarterHits++;
  }

  // 5. Pronouns & Professionalism Checks (Resumes should avoid "I", "me", "my", "we")
  const personalPronounRegex = /\b(I|me|my|we|our|myself)\b/gi;
  const pronounHits = (resumeText.match(personalPronounRegex) || []).length;

  // 6. ATS Formatting / Complex Characters Checks
  const hasTablesOrColumnsHint = /(\|\s*-+\s*\||\t{2,}|table\s*of\s*contents)/i.test(resumeText);
  const hasUnusualSymbols = /([★✦■◆●▲▼•‣])/g.test(resumeText);

  // Calculate raw 0-100 scores for each of the 8 categories
  const rawScores: CategoryScores = {
    // ATS Compatibility (20%)
    ats: calculateCategoryAtsScore({
      hasEmail,
      hasPhone,
      hasExperience,
      hasEducation,
      hasSkills,
      hasTablesOrColumnsHint,
      wordCount,
    }),

    // Content Quality (15%)
    content: calculateCategoryContentScore({
      wordCount,
      hasSummary,
      hasExperience,
      hasSkills,
      pronounHits,
    }),

    // Skills Relevance (15%)
    skills: calculateCategorySkillsScore({
      hasSkills,
      resumeText,
      hasProjects,
    }),

    // Work Experience (15%)
    experience: calculateCategoryExperienceScore({
      hasExperience,
      strongVerbHits,
      weakStarterHits,
      linesCount: lines.length,
    }),

    // Achievements / Measurable Impact (15%)
    impact: calculateCategoryImpactScore({
      metricDensity,
      strongVerbHits,
    }),

    // Formatting & Structure (10%)
    formatting: calculateCategoryFormattingScore({
      hasExperience,
      hasEducation,
      hasSkills,
      hasSummary,
      linesCount: lines.length,
      hasUnusualSymbols,
    }),

    // Grammar & Language (5%)
    grammar: calculateCategoryGrammarScore({
      weakStarterHits,
      pronounHits,
      resumeText,
    }),

    // Professionalism (5%)
    professionalism: calculateCategoryProfessionalismScore({
      hasEmail,
      hasLinkedIn,
      hasGitHub,
      pronounHits,
      hasEducation,
    }),
  };

  const { overall_score, normalized_categories, score_grade } = calculateWeightedScore(rawScores);

  // Compile specific diagnostic findings
  const strengths: string[] = [];
  const criticalFlaws: string[] = [];
  const minorFlaws: string[] = [];
  const atsIssues: string[] = [];
  const missingInfo: string[] = [];
  const recommendations: string[] = [];

  // Strengths
  if (normalized_categories.ats >= 75) {
    strengths.push('ATS-friendly layout with standard recognized headings and clear text hierarchy.');
  }
  if (hasEmail && hasPhone) {
    strengths.push('Standard contact block includes both phone and email for seamless candidate outreach.');
  }
  if (metricDensity >= 3) {
    strengths.push(`Demonstrated measurable business impact with ${metricDensity}+ quantifiable metrics and achievements.`);
  }
  if (strongVerbHits >= 4) {
    strengths.push('Action-oriented language utilized across professional experience descriptions.');
  }
  if (hasLinkedIn || hasGitHub) {
    strengths.push('Included professional profile links (LinkedIn/GitHub) to substantiate candidate credentials.');
  }
  if (hasSkills && (hasProjects || hasExperience)) {
    strengths.push('Good synergy between stated technical skills and real-world project/work applications.');
  }
  if (options.extractionMethod === 'ocr_image') {
    strengths.unshift('Image Resume Recognized: Vision OCR successfully parsed all text, technical proficiencies, and experience sections from your uploaded image.');
  }
  if (strengths.length === 0) {
    strengths.push('Basic professional background established with chronological entries.');
  }

  // Critical Flaws
  if (metricDensity === 0) {
    criticalFlaws.push('Zero quantifiable achievements detected. Bullet points lack metrics (e.g., percentages, dollar amounts, scale, or time saved).');
  }
  if (!hasExperience) {
    criticalFlaws.push('Missing explicit "Work Experience" or "Professional Experience" section header.');
  }
  if (weakStarterHits >= 3) {
    criticalFlaws.push(`Repeated use of passive duty-oriented phrases (${weakStarterHits} occurrences like "responsible for", "worked on").`);
  }
  if (wordCount < 150) {
    criticalFlaws.push(`Resume is critically brief (${wordCount} words). Recruiters look for 350-700 words of substantive experience.`);
  }
  if (pronounHits >= 3) {
    criticalFlaws.push(`Frequent first-person pronouns found ("I", "my", "we"). Executive resumes must use implied third-person action verbs.`);
  }

  // Minor Flaws
  if (wordCount > 900) {
    minorFlaws.push(`Resume is lengthy (${wordCount} words). Consider condensing to 1-2 pages maximum for maximum recruiter retention.`);
  }
  if (!hasSummary) {
    minorFlaws.push('Missing a concise 2-3 sentence Executive Summary / Professional Profile at the top.');
  }
  if (!hasProjects && normalized_categories.experience < 70) {
    minorFlaws.push('No dedicated "Projects" section to highlight technical implementations and initiative.');
  }
  if (weakStarterHits > 0 && weakStarterHits < 3) {
    minorFlaws.push('A few bullet points open with passive phrases instead of decisive action verbs.');
  }

  // ATS Issues
  if (!hasEmail) {
    atsIssues.push('No email address detected in the header. Automated parsers will fail candidate ingestion.');
  }
  if (!hasPhone) {
    atsIssues.push('No phone number detected in header section.');
  }
  if (hasTablesOrColumnsHint) {
    atsIssues.push('Detected potential table borders or complex multi-column cues that can scramble ATS reading order.');
  }
  if (!hasSkills) {
    atsIssues.push('Missing a distinct "Skills" section for ATS keyword indexing.');
  }
  if (atsIssues.length === 0) {
    atsIssues.push('Header and section formats are cleanly ingestible by modern ATS scanners.');
  }
  if (options.extractionMethod === 'ocr_image') {
    atsIssues.push('Image Format Advisory: While ResumeX Vision OCR decoded your image completely, some older corporate ATS portals cannot parse flat images. We recommend downloading the text PDF generated by ResumeX when submitting to job boards.');
  }

  // Missing Information
  if (!hasEducation) {
    missingInfo.push('No formal Education section detected (degree, institution, or certifications).');
  }
  if (!hasLinkedIn) {
    missingInfo.push('LinkedIn profile URL is missing from contact information.');
  }
  if (metricDensity < 2) {
    missingInfo.push('Missing quantitative outcomes for key project deliverables.');
  }

  // Recommendations
  if (metricDensity < 3) {
    recommendations.push('Quantify at least 3 bullet points with tangible business outcomes (e.g. % latency cut, users served, or revenue impact).');
  }
  if (weakStarterHits > 0) {
    recommendations.push('Replace passive phrases ("responsible for", "assisted in") with decisive leadership verbs ("architected", "spearheaded", "engineered").');
  }
  if (!hasSkills) {
    recommendations.push('Add an explicit "Technical Skills" section categorized by Languages, Frameworks, and Tools.');
  }
  if (!hasSummary) {
    recommendations.push('Include a 2-3 sentence Executive Summary tailored to your target engineering specialization.');
  }
  if (recommendations.length < 3) {
    recommendations.push('Align technical keywords directly against target job descriptions to maximize ATS relevance scoring.');
  }

  // Bullet Point Improvements
  const bulletPointImprovements: BulletPointImprovement[] = extractAndImproveBullets(lines, resumeText);

  // Professionalism Summary
  const professionalismSummary =
    overall_score >= 80
      ? 'Strong professional presentation with clear technical competencies and recognized section formatting.'
      : overall_score >= 65
      ? 'Solid engineering background that requires sharper metrics and decisive action verb phrasing to maximize interview callbacks.'
      : 'Fundamental profile requiring structural overhaul to satisfy modern Applicant Tracking System (ATS) screening.';

  return {
    overall_score,
    category_scores: normalized_categories,
    score_grade,
    strengths: strengths.slice(0, 8),
    critical_flaws: criticalFlaws.slice(0, 8),
    minor_flaws: minorFlaws.slice(0, 8),
    ats_issues: atsIssues.slice(0, 8),
    missing_information: missingInfo.slice(0, 8),
    recommendations: recommendations.slice(0, 8),
    bullet_point_improvements: bulletPointImprovements.slice(0, 6),
    professionalism_summary: professionalismSummary,
    metadata: {
      word_count: wordCount,
      char_count: resumeText.length,
      file_type: options.fileType,
      extraction_method: options.extractionMethod,
      analysis_mode: 'heuristic_engine',
      analyzed_at: new Date().toISOString(),
    },
  };
}

// --- HEURISTIC HELPER FUNCTIONS ---

function calculateCategoryAtsScore(ctx: {
  hasEmail: boolean;
  hasPhone: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasTablesOrColumnsHint: boolean;
  wordCount: number;
}): number {
  let score = 50;
  if (ctx.hasEmail) score += 10;
  if (ctx.hasPhone) score += 10;
  if (ctx.hasExperience) score += 15;
  if (ctx.hasEducation) score += 10;
  if (ctx.hasSkills) score += 10;
  if (ctx.hasTablesOrColumnsHint) score -= 20;
  if (ctx.wordCount >= 200 && ctx.wordCount <= 900) score += 5;
  return Math.max(10, Math.min(98, score));
}

function calculateCategoryContentScore(ctx: {
  wordCount: number;
  hasSummary: boolean;
  hasExperience: boolean;
  hasSkills: boolean;
  pronounHits: number;
}): number {
  let score = 55;
  if (ctx.wordCount >= 300 && ctx.wordCount <= 750) score += 20;
  else if (ctx.wordCount < 200) score -= 25;
  if (ctx.hasSummary) score += 10;
  if (ctx.hasExperience) score += 10;
  if (ctx.hasSkills) score += 10;
  if (ctx.pronounHits > 0) score -= Math.min(20, ctx.pronounHits * 5);
  return Math.max(15, Math.min(98, score));
}

function calculateCategorySkillsScore(ctx: {
  hasSkills: boolean;
  resumeText: string;
  hasProjects: boolean;
}): number {
  let score = 50;
  if (ctx.hasSkills) score += 25;
  if (ctx.hasProjects) score += 10;

  // Check for common in-demand technical keywords
  const techKeywords = [
    'react', 'node', 'python', 'javascript', 'typescript', 'java', 'c\\+\\+', 'aws',
    'docker', 'kubernetes', 'sql', 'nosql', 'git', 'ci/cd', 'agile', 'rest api',
    'graphql', 'html', 'css', 'linux', 'azure', 'gcp', 'spring', 'go'
  ];
  let hits = 0;
  for (const kw of techKeywords) {
    if (new RegExp(`(?:^|\\W)${kw}(?:$|\\W)`, 'i').test(ctx.resumeText)) hits++;
  }
  score += Math.min(20, hits * 3);
  return Math.max(20, Math.min(96, score));
}

function calculateCategoryExperienceScore(ctx: {
  hasExperience: boolean;
  strongVerbHits: number;
  weakStarterHits: number;
  linesCount: number;
}): number {
  let score = 50;
  if (ctx.hasExperience) score += 20;
  score += Math.min(25, ctx.strongVerbHits * 4);
  score -= Math.min(25, ctx.weakStarterHits * 6);
  if (ctx.linesCount >= 15) score += 10;
  return Math.max(15, Math.min(98, score));
}

function calculateCategoryImpactScore(ctx: {
  metricDensity: number;
  strongVerbHits: number;
}): number {
  let score = 35;
  if (ctx.metricDensity >= 5) score += 55;
  else if (ctx.metricDensity >= 3) score += 40;
  else if (ctx.metricDensity >= 1) score += 25;
  score += Math.min(15, ctx.strongVerbHits * 2);
  return Math.max(10, Math.min(98, score));
}

function calculateCategoryFormattingScore(ctx: {
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasSummary: boolean;
  linesCount: number;
  hasUnusualSymbols: boolean;
}): number {
  let score = 60;
  if (ctx.hasExperience) score += 10;
  if (ctx.hasEducation) score += 10;
  if (ctx.hasSkills) score += 10;
  if (ctx.hasSummary) score += 5;
  if (ctx.hasUnusualSymbols) score -= 10;
  return Math.max(20, Math.min(95, score));
}

function calculateCategoryGrammarScore(ctx: {
  weakStarterHits: number;
  pronounHits: number;
  resumeText: string;
}): number {
  let score = 85;
  // Check for common grammar/typo triggers
  const typos = [
    'teh', 'experiance', 'developement', 'managment', 'responsibilty', 'profesional',
    'achievment', 'colaberate', 'impliment'
  ];
  let typoCount = 0;
  for (const typo of typos) {
    if (new RegExp(`\\b${typo}\\b`, 'i').test(ctx.resumeText)) typoCount++;
  }
  score -= typoCount * 12;
  score -= ctx.pronounHits * 3;
  if (ctx.weakStarterHits > 2) score -= 10;
  return Math.max(20, Math.min(98, score));
}

function calculateCategoryProfessionalismScore(ctx: {
  hasEmail: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  pronounHits: number;
  hasEducation: boolean;
}): number {
  let score = 65;
  if (ctx.hasEmail) score += 10;
  if (ctx.hasLinkedIn) score += 10;
  if (ctx.hasGitHub) score += 5;
  if (ctx.hasEducation) score += 10;
  if (ctx.pronounHits > 0) score -= Math.min(15, ctx.pronounHits * 4);
  return Math.max(25, Math.min(98, score));
}

/**
 * Identifies weak lines directly from the candidate's text and crafts improved versions
 * with zero hallucination.
 */
function extractAndImproveBullets(lines: string[], fullText: string): BulletPointImprovement[] {
  const improvements: BulletPointImprovement[] = [];
  const weakPatterns = [
    {
      regex: /^(responsible for|duties included|worked on|helped with|assisted in|tasked with)\s+(.*)/i,
      tag: 'passive_starter',
    },
    {
      regex: /^(\*|-|•)?\s*(managed|handled|did|created|supported|maintained)\s+(.*)/i,
      tag: 'vague_action',
    },
  ];

  for (const line of lines) {
    if (improvements.length >= 4) break;
    // Skip headers and contact lines
    if (line.length < 20 || line.length > 200) continue;
    if (/@|http|university|bachelor|master|education|skills:/i.test(line)) continue;

    const trimmed = line.replace(/^(\*|-|•)\s*/, '').trim();

    // Check pattern 1: Passive Starter
    const passiveMatch = trimmed.match(/^(responsible for|duties included|worked on|helped with|assisted in|tasked with)\s+(.*)/i);
    if (passiveMatch) {
      const rest = passiveMatch[2].trim();
      const firstWord = rest.split(' ')[0] || '';
      const verb = getActiveReplacementVerb(firstWord);
      const cleanedStatement = rest.replace(/^the\s+/i, '');

      improvements.push({
        original: trimmed,
        problem: 'Opens with passive phrasing ("' + passiveMatch[1] + '") rather than leading with a decisive action verb and measurable business value.',
        improved: `${verb} ${cleanedStatement}. (Recommended: quantify outcome by specifying [target metric, e.g., X% efficiency increase or Y hours saved]).`,
        why_better: 'Transforms passive duties into active accomplishments while suggesting a concrete metric template without fabricating candidate details.',
      });
      continue;
    }

    // Check pattern 2: Line lacking metrics
    const hasMetric = /\d+%|\$\d+|\b\d+\b/i.test(trimmed);
    const startsWithVerb = /^(developed|built|managed|led|created|designed|implemented|tested|maintained)\b/i.test(trimmed);
    if (startsWithVerb && !hasMetric && improvements.length < 3) {
      improvements.push({
        original: trimmed,
        problem: 'Describes a task or activity without illustrating the scope, business scale, or measurable outcome achieved.',
        improved: `${trimmed.replace(/\.$/, '')}, achieving measurable impact across [X users / Y% performance improvement / Z reduction in turnaround time].`,
        why_better: 'Applies the XYZ impact framework to elevate technical responsibility into a tangible business achievement.',
      });
    }
  }

  // If no lines matched the pattern, provide sample improvements tailored to the text content
  if (improvements.length === 0) {
    if (/web|frontend|react|javascript/i.test(fullText)) {
      improvements.push({
        original: 'Worked on developing web interfaces and fixing bugs.',
        problem: 'Too vague, uses passive "worked on", and omits technical framework and business result.',
        improved: 'Developed and optimized web application interfaces, reducing user-reported UI defects. (Recommend: include specific defect reduction % or latency gain).',
        why_better: 'Uses action verb "Developed and optimized" and focuses on product stability.',
      });
    } else {
      improvements.push({
        original: 'Responsible for daily operations and team communications.',
        problem: 'Passive phrasing with zero indication of team size, budget, or operational outcome.',
        improved: 'Spearheaded daily team operations and streamlined cross-functional workflows, improving delivery turnaround. (Recommend: specify team size [X] and turnaround improvement [Y%]).',
        why_better: 'Demonstrates active leadership ("Spearheaded", "Streamlined") with a quantifiable metric framework.',
      });
    }
  }

  return improvements;
}

function getActiveReplacementVerb(followingWord: string): string {
  const lower = followingWord.toLowerCase();
  if (lower.startsWith('develop') || lower.startsWith('build')) return 'Architected and built';
  if (lower.startsWith('manag') || lower.startsWith('lead')) return 'Spearheaded';
  if (lower.startsWith('design')) return 'Designed and deployed';
  if (lower.startsWith('test') || lower.startsWith('qa')) return 'Automated and executed';
  if (lower.startsWith('creat')) return 'Engineered';
  if (lower.startsWith('support') || lower.startsWith('maintain')) return 'Maintained and enhanced';
  if (lower.startsWith('coordinat') || lower.startsWith('organiz')) return 'Orchestrated';
  return 'Spearheaded';
}
