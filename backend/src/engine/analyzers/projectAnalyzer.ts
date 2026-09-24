import { ProjectItem } from '../../models/resume.types.js';
import { safeClamp } from '../scoring/scoreNormalizer.js';
import { CareerLevel } from '../schemas/analysisSchema.js';

export interface ProjectAnalysisResult {
  projectCount: number;
  hasTechnologies: boolean;
  hasBullets: boolean;
  score: number;
  signals: string[];
  deductions: string[];
}

export function analyzeProjects(
  projects: ProjectItem[],
  fullText: string,
  careerLevel?: CareerLevel,
  experienceCount: number = 0
): ProjectAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];

  const projectCount = projects.length;
  const hasTechnologies = projects.some((p) => p.technologies && p.technologies.length > 0);
  const hasBullets = projects.some((p) => p.bullets && p.bullets.length > 0);

  let score = 40;

  if (projectCount >= 2) {
    score += 30;
    signals.push(`Includes ${projectCount} technical projects demonstrating practical implementation.`);
  } else if (projectCount === 1) {
    score += 15;
    signals.push('Technical project featured with implementation context.');
  } else if (careerLevel === 'student' || experienceCount < 2) {
    deductions.push('No dedicated technical projects section found. Hands-on projects substantiate skills for early career profiles.');
  } else {
    // Senior candidate with multiple experience entries
    score += 35;
    signals.push('Extensive enterprise work experience provides robust project substantiation.');
  }

  if (hasTechnologies) {
    score += 15;
    signals.push('Projects explicitly list the underlying tech stack and frameworks.');
  }

  if (hasBullets) {
    score += 15;
    signals.push('Projects include bulleted achievement and architectural explanations.');
  }

  return {
    projectCount,
    hasTechnologies,
    hasBullets,
    score: safeClamp(score, 20, 100),
    signals,
    deductions,
  };
}
