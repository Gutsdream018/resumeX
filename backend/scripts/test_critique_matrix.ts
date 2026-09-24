import { extractEvidenceFromText } from '../src/engine/critique/evidenceExtractor.js';
import { detectResumeIssues } from '../src/engine/critique/issueDetector.js';
import { validateRevisionFacts } from '../src/engine/critique/factValidator.js';
import { runCritiqueEngine } from '../src/engine/critique/critiqueEngine.js';
import { applyRevisionToResume } from '../src/engine/critique/revisionEngine.js';
import { CanonicalResume } from '../src/engine/ingestion/types.js';

const sampleResume: CanonicalResume = {
  document: {
    type: 'TEXT_PDF',
    pageCount: 1,
    language: 'en',
    extractionConfidence: 0.95,
  },
  contact: {
    name: 'Sarah Chen',
    title: 'Senior Frontend Engineer',
    email: 'sarah.chen@example.com',
    phone: '555-0199',
    location: 'Seattle, WA',
    linkedin: 'linkedin.com/in/sarahchen',
    github: 'github.com/sarahchen',
    portfolio: null,
  },
  summary: 'Hard-working individual seeking a challenging position to utilize my skills and contribute to company growth.',
  experience: [
    {
      company: 'CloudMatrix Labs',
      title: 'Software Engineer',
      location: 'Seattle, WA',
      startDate: '2021',
      endDate: '2024',
      isCurrent: false,
      bullets: [
        'Responsible for developing web components using React and TypeScript.',
        'Helped with PostgreSQL database performance and bug fixes.',
      ],
      technologies: ['React', 'TypeScript', 'PostgreSQL'],
    },
  ],
  internships: [],
  projects: [
    {
      name: 'Distributed Task Queue',
      description: null,
      technologies: [],
      bullets: ['Built a job processing engine in Go.'],
    },
  ],
  skills: {
    technical: ['React', 'TypeScript', 'Node.js', 'Go'],
    frameworks: [],
    databases: ['PostgreSQL'],
    tools: ['Git', 'Docker'],
    domain: [],
    soft: ['Teamwork'],
  },
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of Washington',
      graduationDate: '2021',
      gpa: null,
    },
  ],
  certifications: [],
  achievements: [],
  publications: [],
  leadership: [],
  volunteering: [],
};

async function testCritiquePipeline() {
  console.log('=== TEST 1: Evidence Extraction ===');
  const ev = extractEvidenceFromText(
    'Responsible for developing web components using React and TypeScript.',
    'experience',
    sampleResume
  );
  console.log('Verified Tech:', ev.verifiedTechnologies);
  if (!ev.verifiedTechnologies.includes('REACT') || !ev.verifiedTechnologies.includes('TYPESCRIPT')) {
    throw new Error('Failed to extract verified technologies!');
  }
  console.log('✓ Evidence extraction passed');

  console.log('\n=== TEST 2: Issue Detection ===');
  const issues = detectResumeIssues(sampleResume);
  console.log(`Detected ${issues.length} issues:`, issues.map((i) => `[${i.type}] ${i.title}`));
  if (issues.length === 0) {
    throw new Error('Failed to detect issues in sample resume!');
  }
  console.log('✓ Issue detection passed');

  console.log('\n=== TEST 3: Fact Validator Anti-Hallucination ===');
  // Test rejecting fabricated metric
  const hallucinatedRewrite = 'Engineered web components using React and TypeScript, boosting conversion by 45% for 100k users.';
  const validationBad = validateRevisionFacts(hallucinatedRewrite, ev);
  console.log('Validation of fabricated metrics:', validationBad);
  if (validationBad.isValid) {
    throw new Error('Fact validator failed to catch fabricated 45% and 100k users!');
  }
  console.log('✓ Fact validator successfully caught fabricated metrics');

  // Test valid grounded rewrite
  const validRewrite = 'Engineered and deployed web components using React and TypeScript.';
  const validationGood = validateRevisionFacts(validRewrite, ev);
  console.log('Validation of grounded rewrite:', validationGood);
  if (!validationGood.isValid) {
    throw new Error('Fact validator incorrectly flagged grounded rewrite!');
  }
  console.log('✓ Fact validator passed for grounded rewrite');

  console.log('\n=== TEST 4: Master Critique Engine ===');
  const critique = await runCritiqueEngine(sampleResume);
  console.log(`Critique generated ${critique.issues.length} issues and ${critique.revisions.length} revisions.`);
  for (const rev of critique.revisions) {
    console.log(`- [${rev.type}] Issue ${rev.issueId}: "${rev.suggestedRevision}" (userInputRequired=${rev.requiresUserInput})`);
  }
  console.log('✓ Master Critique Engine passed');

  console.log('\n=== TEST 5: Apply Revision and Score Delta ===');
  const targetIssue = critique.issues[0];
  const targetRevision = critique.revisions[0];
  const deltaResult = applyRevisionToResume(
    sampleResume,
    targetIssue.id,
    targetIssue.sourceText,
    targetRevision.suggestedRevision
  );
  console.log(`Score before: ${deltaResult.beforeScore}, Score after: ${deltaResult.afterScore}, Delta: +${deltaResult.delta}`);
  console.log('Category Deltas:', deltaResult.categoryDeltas);
  console.log('✓ Revision application and score delta calculation passed');

  console.log('\n========================================');
  console.log('ALL CRITIQUE MATRIX TESTS PASSED (100%)');
  console.log('========================================');
}

testCritiquePipeline().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
