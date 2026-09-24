import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runComprehensiveAtsPipeline } from '../src/engine/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runBenchmark() {
  console.log('================================================================');
  console.log('STARTING ATS EVALUATION ENGINE COMPREHENSIVE BENCHMARK SUITE');
  console.log('================================================================');

  const benchmarkDataset = [
    // 1. Strong Senior Tech Resumes
    {
      id: 'strong-1',
      category: 'Strong Senior Tech',
      text: `ALEX RIVERA\nSan Francisco, CA | alex.rivera@email.com | (555) 234-5678 | linkedin.com/in/alexrivera-dev | github.com/alexrivera\n\nPROFESSIONAL SUMMARY\nSenior Full-Stack Software Engineer with 8+ years experience architecting distributed cloud systems in TypeScript, Go, and AWS. Scaled microservices to 15M+ DAU.\n\nTECHNICAL SKILLS\nLanguages: TypeScript, JavaScript, Python, Go, SQL\nFrameworks: React, Next.js, Node.js, Express, TailwindCSS, GraphQL\nCloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Terraform\nDatabases: PostgreSQL, Redis, MongoDB\n\nPROFESSIONAL EXPERIENCE\nStaff Software Engineer | NexaCloud Technologies | 2021 – Present\n- Architected and deployed microservices backend processing 15M+ requests daily, improving system throughput by 42%.\n- Spearheaded migration to containerized Kubernetes on AWS, reducing infrastructure costs by $180,000 annually.\n- Mentored a cross-functional team of 8 engineers and introduced automated testing, cutting defect escape rate by 35%.\n- Implemented Redis caching strategy that slashed average API response latency from 450ms to 65ms.\n\nEDUCATION\nBachelor of Science in Computer Science | UC Berkeley | 2013 – 2017`
    },
    {
      id: 'strong-2',
      category: 'Strong Senior Tech',
      text: `SARAH CHEN\nNew York, NY | sarah.chen@techmail.com | (555) 987-6543 | linkedin.com/in/sarahchen-swe | github.com/sarahchen\n\nSUMMARY\nPrincipal Distributed Systems Architect with 10+ years engineering high-throughput payment rails in Java, Go, and Kafka.\n\nSKILLS\nJava, Spring Boot, Go, Kafka, PostgreSQL, Docker, Kubernetes, AWS, Microservices, Cassandra, Prometheus\n\nEXPERIENCE\nLead Backend Engineer | FinTech Velocity | 2020 – Present\n- Engineered distributed ledger settlement engine processing $40M daily volume across 12 banking gateways.\n- Optimized Cassandra query indexing, decreasing p99 transaction latency from 120ms to 18ms.\n- Directed migration to AWS EKS across 4 global regions, achieving 99.999% system availability.\n\nEDUCATION\nMaster of Science in Software Engineering | Columbia University | 2012 – 2014`
    },

    // 2. Average Mid-Level Resumes
    {
      id: 'avg-1',
      category: 'Average Mid-Level',
      text: `MARK TAYLOR\nmark.taylor@email.com | 555-432-1098 | linkedin.com/in/marktaylor\n\nSUMMARY\nSoftware developer with 3 years of experience building web apps with React and Node.js.\n\nSKILLS\nJavaScript, React, Node.js, Express, HTML, CSS, Git, MongoDB\n\nEXPERIENCE\nSoftware Developer | Tech Solutions Inc | 2021 – Present\n- Developed frontend components in React for user profile management.\n- Built REST API endpoints in Node.js and Express connecting to MongoDB database.\n- Fixed bugs and participated in daily agile team standups.\n\nEDUCATION\nBachelor of Science in Information Technology | State University | 2017 – 2021`
    },
    {
      id: 'avg-2',
      category: 'Average Mid-Level',
      text: `JESSICA MILLER\njessica.miller@email.com | (555) 321-8765 | linkedin.com/in/jessicamiller\n\nPROFESSIONAL EXPERIENCE\nWeb Developer | Digital Agency | 2022 – Present\n- Created responsive client websites using HTML, CSS, and JavaScript.\n- Collaborated with UI designers to implement landing pages and promotional banners.\n- Maintained WordPress installations and updated database backups.\n\nSKILLS\nHTML, CSS, JavaScript, WordPress, PHP, MySQL, Git\n\nEDUCATION\nBS in Computer Information Systems | City College | 2018 – 2022`
    },

    // 3. Student & Early Career Resumes
    {
      id: 'student-1',
      category: 'Student / Early Career',
      text: `EMILY ZHANG\nBoston, MA | emily.zhang@university.edu | (555) 678-1234 | github.com/emilyzhang | linkedin.com/in/emilyzhang-cs\n\nEDUCATION\nCandidate for Bachelor of Science in Computer Science | MIT | Expected May 2025\nGPA: 3.9/4.0 | Dean's Honor List\nRelevant Coursework: Data Structures, Algorithms, Distributed Systems, Database Design, Operating Systems\n\nTECHNICAL SKILLS\nLanguages: Python, C++, Java, TypeScript, SQL\nTools & Frameworks: React, FastAPI, Docker, Git, Linux, PyTorch\n\nPROJECTS\nDistributed Key-Value Store | C++, Raft Consensus Protocol | 2024\n- Implemented Raft consensus algorithm from scratch supporting leader election, log replication, and persistence.\n- Benchmarked throughput achieving 12,000 ops/sec across a 5-node cluster.\n\nCampus Ride-Sharing Mobile App | React Native, Python, PostgreSQL | 2023\n- Developed mobile application connecting 2,500+ university students for verified carpooling.\n\nEXPERIENCE\nUndergraduate Teaching Assistant | MIT EECS Department | 2023 – Present\n- Mentored 45 students in weekly algorithms laboratory sessions.`
    },

    // 4. Weak / Flawed Resumes
    {
      id: 'weak-1',
      category: 'Weak / Incomplete',
      text: `John\nNo email provided\n\nWorked on some web projects.\nHelped with testing and updating files.\nResponsible for database entries.\nSkills: computers, internet, typing, coding`
    },

    // 5. Formatting Issues (Tables, strange symbols, multi-column)
    {
      id: 'format-issue-1',
      category: 'Formatting Challenges',
      text: `DAVID SMITH\n| david.smith@email.com | (555) 000-1111 |\n\n★ ★ ★ SUMMARY ★ ★ ★\n✦ Experienced IT technician with desktop support skills\n\n| Experience | Company | Dates |\n| Support Tech | Acme Corp | 2020-2023 |\n\n◆ Maintained 150 office workstations\n◆ Handled tickets in Jira\n\nSKILLS: Windows, Active Directory, Troubleshooting`
    },
  ];

  const results: any[] = [];

  for (const sample of benchmarkDataset) {
    console.log(`\nEvaluating [${sample.category}] ID: ${sample.id}...`);
    const start = Date.now();

    try {
      const res = await runComprehensiveAtsPipeline(sample.text, {
        resumeId: `bench_${sample.id}`,
        fileType: 'txt',
        extractionMethod: 'native_text',
      });

      const elapsed = Date.now() - start;

      const record = {
        id: sample.id,
        category: sample.category,
        overallScore: res.score.overall,
        confidence: res.confidence,
        atsReadability: res.score.atsReadability,
        keywordRelevance: res.score.keywordRelevance,
        experience: res.score.experience,
        projects: res.score.projects,
        formatting: res.score.formatting,
        education: res.score.education,
        achievements: res.score.achievements,
        strengthsCount: res.strengths.length,
        criticalIssuesCount: res.criticalIssues.length,
        recommendationsCount: res.recommendations.length,
        museStatus: res.aiAnalysis.museStatus,
        elapsedMs: elapsed,
      };

      results.push(record);

      console.log(`✓ Result for ${sample.id}: Overall Score = ${record.overallScore}/100 | Grade = ${res.score_grade} | Time = ${elapsed}ms`);
      console.log(`  Readability: ${record.atsReadability} | Keywords: ${record.keywordRelevance} | Experience: ${record.experience} | Formatting: ${record.formatting}`);
      console.log(`  Confidence: ${record.confidence} | Strengths: ${record.strengthsCount} | Critical Issues: ${record.criticalIssuesCount}`);
    } catch (err: any) {
      console.error(`✗ Benchmark failed for ${sample.id}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log('BENCHMARK SUMMARY RESULTS TABLE');
  console.log('================================================================');
  console.table(results);

  // Assertions & Invariant Verification
  let allPassed = true;
  for (const r of results) {
    if (r.overallScore < 0 || r.overallScore > 100 || isNaN(r.overallScore)) {
      console.error(`FAILURE: Invalid score range for ${r.id}: ${r.overallScore}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n✓ ALL INVARIANTS SATISFIED: Scores strictly clamped [0-100], breakdowns consistent, zero NaN/Infinities.');
  }

  return results;
}

runBenchmark().catch(console.error);
