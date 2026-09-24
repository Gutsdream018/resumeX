import { CanonicalResume } from '../ingestion/types.js';
import { CritiqueIssue } from './types.js';
import { extractEvidenceFromText } from './evidenceExtractor.js';

const WEAK_STARTERS = [
  'responsible for',
  'helped with',
  'worked on',
  'assisted in',
  'handled',
  'participated in',
  'involved in',
  'tasked with',
  'supported',
  'contributed to',
];

const GENERIC_OBJECTIVE_PATTERNS = [
  /seeking\s+(?:an?\s+)?(?:entry[- ]level\s+|challenging\s+|growth[- ]oriented\s+)?(?:role|position|opportunity)/i,
  /utilize\s+my\s+(?:skills|knowledge|abilities)/i,
  /contribute\s+to\s+the\s+growth\s+of\s+the\s+company/i,
  /opportunity\s+to\s+(?:learn|grow|enhance)/i,
  /hard[- ]working\s+individual\s+looking\s+for/i,
];

/**
 * Deterministically scans the Canonical Resume for content, structural, ATS, and impact flaws.
 */
export function detectResumeIssues(resume: CanonicalResume): CritiqueIssue[] {
  const issues: CritiqueIssue[] = [];
  let issueCounter = 1;

  // 1. Summary / Objective Analysis
  if (resume.summary) {
    const isGeneric = GENERIC_OBJECTIVE_PATTERNS.some((p) => p.test(resume.summary!));
    if (isGeneric) {
      const ev = extractEvidenceFromText(resume.summary, 'summary', resume);
      issues.push({
        id: `ISSUE-${String(issueCounter++).padStart(3, '0')}`,
        type: 'GENERIC_OBJECTIVE',
        section: 'summary',
        severity: 'high',
        title: 'Generic Career Objective / Summary',
        sourceText: resume.summary,
        roleOrContext: 'Professional Summary',
        reason:
          'This statement describes a desire for an opportunity rather than highlighting specific technical strengths, target roles, or verified accomplishments.',
        evidence: ev.verifiedFacts,
        impact: {
          category: 'summaryQuality',
          description: 'Reduces recruiter engagement during the initial 6-second scan.',
        },
      });
    }
  }

  // 2. Experience Bullets Analysis
  for (const exp of resume.experience) {
    const roleLabel = `${exp.title || 'Role'} • ${exp.company || 'Organization'}`;

    for (const bullet of exp.bullets) {
      if (issues.length >= 8) break;
      const cleanBullet = bullet.trim();
      const lower = cleanBullet.toLowerCase();
      const ev = extractEvidenceFromText(cleanBullet, 'experience', resume);

      // Check weak starter
      const weakMatch = WEAK_STARTERS.find((w) => lower.startsWith(w) || lower.includes(`was ${w}`));
      const hasMetrics = ev.verifiedMetrics.length > 0;
      const hasTech = ev.verifiedTechnologies.length > 0;
      const isShort = cleanBullet.split(/\s+/).length < 7;

      if (weakMatch) {
        issues.push({
          id: `ISSUE-${String(issueCounter++).padStart(3, '0')}`,
          type: 'WEAK_ACTION_VERB',
          section: 'experience',
          severity: 'high',
          title: `Passive Duty Phrasing ("${weakMatch}")`,
          sourceText: cleanBullet,
          roleOrContext: roleLabel,
          reason:
            'Leading with passive duty descriptions obscures your direct technical ownership and contribution.',
          evidence: ev.verifiedFacts,
          impact: {
            category: 'experienceQuality',
            description: 'Recruiters favor decisive action verbs (Architected, Engineered, Spearheaded).',
          },
        });
      } else if (!hasMetrics && !hasTech) {
        issues.push({
          id: `ISSUE-${String(issueCounter++).padStart(3, '0')}`,
          type: 'LACKS_METRIC_AND_TECH',
          section: 'experience',
          severity: 'medium',
          title: 'Missing Quantifiable Impact & Tech Stack',
          sourceText: cleanBullet,
          roleOrContext: roleLabel,
          reason:
            'Bullet describes a task without specifying the technologies leveraged or the measurable outcome achieved.',
          evidence: ev.verifiedFacts,
          impact: {
            category: 'achievements',
            description: 'Accomplishment statements with metrics rank in the top quartile of ATS evaluations.',
          },
        });
      } else if (isShort) {
        issues.push({
          id: `ISSUE-${String(issueCounter++).padStart(3, '0')}`,
          type: 'UNDERDEVELOPED_BULLET',
          section: 'experience',
          severity: 'medium',
          title: 'Underdeveloped Bullet Point',
          sourceText: cleanBullet,
          roleOrContext: roleLabel,
          reason: 'Bullet point is too concise to convey the scope of your engineering deliverable.',
          evidence: ev.verifiedFacts,
          impact: {
            category: 'formatting',
            description: 'Target 12-25 words per bullet for optimal recruiter readability.',
          },
        });
      }
    }
  }

  // 3. Project Analysis
  for (const proj of resume.projects) {
    if (issues.length >= 8) break;
    const projLabel = `Project: ${proj.name || 'Technical Project'}`;

    if (proj.technologies.length === 0 && proj.bullets.length > 0) {
      const firstBullet = proj.bullets[0];
      const ev = extractEvidenceFromText(firstBullet, 'projects', resume);
      issues.push({
        id: `ISSUE-${String(issueCounter++).padStart(3, '0')}`,
        type: 'MISSING_PROJECT_TECH',
        section: 'projects',
        severity: 'medium',
        title: 'Project Tech Stack Not Specified',
        sourceText: firstBullet,
        roleOrContext: projLabel,
        reason: 'Project description does not clearly list the frameworks and databases used in the build.',
        evidence: ev.verifiedFacts,
        impact: {
          category: 'projectQuality',
          description: 'ATS search filters index project technologies alongside skills.',
        },
      });
    }
  }

  // 4. Skills Analysis
  const totalSkills =
    resume.skills.technical.length +
    resume.skills.frameworks.length +
    resume.skills.databases.length +
    resume.skills.tools.length;

  if (totalSkills < 6) {
    issues.push({
      id: `ISSUE-${String(issueCounter++).padStart(3, '0')}`,
      type: 'LOW_KEYWORD_DENSITY',
      section: 'skills',
      severity: 'high',
      title: 'Low Technical Keyword Density',
      sourceText: `Current Skills: ${[...resume.skills.technical, ...resume.skills.tools].join(', ') || 'None listed'}`,
      roleOrContext: 'Technical Skills Matrix',
      reason: 'Fewer than 6 canonical technical skills were identified in your skills section.',
      evidence: [...resume.skills.technical, ...resume.skills.tools],
      impact: {
        category: 'keywordRelevance',
        description: 'Significantly reduces match percentage on automated ATS keyword scans.',
      },
    });
  }

  return issues.slice(0, 6);
}
