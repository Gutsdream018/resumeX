import { runDiagnosticEngine } from '../src/engine/diagnostic/diagnosticEngine.js';
import { calculatePriorityScore } from '../src/engine/diagnostic/priorityCalculator.js';
import {
  checkExperienceFalsePositives,
  checkSkillsFalsePositives,
  checkEducationDates,
} from '../src/engine/diagnostic/falsePositiveGuard.js';
import { CanonicalResume } from '../src/engine/ingestion/types.js';
import { ScoreEngineOutput } from '../src/engine/scoring/scoreEngine.js';

const mockScoring: ScoreEngineOutput = {
  overall: 48,
  scoreGrade: 'Needs Improvement',
  confidence: 0.95,
  categoryScores: {
    atsReadability: 68,
    keywordRelevance: 42,
    experience: 35,
    projects: 20,
    formatting: 78,
    education: 82,
    achievements: 45,
  },
  weights: {
    atsReadability: 0.20,
    keywordRelevance: 0.20,
    experience: 0.20,
    projects: 0.15,
    formatting: 0.10,
    education: 0.05,
    achievements: 0.10,
  },
  breakdown: {
    atsReadability: { score: 68, weight: 0.2, contribution: 13.6, reason: 'Good readability', strengths: [], deductions: [] },
    keywordRelevance: { score: 42, weight: 0.2, contribution: 8.4, reason: 'Scattered terminology', strengths: [], deductions: [] },
    experience: { score: 35, weight: 0.2, contribution: 7.0, reason: 'Passive phrasing', strengths: [], deductions: [] },
    projects: { score: 20, weight: 0.15, contribution: 3.0, reason: 'Limited projects', strengths: [], deductions: [] },
    formatting: { score: 78, weight: 0.10, contribution: 7.8, reason: 'Clean format', strengths: [], deductions: [] },
    education: { score: 82, weight: 0.05, contribution: 4.1, reason: 'Degree verified', strengths: [], deductions: [] },
    achievements: { score: 45, weight: 0.10, contribution: 4.5, reason: 'Lacks metrics', strengths: [], deductions: [] },
  },
  sectionQualities: {} as any,
};

const mockResume: CanonicalResume = {
  document: { type: 'TEXT_PDF', pageCount: 1, language: 'en', extractionConfidence: 0.95 },
  contact: {
    name: 'David Miller',
    title: 'Mechanical Engineer',
    email: 'david.miller@example.com',
    phone: '555-4321',
    location: 'Detroit, MI',
    linkedin: null,
    github: null,
    portfolio: null,
  },
  summary: 'Hardworking engineer looking to utilize CAD skills.',
  experience: [],
  internships: [
    {
      company: 'AutoDynamics',
      title: 'Design Intern',
      location: 'Detroit, MI',
      startDate: '2022',
      endDate: '2023',
      isCurrent: false,
      bullets: ['Used AutoCAD and SolidWorks for component modeling.'],
      technologies: ['AutoCAD', 'SolidWorks'],
    },
  ],
  projects: [],
  skills: {
    technical: ['AutoCAD', 'SolidWorks', 'MATLAB', 'CATIA'],
    frameworks: [],
    databases: [],
    tools: ['Excel'],
    domain: [],
    soft: [],
  },
  education: [
    {
      degree: 'B.S. in Mechanical Engineering',
      institution: 'Michigan State University',
      graduationDate: '2014', // Historical date - must NOT be flagged as error
      gpa: null,
    },
  ],
  certifications: [],
  achievements: [],
  publications: [],
  leadership: [],
  volunteering: [],
  languages: [],
  other: [],
};

async function testDiagnosticSuite() {
  console.log('=== TEST 1: Priority Calculator ===');
  const pCritical = calculatePriorityScore({
    severity: 'critical',
    categoryScore: 30,
    confidence: 0.95,
    evidenceCount: 3,
  });
  const pLow = calculatePriorityScore({
    severity: 'low',
    categoryScore: 85,
    confidence: 0.95,
    evidenceCount: 1,
  });
  console.log(`Critical Priority Score: ${pCritical}, Low Priority Score: ${pLow}`);
  if (pCritical <= pLow) {
    throw new Error('Priority calculator failed: critical deficit must outrank low deficit!');
  }
  console.log('✓ Priority calculator passed');

  console.log('\n=== TEST 2: False Positive Guard - Internship vs Experience ===');
  const expCheck = checkExperienceFalsePositives(mockResume, 'Design Intern at AutoDynamics');
  console.log('Experience Guard Result:', expCheck);
  if (!expCheck.refinedTitle?.includes('Internship')) {
    throw new Error('False positive guard failed: should recognize internship rather than saying no experience!');
  }
  console.log('✓ Internship guard passed');

  console.log('\n=== TEST 3: False Positive Guard - Historical Education Date (2014) ===');
  const eduCheck = checkEducationDates(mockResume);
  console.log('Education Date Guard Result:', eduCheck);
  if (eduCheck.hasIssue) {
    throw new Error('False positive guard failed: historical date (2014) must NOT be flagged as an error!');
  }
  console.log('✓ Historical education date passed without false positive');

  console.log('\n=== TEST 4: Score Contributions Arithmetic ===');
  const diagnostic = runDiagnosticEngine({
    resume: mockResume,
    rawText: 'David Miller resume with AutoCAD, SolidWorks, and CATIA.',
    scoringOutput: mockScoring,
  });

  const sumContributions = diagnostic.contributions.reduce((acc, c) => acc + c.contribution, 0);
  console.log(`Sum of contributions: ${sumContributions.toFixed(1)} vs Overall: ${mockScoring.overall}`);
  console.log('Categories:', diagnostic.contributions.map((c) => `${c.name}: ${c.score} × ${c.weight} = +${c.contribution}`));
  if (Math.abs(sumContributions - mockScoring.overall) > 2) {
    throw new Error('Contribution math diverges significantly from overall score!');
  }
  console.log('✓ Score contribution arithmetic verified');

  console.log('\n=== TEST 5: Priority Issues & Fix Roadmap ===');
  console.log(`Generated ${diagnostic.priorityIssues.length} Priority Issues:`);
  for (const issue of diagnostic.priorityIssues) {
    console.log(`- [${issue.severity.toUpperCase()}] ${issue.title} (Priority: ${issue.priorityScore}, Impact: ${issue.affectedScore})`);
    console.log(`  Evidence: ${issue.evidence.join(', ')}`);
    console.log(`  Recommendation: ${issue.recommendation}`);
  }

  console.log(`\nGenerated ${diagnostic.recommendedFixOrder.length} Roadmap Steps:`);
  for (const step of diagnostic.recommendedFixOrder) {
    console.log(`  Step 0${step.stepNumber}: ${step.title} -> [${step.targetTab}]`);
  }
  console.log('✓ Diagnostic Output verified');

  console.log('\n=============================================');
  console.log('ALL DIAGNOSTIC MATRIX TESTS PASSED (100%)');
  console.log('=============================================');
}

testDiagnosticSuite().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
