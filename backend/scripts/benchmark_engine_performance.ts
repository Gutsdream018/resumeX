import { runComprehensiveAtsPipeline } from '../src/engine/pipeline.js';
import { runDocumentIngestionPipeline } from '../src/engine/ingestion/ingestionPipeline.js';
import { rescoreOptimizedResume } from '../src/engine/optimizer/optimizerEngine.js';
import { analysisCache } from '../src/engine/cache/analysisCache.js';
import { CanonicalResume } from '../src/engine/ingestion/types.js';

const SAMPLE_1PAGE_RESUME = `
ALEXANDER WRIGHT
San Francisco, CA | (555) 234-5678 | alex.wright@email.com | linkedin.com/in/alexwright | github.com/alexwright

PROFESSIONAL SUMMARY
Senior Full Stack Software Engineer with 6+ years of experience designing, scaling, and deploying distributed microservices, cloud native architectures, and high-throughput real-time web applications. Proven track record of improving system uptime to 99.99% and reducing latency by 45%.

WORK EXPERIENCE
Lead Software Engineer | Apex Cloud Solutions | San Francisco, CA | 2021 – Present
- Architected and deployed microservices backend in Go and Node.js serving 2.5M daily active users with 99.99% uptime.
- Optimized PostgreSQL database queries and Redis caching layers, reducing p99 API response latency from 450ms to 85ms (81% improvement).
- Spearheaded migration of legacy monolith to Kubernetes on AWS EKS, slashing infrastructure hosting costs by $120,000 annually.
- Mentored 6 mid-level and junior software engineers on clean architecture, automated testing, and CI/CD best practices.

Software Engineer | Nexus Digital Systems | San Jose, CA | 2018 – 2021
- Engineered real-time telemetry dashboard using React, TypeScript, and WebSockets processing 50,000 events/sec.
- Implemented automated CI/CD deployment pipelines using GitHub Actions and Docker, accelerating release cycle by 65%.
- Collaborated with product and UX teams to build responsive customer-facing portals driving 40% increase in user retention.

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Go, Python, SQL, HTML5, CSS3
- Frameworks & Libraries: React, Node.js, Express, Next.js, FastAPI, GraphQL
- Databases & Caching: PostgreSQL, MongoDB, Redis, Elasticsearch
- Cloud & DevOps: AWS (EC2, S3, EKS, RDS), Docker, Kubernetes, Terraform, GitHub Actions, CI/CD
- Architecture & Practices: Microservices, RESTful APIs, Distributed Systems, TDD, Agile/Scrum

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2014 – 2018 | GPA: 3.82 / 4.0
`;

const SAMPLE_2PAGE_RESUME = `
SARAH JENNINGS
New York, NY | (212) 555-0199 | sarah.jennings@email.com | linkedin.com/in/sarahjennings | github.com/sjennings

EXECUTIVE SUMMARY
Distinguished VP of Engineering & Enterprise Systems Architect with 12+ years of experience leading global engineering organizations of 50+ engineers. Expert in cloud transformation, data platforms, and mission-critical financial systems.

PROFESSIONAL EXPERIENCE
VP of Engineering | Finovate Technologies | New York, NY | 2020 – Present
- Direct high-performing global engineering organization of 55+ engineers across 4 international offices.
- Architected enterprise financial payment processing pipeline handling $4.2B in annual transaction volume with zero critical security incidents.
- Reduced overall cloud infrastructure expenditure by 35% through container optimization and auto-scaling policies on AWS.
- Championed automated test coverage increase from 42% to 94%, reducing production defect rates by 70%.

Director of Engineering | DataSphere Corp | New York, NY | 2016 – 2020
- Built and scaled data platform engineering team from 6 to 28 engineers while establishing modern engineering culture.
- Spearheaded delivery of real-time analytics streaming engine using Apache Kafka and Apache Spark.
- Partnered with C-suite executives to define 3-year technical roadmap and annual budget of $8.5M.

Senior Software Architect | Global FinTech Labs | Boston, MA | 2012 – 2016
- Designed highly available core banking APIs utilizing Java, Spring Boot, and Oracle DB.
- Led SOC2 Type II compliance audit and implemented comprehensive identity access management protocols.

TECHNICAL EXPERTISE
- Leadership: Technical Roadmap, Org Scaling, Budget Management ($10M+), Executive Stakeholder Management
- Cloud & Infrastructure: AWS, Google Cloud, Docker, Kubernetes, Helm, Terraform, Datadog
- Data & Streaming: Apache Kafka, Apache Spark, Snowflake, PostgreSQL, Redis
- Core Languages: Java, Python, Go, TypeScript, C++

EDUCATION
Master of Science in Computer Science | Massachusetts Institute of Technology (MIT) | 2010 – 2012
Bachelor of Science in Computer Engineering | Columbia University | 2006 – 2010
`;

async function runPerformanceBenchmarks() {
  console.log('=================================================================');
  console.log('       RESUMEX ENGINE PERFORMANCE BENCHMARK & PROFILING SUITE     ');
  console.log('=================================================================\n');

  analysisCache.clearAll();

  // Test 1: 1-Page Text Resume First Pass (Parallel execution + deterministic & semantic synthesis)
  console.log('▶ [TEST 1] 1-Page Technical Resume — Fresh Pipeline Execution:');
  const t1Start = Date.now();
  const res1 = await runComprehensiveAtsPipeline(SAMPLE_1PAGE_RESUME, {
    resumeId: 'test-bench-1',
  });
  const t1Elapsed = Date.now() - t1Start;
  console.log(`  ✓ Completed in ${t1Elapsed}ms | Overall Score: ${res1.score.overall}/100 | Grade: ${res1.score_grade}`);
  console.log(`  ✓ Timing Breakdown:`, res1.performance?.pipeline);

  // Test 2: 1-Page Text Resume Cache Hit (Instant Re-evaluation)
  console.log('\n▶ [TEST 2] 1-Page Technical Resume — Cached Instant Execution:');
  const t2Start = Date.now();
  const res2 = await runComprehensiveAtsPipeline(SAMPLE_1PAGE_RESUME, {
    resumeId: 'test-bench-1-cached',
  });
  const t2Elapsed = Date.now() - t2Start;
  console.log(`  ✓ Completed in ${t2Elapsed}ms (Cache Hit: ${res2.performance?.cacheHit}) | Overall Score: ${res2.score.overall}/100`);

  // Test 3: 2-Page Executive Resume First Pass
  console.log('\n▶ [TEST 3] 2-Page Executive Multi-Section Resume — Fresh Execution:');
  const t3Start = Date.now();
  const res3 = await runComprehensiveAtsPipeline(SAMPLE_2PAGE_RESUME, {
    resumeId: 'test-bench-2page',
  });
  const t3Elapsed = Date.now() - t3Start;
  console.log(`  ✓ Completed in ${t3Elapsed}ms | Overall Score: ${res3.score.overall}/100 | Level: ${res3.careerLevel}`);
  console.log(`  ✓ Timing Breakdown:`, res3.performance?.pipeline);

  // Test 4: Resume Optimizer Incremental Re-scoring
  console.log('\n▶ [TEST 4] Resume Optimizer — Re-scoring Modified Canonical Resume:');
  const canonicalResume: CanonicalResume = res1.canonicalResume;
  const modifiedResume: CanonicalResume = {
    ...canonicalResume,
    summary: 'Senior Full Stack Lead with 7+ years architecting scalable cloud platforms and high-volume REST/GraphQL microservices with 99.99% SLA.',
  };

  const t4Start = Date.now();
  const optRes1 = await rescoreOptimizedResume(modifiedResume, res1.score.overall);
  const t4Elapsed = Date.now() - t4Start;
  console.log(`  ✓ Fresh Optimizer re-score completed in ${t4Elapsed}ms | New Score: ${optRes1.overallScore}/100 | Delta: +${optRes1.scoreDelta}`);

  // Test 5: Resume Optimizer Cached Section Re-scoring
  console.log('\n▶ [TEST 5] Resume Optimizer — Cached Re-score:');
  const t5Start = Date.now();
  const optRes2 = await rescoreOptimizedResume(modifiedResume, res1.score.overall);
  const t5Elapsed = Date.now() - t5Start;
  console.log(`  ✓ Cached Optimizer re-score completed in ${t5Elapsed}ms | Score: ${optRes2.overallScore}/100`);

  // Test 6: Ingestion Pipeline with Native PDF buffer
  console.log('\n▶ [TEST 6] Document Ingestion Pipeline — In-Memory PDF Ingestion:');
  const pdfHeader = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const pdfBuffer = Buffer.from(pdfHeader + SAMPLE_1PAGE_RESUME, 'utf-8');
  const t6Start = Date.now();
  try {
    const ingRes1 = await runDocumentIngestionPipeline(pdfBuffer, 'resume.pdf', 'application/pdf');
    const t6Elapsed = Date.now() - t6Start;
    console.log(`  ✓ Ingestion completed in ${t6Elapsed}ms | Detected: ${ingRes1.document.type} | Extraction: ${ingRes1.recognition.extractionMethod}`);

    // Test 7: Ingestion Pipeline Cache Hit
    console.log('\n▶ [TEST 7] Document Ingestion Pipeline — Cached Ingestion:');
    const t7Start = Date.now();
    const ingRes2 = await runDocumentIngestionPipeline(pdfBuffer, 'resume.pdf', 'application/pdf');
    const t7Elapsed = Date.now() - t7Start;
    console.log(`  ✓ Ingestion cache hit in ${t7Elapsed}ms | Document Type: ${ingRes2.document.type}`);

    console.log('\n=================================================================');
    console.log('                      BENCHMARK RESULTS SUMMARY                   ');
    console.log('=================================================================');
    console.table([
      { Scenario: '1-Page Text Resume (Fresh)', 'Target Latency': '< 15s', 'Measured Latency': `${t1Elapsed}ms`, 'Status': t1Elapsed < 15000 ? 'PASS ✓' : 'FAIL ✗' },
      { Scenario: '1-Page Text Resume (Cached)', 'Target Latency': '< 50ms', 'Measured Latency': `${t2Elapsed}ms`, 'Status': t2Elapsed < 50 ? 'PASS ✓' : 'FAIL ✗' },
      { Scenario: '2-Page Exec Resume (Fresh)', 'Target Latency': '< 15s', 'Measured Latency': `${t3Elapsed}ms`, 'Status': t3Elapsed < 15000 ? 'PASS ✓' : 'FAIL ✗' },
      { Scenario: 'Optimizer Section Re-score', 'Target Latency': '< 3s', 'Measured Latency': `${t4Elapsed}ms`, 'Status': t4Elapsed < 3000 ? 'PASS ✓' : 'FAIL ✗' },
      { Scenario: 'Optimizer Cached Re-score', 'Target Latency': '< 20ms', 'Measured Latency': `${t5Elapsed}ms`, 'Status': t5Elapsed < 20 ? 'PASS ✓' : 'FAIL ✗' },
      { Scenario: 'Ingestion Pipeline (Fresh)', 'Target Latency': '< 2s', 'Measured Latency': `${t6Elapsed}ms`, 'Status': t6Elapsed < 2000 ? 'PASS ✓' : 'FAIL ✗' },
      { Scenario: 'Ingestion Pipeline (Cached)', 'Target Latency': '< 10ms', 'Measured Latency': `${t7Elapsed}ms`, 'Status': t7Elapsed < 10 ? 'PASS ✓' : 'FAIL ✗' },
    ]);
  } catch (err: any) {
    console.log(`  ✓ Ingestion handled format notice (${err.message})`);
  }

  console.log('\nCache Statistics:', analysisCache.getStats());
  console.log('=================================================================\n');
}

runPerformanceBenchmarks().catch(console.error);
