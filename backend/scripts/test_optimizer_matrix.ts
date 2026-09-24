import { rescoreOptimizedResume, evaluateExportQuality } from '../src/engine/optimizer/optimizerEngine.js';
import { detectMissingInformation } from '../src/engine/optimizer/missingInfoEngine.js';
import { generateFactGuidedRewrite } from '../src/engine/optimizer/factGuidedRewriter.js';
import { CanonicalResume } from '../src/types/resume.js';

const sampleResume: CanonicalResume = {
  contact: {
    name: 'Jordan Mitchell',
    email: 'jordan.mitchell@example.com',
    phone: '555-0199',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/jordanm',
    github: 'github.com/jordanm',
  },
  summary: 'Full-Stack Software Engineer with 5+ years of experience designing high-throughput distributed systems and cloud APIs.',
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Apex Cloud Solutions',
      location: 'San Francisco, CA',
      startDate: '2021-03',
      endDate: 'Present',
      bullets: [
        'Responsible for backend development and database maintenance.',
        'Architected real-time event streaming pipeline using Kafka and Go, reducing data ingestion latency by 42% across 10M daily events.',
      ],
      technologies: ['Go', 'Kafka', 'PostgreSQL', 'Docker', 'Kubernetes'],
    },
    {
      title: 'Software Engineer',
      company: 'DataVantage Inc',
      location: 'Austin, TX',
      startDate: '2019-01',
      endDate: '2021-02',
      bullets: [
        'Built REST APIs and worked on user authentication.',
        'Migrated legacy monolith to AWS ECS microservices, improving deployment frequency from bi-weekly to daily.',
      ],
      technologies: ['Node.js', 'TypeScript', 'AWS', 'MongoDB'],
    },
  ],
  education: [
    {
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science in Computer Science',
      graduationDate: '2018-12',
      gpa: '3.8',
    },
  ],
  skills: {
    technical: ['TypeScript', 'Go', 'Python', 'Node.js', 'React', 'Kubernetes', 'AWS', 'Docker', 'Kafka', 'PostgreSQL'],
    tools: ['Git', 'Jira', 'Postman'],
  },
  projects: [
    {
      name: 'Distributed Cache System',
      description: 'Engineered an in-memory distributed cache with Raft consensus protocol handling 50k ops/sec.',
      technologies: ['Go', 'Raft', 'Redis'],
    },
  ],
  certifications: ['AWS Certified Solutions Architect – Associate'],
  achievements: ['Won 1st Place at Austin Tech Hackathon 2020'],
};

async function runTests() {
  console.log('=== TEST 1: Re-score Canonical Resume ===');
  const rescoreResult = await rescoreOptimizedResume(sampleResume, 65);
  console.log('Baseline Score:', 65);
  console.log('New Overall Score:', rescoreResult.overallScore);
  console.log('Score Delta:', rescoreResult.scoreDelta);
  console.log('Category Scores:', JSON.stringify(rescoreResult.categoryScores, null, 2));
  console.log('Section Health Scores Count:', rescoreResult.sectionHealth.length);
  rescoreResult.sectionHealth.forEach(s => {
    console.log(`  - Section [${s.section}] (${s.name}): score=${s.score}, issues=${s.issueCount}, status=${s.status}`);
  });

  console.log('\n=== TEST 2: Missing Information Analysis ===');
  const weakBullet = 'Responsible for backend development and database maintenance.';
  const prompt = detectMissingInformation(weakBullet, 'experience', 'b1');
  console.log('Analyzed bullet:', weakBullet);
  console.log('Missing Dimensions detected:', prompt.detectedMissing);
  console.log('Prompt reason:', prompt.reason);
  console.log('Form fields:');
  prompt.fields.forEach(f => {
    console.log(`  - [${f.key}] (${f.label}): placeholder="${f.placeholder}"`);
  });

  console.log('\n=== TEST 3: Fact-Guided Rewrite ===');
  const rewriteResult = generateFactGuidedRewrite({
    originalText: weakBullet,
    section: 'experience',
    userFacts: {
      technology: 'Node.js, PostgreSQL, Redis',
      metric: '35% latency reduction across 500k daily requests',
      purpose: 'high-concurrency payment microservices',
    },
  });

  console.log('Original Text:', rewriteResult.originalText);
  console.log('Suggested Revision:', rewriteResult.suggestedRevision);
  console.log('Is Valid Grounded:', rewriteResult.isValid);
  console.log('Verified Facts:', rewriteResult.verifiedFacts);
  console.log('Explanation:', rewriteResult.explanation);

  console.log('\n=== TEST 4: Pre-Export Quality Checks ===');
  const qualityReport = evaluateExportQuality(sampleResume, rescoreResult.overallScore);
  console.log('Is Export Ready:', qualityReport.readyToExport);
  console.log('Optimization Progress:', qualityReport.optimizationProgress + '%');
  console.log('Checks Summary:');
  qualityReport.checks.forEach(c => {
    console.log(`  [${c.passed ? 'PASS' : 'WARN'}] ${c.title} (${c.severity}): ${c.message}`);
  });

  console.log('\n========================================');
  console.log('ALL OPTIMIZER TESTS COMPLETED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
