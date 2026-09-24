const fs = require('fs');

async function testPdfUploadAndAnalyze() {
  console.log('[TEST] Uploading sample text as PDF via FormData...');
  const formData = new FormData();
  const blob = new Blob([
    `ALEX RIVERA
San Francisco, CA | alex.rivera@email.com | (555) 234-5678 | linkedin.com/in/alexrivera-dev

PROFESSIONAL SUMMARY
Senior Full-Stack Software Engineer with 7+ years of experience architecting distributed cloud systems and high-throughput web applications. Scaled microservices to 10M+ daily active users.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Frameworks: React, Next.js, Node.js, Express
Cloud & DevOps: AWS (ECS, Lambda, S3, RDS), Docker, Kubernetes, CI/CD
Databases: PostgreSQL, Redis, MongoDB

PROFESSIONAL EXPERIENCE
Staff Software Engineer | NexaCloud Technologies | 2021 – Present
- Architected and deployed microservices backend processing 15M+ requests daily, improving system throughput by 42%.
- Spearheaded migration from monolithic architecture to containerized Kubernetes on AWS, cutting cloud costs by $180,000 annually.
- Mentored a cross-functional team of 8 engineers and introduced automated testing, reducing defect escape rate by 35%.

EDUCATION
Bachelor of Science in Computer Science | UC Berkeley | 2014 – 2018`
  ], { type: 'text/plain' });
  formData.append('resume', blob, 'Alex_Rivera_Resume.txt');

  const uploadRes = await fetch('http://localhost:5001/api/resume/upload', {
    method: 'POST',
    body: formData,
  });

  const uploadJson = await uploadRes.json();
  console.log('[TEST] Upload success. resumeId:', uploadJson.resumeId);

  const start = Date.now();
  const analyzeRes = await fetch('http://localhost:5001/api/resume/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId: uploadJson.resumeId }),
  });

  console.log('[TEST] Analyze status:', analyzeRes.status, 'in', Date.now() - start, 'ms');
  const analyzeJson = await analyzeRes.json();
  console.log('[TEST] Overall score:', analyzeJson.overall_score);
  console.log('[TEST] Recommendations count:', analyzeJson.recommendations?.length);
  console.log('[TEST] Bullet improvements count:', analyzeJson.bullet_point_improvements?.length);
  console.log('[TEST] Muse status:', analyzeJson.aiAnalysis?.museStatus);
}

testPdfUploadAndAnalyze().catch(console.error);
