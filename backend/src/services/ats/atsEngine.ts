import { AtsCategoryScores } from '../../models/resume.types.js';
import { ScoringConfig, defaultScoringConfig } from '../../config/scoringConfig.js';
import { ContactAnalysis } from '../deterministic/contactAnalyzer.js';
import { SectionAnalysis } from '../deterministic/sectionAnalyzer.js';
import { FormattingAnalysis } from '../deterministic/formattingAnalyzer.js';
import { ContentAnalysis } from '../deterministic/contentAnalyzer.js';
import { SkillsAnalysis } from '../deterministic/skillsAnalyzer.js';
import { StructuredResume } from '../../models/resume.types.js';
import { clamp } from '../../utils/textUtils.js';

export interface AtsEvaluationResult {
  overall: number;
  categories: AtsCategoryScores;
  weights: Record<keyof AtsCategoryScores, number>;
}

export function evaluateAtsScores(
  resume: StructuredResume,
  analyses: {
    contact: ContactAnalysis;
    section: SectionAnalysis;
    formatting: FormattingAnalysis;
    content: ContentAnalysis;
    skills: SkillsAnalysis;
  },
  config: ScoringConfig = defaultScoringConfig
): AtsEvaluationResult {
  const { contact, section, formatting, content, skills } = analyses;

  // 1. ATS Compatibility: contact block completeness, standard headers, no column/table scramble
  let atsCompatibility = 50;
  if (contact.hasEmail) atsCompatibility += 15;
  if (contact.hasPhone) atsCompatibility += 10;
  if (contact.hasName) atsCompatibility += 10;
  if (section.detectedSections.experience) atsCompatibility += 10;
  if (section.detectedSections.skills) atsCompatibility += 10;
  if (formatting.hasTablesOrColumnsHint) atsCompatibility -= 25;
  if (formatting.hasUnusualSymbols) atsCompatibility -= 10;
  if (formatting.isExtremelyShort) atsCompatibility -= 25;

  // 2. Keyword Relevance: skills variety, technical breadth, tools
  let keywordRelevance = skills.score;

  // 3. Experience Quality: experience presence, strong action verbs, low weak starters, metric backing
  let experience = 45;
  if (resume.experience.length > 0) experience += 20;
  experience += Math.min(25, content.strongVerbHits * 5);
  experience -= Math.min(25, content.weakStarterHits * 4);
  if (content.metricCount >= 2) experience += 15;
  else if (content.metricCount === 0 && formatting.isExtremelyShort) experience -= 15;

  // 4. Project Quality: dedicated projects, tech stack specified, action bullets
  let projects = 35;
  if (resume.projects.length > 0) {
    projects += 35;
    const hasTechs = resume.projects.some((p) => p.technologies && p.technologies.length > 0);
    if (hasTechs) projects += 15;
    const hasBullets = resume.projects.some((p) => p.bullets && p.bullets.length > 0);
    if (hasBullets) projects += 15;
  } else if (resume.experience.length >= 2 && !formatting.isExtremelyShort) {
    projects = Math.max(60, experience - 10);
  }

  // 5. Formatting: word count, bullet consistency, symbol cleanliness
  let formattingScore = formatting.score;

  // 6. Education: degree detected, institution detected, dates
  let education = 30;
  if (resume.education.length > 0) {
    education += 40;
    if (resume.education[0].institution && resume.education[0].institution !== 'Institution') education += 15;
    if (resume.education[0].degree && resume.education[0].degree !== 'Degree') education += 15;
  }

  // 7. Achievements: measurable outcomes, certifications, awards
  let achievements = 30;
  if (content.metricCount >= 5) achievements += 55;
  else if (content.metricCount >= 3) achievements += 40;
  else if (content.metricCount >= 1) achievements += 20;
  if (resume.achievements.length > 0 || resume.certifications.length > 0) achievements += 20;

  const categories: AtsCategoryScores = {
    atsCompatibility: clamp(atsCompatibility, 15, 98),
    keywordRelevance: clamp(keywordRelevance, 20, 98),
    experience: clamp(experience, 15, 98),
    projects: clamp(projects, 20, 98),
    formatting: clamp(formattingScore, 15, 98),
    education: clamp(education, 25, 98),
    achievements: clamp(achievements, 10, 98),
  };

  const weights = config.getWeights();

  const overallWeighted =
    categories.atsCompatibility * weights.atsCompatibility +
    categories.keywordRelevance * weights.keywordRelevance +
    categories.experience * weights.experience +
    categories.projects * weights.projects +
    categories.formatting * weights.formatting +
    categories.education * weights.education +
    categories.achievements * weights.achievements;

  return {
    overall: clamp(overallWeighted, 10, 99),
    categories,
    weights,
  };
}
