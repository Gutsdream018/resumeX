import { StructuredResume } from '../../models/resume.types.js';
import { JobDescriptionJSON, RequirementImportance, JDSkill, JDRequirement } from './jobDescriptionParser.js';
import { runMuseMatchAnalysis, MuseMatchEvaluation } from './museMatchAnalyzer.js';
import { matchCache } from './matchCache.js';

export type MatchStatus = 'MATCHED' | 'PARTIAL' | 'MISSING';
export type EvidenceStrength = 'strong' | 'moderate' | 'weak' | 'no_evidence';

export interface RequirementMatchItem {
  id: string;
  requirementText: string;
  category: string;
  importance: RequirementImportance;
  status: MatchStatus;
  evidenceStrength: EvidenceStrength;
  evidenceQuote?: string;
  sourceSection?: 'skills' | 'experience' | 'education' | 'certifications' | 'projects' | 'summary' | 'other';
  confidence: 'High' | 'Medium' | 'Low';
  whyItMatters: string;
  actionRecommendation?: string;
  suggestedSection?: string;
}

export interface ContradictionItem {
  id: string;
  area: 'Seniority' | 'Location' | 'Education' | 'Experience Duration' | 'Certification';
  jobExpectation: string;
  resumeEvidence: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface RelevantExperienceItem {
  id: string;
  title: string;
  companyOrContext: string;
  relevanceScore: number;
  matchingKeywords: string[];
  evidenceSummary: string;
}

export interface MatchAnalysisJSON {
  overallMatch: number;
  potentialScore: number;
  alignmentLevel: 'Strong Alignment' | 'Moderate Alignment' | 'Low Alignment';
  breakdown: {
    skills: number;
    experience: number;
    responsibilities: number;
    education: number;
    keywords: number;
    domain: number;
  };
  weights: {
    skills: number;
    experience: number;
    responsibilities: number;
    education: number;
    keywords: number;
    domain: number;
  };
  strongMatches: RequirementMatchItem[];
  partialMatches: RequirementMatchItem[];
  missingRequirements: RequirementMatchItem[];
  contradictions: ContradictionItem[];
  relevantExperiences: RelevantExperienceItem[];
  keywordGapAnalysis: {
    matched: string[];
    partial: Array<{ keyword: string; matchedWith: string }>;
    missing: string[];
    related: string[];
  };
  recommendations: Array<{
    id: string;
    step: number;
    title: string;
    targetSection: 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications';
    currentEvidence?: string;
    missingElement: string;
    suggestedAction: string;
    whyItMatters: string;
    severity: 'critical' | 'high' | 'medium';
    potentialScoreGain: number;
  }>;
  jobSummary: {
    targetRole: string;
    experienceLevel: string;
    domain: string;
    coreTools: string[];
    responsibilitiesSummary: string[];
    educationSummary: string;
    locationRequirement?: string;
  };
  signals: {
    atsScoreComparison: {
      atsScore: number;
      matchScore: number;
      distinctionExplanation: string;
    };
    hiringProbabilityDisclaimer: string;
  };
  confidence: {
    overall: 'High' | 'Medium' | 'Low';
    semanticConfidence: number;
  };
  timestamp: string;
  hashes: {
    resumeHash: string;
    jdHash: string;
  };
}

export const MATCH_WEIGHTS = {
  skills: 0.25,
  experience: 0.25,
  responsibilities: 0.20,
  education: 0.10,
  keywords: 0.10,
  domain: 0.10,
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function computeMatchAnalysis(
  resume: StructuredResume,
  jd: JobDescriptionJSON,
  rawResumeText: string = '',
  atsScore: number = 75
): Promise<MatchAnalysisJSON> {
  const resumeHash = matchCache.computeHash(resume);
  const jdHash = jd.hash;

  // Check cached analysis
  const cached = matchCache.getMatch(resumeHash, jdHash);
  if (cached) {
    return cached;
  }

  // 1. Build flat searchable resume text index
  const resumeIndex = {
    summary: (resume.summary || '').toLowerCase(),
    skills: [
      ...(resume.skills?.technical || []),
      ...(resume.skills?.tools || []),
      ...(resume.skills?.languages || []),
      ...(resume.skills?.soft || []),
      ...((resume.skills as any)?.frameworks || []),
      ...((resume.skills as any)?.databases || []),
    ].join(' ').toLowerCase(),
    experience: (resume.experience || [])
      .map((e) => `${e.role} ${e.company} ${e.bullets.join(' ')}`)
      .join(' ')
      .toLowerCase(),
    projects: (resume.projects || [])
      .map((p) => `${p.name} ${(p.technologies || []).join(' ')} ${p.bullets.join(' ')}`)
      .join(' ')
      .toLowerCase(),
    education: (resume.education || [])
      .map((ed) => `${ed.degree} ${ed.institution} ${ed.field || ''} ${ed.gpa || ''}`)
      .join(' ')
      .toLowerCase(),
    certifications: (resume.certifications || []).join(' ').toLowerCase(),
    full: `${rawResumeText} ${(resume.summary || '')} ${[
      ...(resume.skills?.technical || []),
      ...(resume.skills?.tools || []),
      ...(resume.skills?.languages || []),
      ...(resume.skills?.soft || []),
      ...((resume.skills as any)?.frameworks || []),
      ...((resume.skills as any)?.databases || []),
    ].join(' ')} ${(resume.experience || []).map((e) => `${e.role} ${e.company} ${e.bullets.join(' ')}`).join(' ')} ${(resume.projects || []).map((p) => `${p.name} ${(p.technologies || []).join(' ')} ${p.bullets.join(' ')}`).join(' ')} ${(resume.certifications || []).join(' ')}`.toLowerCase(),
  };

  const strongMatches: RequirementMatchItem[] = [];
  const partialMatches: RequirementMatchItem[] = [];
  const missingRequirements: RequirementMatchItem[] = [];
  const contradictions: ContradictionItem[] = [];

  // 2. Evaluate Skills Match
  let totalSkillWeight = 0;
  let earnedSkillWeight = 0;

  jd.requirements.skills.forEach((skill, idx) => {
    const weight = skill.importance === 'MUST_HAVE' ? 3 : skill.importance === 'HIGH' ? 2 : 1;
    totalSkillWeight += weight;

    const skillLower = skill.name.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegex(skillLower)}\\b`, 'i');

    let status: MatchStatus = 'MISSING';
    let strength: EvidenceStrength = 'no_evidence';
    let quote: string | undefined;
    let section: RequirementMatchItem['sourceSection'];

    // Check Experience bullets for strong evidence
    for (const exp of resume.experience || []) {
      const matchBullet = exp.bullets.find((b) => regex.test(b));
      if (matchBullet) {
        status = 'MATCHED';
        strength = 'strong';
        quote = matchBullet;
        section = 'experience';
        break;
      }
    }

    // Check Projects if not in experience
    if (status === 'MISSING') {
      for (const proj of resume.projects || []) {
        const matchBullet = proj.bullets.find((b) => regex.test(b)) || (proj.technologies || []).find((t) => regex.test(t));
        if (matchBullet) {
          status = 'MATCHED';
          strength = 'strong';
          quote = typeof matchBullet === 'string' ? matchBullet : `${proj.name} (${skill.name})`;
          section = 'projects';
          break;
        }
      }
    }

    // Check Certifications
    if (status === 'MISSING') {
      const certMatch = (resume.certifications || []).find((c) => regex.test(c));
      if (certMatch) {
        status = 'MATCHED';
        strength = 'moderate';
        quote = certMatch;
        section = 'certifications';
      }
    }

    // Check Skills List
    if (status === 'MISSING') {
      if (regex.test(resumeIndex.skills)) {
        status = 'MATCHED';
        strength = 'moderate';
        quote = `Listed in Technical Skills: "${skill.name}"`;
        section = 'skills';
      }
    }

    // Check Summary / Full text for partial
    if (status === 'MISSING') {
      if (regex.test(resumeIndex.summary)) {
        status = 'PARTIAL';
        strength = 'weak';
        quote = `Mentioned in summary`;
        section = 'summary';
      } else if (regex.test(resumeIndex.full)) {
        status = 'PARTIAL';
        strength = 'weak';
        quote = `Referenced in resume text`;
        section = 'other';
      }
    }

    const item: RequirementMatchItem = {
      id: `skill_match_${idx + 1}`,
      requirementText: skill.name,
      category: skill.category,
      importance: skill.importance,
      status,
      evidenceStrength: strength,
      evidenceQuote: quote,
      sourceSection: section,
      confidence: status === 'MATCHED' ? 'High' : status === 'PARTIAL' ? 'Medium' : 'High',
      whyItMatters: skill.importance === 'MUST_HAVE'
        ? `Essential core competency explicitly requested for this role.`
        : `Strong signal of technical domain capability.`,
      actionRecommendation: status === 'MISSING'
        ? `Add ${skill.name} to your Technical Skills or Experience if you have relevant exposure.`
        : undefined,
      suggestedSection: 'skills',
    };

    if (status === 'MATCHED') {
      strongMatches.push(item);
      earnedSkillWeight += weight;
    } else if (status === 'PARTIAL') {
      partialMatches.push(item);
      earnedSkillWeight += weight * 0.5;
    } else {
      missingRequirements.push(item);
    }
  });

  const skillsScore = totalSkillWeight > 0 ? Math.round((earnedSkillWeight / totalSkillWeight) * 100) : 75;

  // 3. Evaluate Education Match
  let educationScore = 75;
  if (jd.requirements.education.length > 0) {
    let matchedEdu = false;
    for (const reqEdu of jd.requirements.education) {
      const eduRegex = new RegExp(`\\b(${escapeRegex(reqEdu.degree.toLowerCase())}|b\\.?tech|bachelor|master|engineering)\\b`, 'i');
      const foundEdu = (resume.education || []).find((e) => eduRegex.test(`${e.degree} ${e.field || ''}`));
      if (foundEdu) {
        matchedEdu = true;
        strongMatches.push({
          id: `edu_match_${reqEdu.id}`,
          requirementText: reqEdu.text,
          category: 'Education',
          importance: reqEdu.importance,
          status: 'MATCHED',
          evidenceStrength: 'strong',
          evidenceQuote: `${foundEdu.degree} from ${foundEdu.institution}${foundEdu.gpa ? ` (CGPA/Grade: ${foundEdu.gpa})` : ''}`,
          sourceSection: 'education',
          confidence: 'High',
          whyItMatters: 'Direct academic qualification match.',
        });
        break;
      }
    }
    educationScore = matchedEdu ? 95 : 45;
  } else if ((resume.education || []).length > 0) {
    educationScore = 90;
  }

  // 4. Experience Duration & Seniority Match + Contradictions
  let experienceScore = 65;
  const expYears = (resume.experience || []).length;
  const jdSeniority = jd.signals.seniority;

  if (jdSeniority === 'Entry-Level') {
    experienceScore = expYears >= 1 || (resume.projects || []).length >= 1 ? 90 : 70;
  } else if (jdSeniority === 'Senior' || jdSeniority === 'Lead') {
    if (expYears >= 4) {
      experienceScore = 88;
    } else {
      experienceScore = 48;
      contradictions.push({
        id: 'contra_seniority',
        area: 'Seniority',
        jobExpectation: `Requires ${jdSeniority} level experience (${jd.experienceLevel}).`,
        resumeEvidence: `Candidate shows entry/mid-level trajectory with ${expYears} documented roles/internships.`,
        severity: 'high',
        explanation: 'Experience duration is below the target seniority threshold.',
      });
    }
  } else {
    experienceScore = expYears >= 2 ? 82 : 68;
  }

  // Check Location Contradiction
  if (jd.location && jd.signals.locationType === 'On-Site') {
    const resumeCity = resume.contact?.linkedin || resumeIndex.full;
    if (resumeCity && !resumeCity.toLowerCase().includes(jd.location.toLowerCase())) {
      contradictions.push({
        id: 'contra_location',
        area: 'Location',
        jobExpectation: `On-site role in ${jd.location}.`,
        resumeEvidence: `Different candidate location or remote status detected.`,
        severity: 'low',
        explanation: 'Location difference detected. Highlight relocation willingness if applying.',
      });
    }
  }

  // 5. Keyword Gap Analysis
  const matchedKeywords: string[] = [];
  const partialKeywords: Array<{ keyword: string; matchedWith: string }> = [];
  const missingKeywords: string[] = [];
  const relatedKeywords: string[] = [];

  jd.keywords.forEach((kw) => {
    const reg = new RegExp(`\\b${escapeRegex(kw.toLowerCase())}\\b`, 'i');
    if (reg.test(resumeIndex.full)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const keywordScore = jd.keywords.length > 0
    ? Math.round((matchedKeywords.length / jd.keywords.length) * 100)
    : 75;

  // 6. Project & Experience Relevance Ranking
  const relevantExperiences: RelevantExperienceItem[] = [];

  (resume.experience || []).forEach((exp, idx) => {
    const text = `${exp.role} ${exp.company} ${exp.bullets.join(' ')}`.toLowerCase();
    const matched = jd.keywords.filter((kw) => text.includes(kw.toLowerCase()));
    const relScore = Math.min(Math.round(45 + matched.length * 15), 96);
    relevantExperiences.push({
      id: `exp_rel_${idx + 1}`,
      title: exp.role,
      companyOrContext: exp.company,
      relevanceScore: relScore,
      matchingKeywords: matched,
      evidenceSummary: matched.length > 0
        ? `Demonstrates ${matched.slice(0, 3).join(', ')} in professional setting.`
        : `Provides foundational industry experience.`,
    });
  });

  (resume.projects || []).forEach((proj, idx) => {
    const text = `${proj.name} ${(proj.technologies || []).join(' ')} ${proj.bullets.join(' ')}`.toLowerCase();
    const matched = jd.keywords.filter((kw) => text.includes(kw.toLowerCase()));
    const relScore = Math.min(Math.round(50 + matched.length * 14), 95);
    relevantExperiences.push({
      id: `proj_rel_${idx + 1}`,
      title: proj.name,
      companyOrContext: 'Technical Project',
      relevanceScore: relScore,
      matchingKeywords: matched,
      evidenceSummary: matched.length > 0
        ? `Applies ${matched.slice(0, 3).join(', ')} hands-on.`
        : `Demonstrates applied technical execution.`,
    });
  });

  relevantExperiences.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 7. Responsibilities & Domain Match
  const respScore = Math.min(Math.max(Math.round((skillsScore + experienceScore) / 2), 35), 95);
  const domainScore = jd.signals.domain === 'Mechanical & Manufacturing Engineering' && /mechanical|cad|catia|autocad|ninl|machining/i.test(resumeIndex.full)
    ? 90
    : jd.signals.domain === 'Technology & Software' && /software|developer|react|javascript|python/i.test(resumeIndex.full)
    ? 90
    : 70;

  // 8. Base Deterministic Score
  const rawDeterministicScore = Math.round(
    skillsScore * MATCH_WEIGHTS.skills +
    experienceScore * MATCH_WEIGHTS.experience +
    respScore * MATCH_WEIGHTS.responsibilities +
    educationScore * MATCH_WEIGHTS.education +
    keywordScore * MATCH_WEIGHTS.keywords +
    domainScore * MATCH_WEIGHTS.domain
  );

  // 9. Muse Semantic Evaluation
  const museResult: MuseMatchEvaluation = await runMuseMatchAnalysis(resume, jd, rawDeterministicScore);

  // Blended Overall Score
  const overallMatch = Math.min(Math.max(Math.round(rawDeterministicScore * 0.7 + museResult.semanticAlignmentScore * 0.3), 25), 98);
  const potentialScore = Math.min(overallMatch + Math.min(missingRequirements.length * 4 + 6, 20), 99);

  let alignmentLevel: MatchAnalysisJSON['alignmentLevel'] = 'Moderate Alignment';
  if (overallMatch >= 75) alignmentLevel = 'Strong Alignment';
  else if (overallMatch < 55) alignmentLevel = 'Low Alignment';

  // 10. Construct Tailored Recommendations for Resume Optimizer
  const recommendations: MatchAnalysisJSON['recommendations'] = [];

  // Top Missing Skill Action
  if (missingRequirements.length > 0) {
    const topMissing = missingRequirements.slice(0, 2);
    topMissing.forEach((miss, i) => {
      recommendations.push({
        id: `rec_miss_${i + 1}`,
        step: recommendations.length + 1,
        title: `Incorporate Target Qualification: ${miss.requirementText}`,
        targetSection: miss.category === 'tool' || miss.category === 'technical' ? 'skills' : 'experience',
        missingElement: miss.requirementText,
        suggestedAction: `If you have hands-on experience with ${miss.requirementText}, highlight it in your Skills or relevant project bullet points.`,
        whyItMatters: `${miss.requirementText} is classified as ${miss.importance} in the target Job Description.`,
        severity: miss.importance === 'MUST_HAVE' ? 'critical' : 'high',
        potentialScoreGain: 5,
      });
    });
  }

  // Summary Tailoring Action
  recommendations.push({
    id: `rec_summary_tailor`,
    step: recommendations.length + 1,
    title: `Align Professional Summary with ${jd.jobTitle}`,
    targetSection: 'summary',
    currentEvidence: resume.summary?.substring(0, 90) + '...',
    missingElement: `Keywords: ${jd.technologies.slice(0, 3).join(', ')}`,
    suggestedAction: `Tailor your opening summary to lead with your core strength in ${jd.signals.domain} and highlight ${jd.technologies.slice(0, 2).join(' & ')}.`,
    whyItMatters: `Recruiters and ATS scanners verify top summary keywords in the initial 6 seconds.`,
    severity: 'high',
    potentialScoreGain: 4,
  });

  // Responsibility Action
  if (jd.requirements.responsibilities.length > 0) {
    const topResp = jd.requirements.responsibilities[0];
    recommendations.push({
      id: `rec_resp_align`,
      step: recommendations.length + 1,
      title: `Detail Experience for "${topResp.text.substring(0, 40)}..."`,
      targetSection: 'experience',
      missingElement: topResp.text,
      suggestedAction: `Describe your hands-on role in tasks similar to "${topResp.text.substring(0, 50)}" using concrete metrics.`,
      whyItMatters: `Aligns candidate evidence directly with primary day-to-day role duties.`,
      severity: 'medium',
      potentialScoreGain: 4,
    });
  }

  const result: MatchAnalysisJSON = {
    overallMatch,
    potentialScore,
    alignmentLevel,
    breakdown: {
      skills: skillsScore,
      experience: experienceScore,
      responsibilities: respScore,
      education: educationScore,
      keywords: keywordScore,
      domain: domainScore,
    },
    weights: MATCH_WEIGHTS,
    strongMatches,
    partialMatches,
    missingRequirements,
    contradictions,
    relevantExperiences,
    keywordGapAnalysis: {
      matched: matchedKeywords,
      partial: partialKeywords,
      missing: missingKeywords,
      related: relatedKeywords,
    },
    recommendations,
    jobSummary: {
      targetRole: jd.jobTitle,
      experienceLevel: jd.experienceLevel,
      domain: jd.signals.domain,
      coreTools: jd.technologies.slice(0, 6),
      responsibilitiesSummary: jd.requirements.responsibilities.slice(0, 4).map((r) => r.text),
      educationSummary: jd.requirements.education.map((e) => e.text).join(', ') || 'Relevant Degree',
      locationRequirement: jd.location ? `${jd.location} (${jd.signals.locationType})` : undefined,
    },
    signals: {
      atsScoreComparison: {
        atsScore,
        matchScore: overallMatch,
        distinctionExplanation: `ATS Score (${atsScore}/100) measures universal parsing compatibility and formatting health. Match Score (${overallMatch}/100) measures how well your verified evidence matches this specific ${jd.jobTitle} posting.`,
      },
      hiringProbabilityDisclaimer: 'Match score reflects resume-to-job alignment against the provided text, not hiring probability.',
    },
    confidence: {
      overall: museResult.confidence,
      semanticConfidence: museResult.semanticAlignmentScore,
    },
    timestamp: new Date().toISOString(),
    hashes: {
      resumeHash,
      jdHash,
    },
  };

  // Cache final result
  matchCache.setMatch(resumeHash, jdHash, result);

  return result;
}
