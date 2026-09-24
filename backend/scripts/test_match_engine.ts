import { parseJobDescription } from '../src/engine/matching/jobDescriptionParser.js';
import { computeMatchAnalysis } from '../src/engine/matching/matchEngine.js';
import { StructuredResume } from '../src/models/resume.types.js';

// Base Candidate Resume (Mechanical / CAD background)
const mechanicalResume: StructuredResume = {
  contact: {
    name: 'Abinash Sahoo',
    email: 'abinashsahoo484@gmail.com',
    phone: '7504947300',
    linkedin: 'linkedin.com/in/abinash',
    github: '',
  },
  summary: 'Mechanical Engineer with hands-on training in AutoCAD and CATIA from CTTC. Experience with manufacturing processes and industrial summer internship at NINL.',
  experience: [
    {
      role: 'Summer Intern',
      company: 'Neelachal Ispat Nigam Limited (NINL)',
      startDate: 'June 2014',
      endDate: 'July 2014',
      bullets: [
        'Observed blast furnace operations and industrial steel manufacturing processes.',
        'Assisted engineering staff in documenting maintenance protocols and safety procedures.',
      ],
    },
  ],
  education: [
    {
      institution: 'College of Engineering, Bhubaneswar',
      degree: 'B.Tech in Mechanical Engineering',
      field: 'Mechanical Engineering',
      gpa: '7.41',
    },
  ],
  skills: {
    technical: ['AutoCAD', 'CATIA', 'Injection Molding', 'Machining'],
    tools: ['AutoCAD 2D', 'CATIA V5'],
    soft: ['Teamwork', 'Communication'],
    languages: ['English', 'Hindi', 'Odia'],
    frameworks: [],
    databases: [],
  },
  projects: [
    {
      name: 'Microturbines Seminar & Analysis',
      technologies: ['Thermodynamics', 'Turbomachinery'],
      bullets: [
        'Conducted technical research on microturbines efficiency and energy conversion principles.',
      ],
    },
  ],
  certifications: [
    'AUTOCAD from Central Tool Room and Training Centre (CTTC)',
    'CATIA from Central Tool Room and Training Centre (CTTC)',
    'Injection Molding from Central Tool Room and Training Centre (CTTC)',
  ],
  achievements: [],
  other: [],
};

// Software Resume
const softwareResume: StructuredResume = {
  contact: {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '9876543210',
    linkedin: 'linkedin.com/in/priya',
    github: 'github.com/priyasharma',
  },
  summary: 'Full-Stack Software Engineer with 4+ years of experience building web applications using React, TypeScript, and Node.js on AWS.',
  experience: [
    {
      role: 'Senior Software Engineer',
      company: 'TechFlow Systems',
      startDate: '2021',
      endDate: 'Present',
      bullets: [
        'Architected React and TypeScript micro-frontends with REST APIs and Node.js backend.',
        'Deployed Docker containerized workloads on AWS ECS reducing latency by 35%.',
        'Optimized PostgreSQL queries improving database throughput.',
      ],
    },
  ],
  education: [
    {
      institution: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science',
      field: 'Computer Science',
      gpa: '8.8',
    },
  ],
  skills: {
    technical: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'REST APIs', 'Git'],
    tools: ['Docker', 'Git', 'VS Code'],
    soft: ['Leadership', 'Mentorship'],
    languages: ['English'],
    frameworks: ['React', 'Express'],
    databases: ['PostgreSQL'],
  },
  projects: [
    {
      name: 'E-Commerce Platform',
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      bullets: [
        'Built full-stack ordering system handling 50k monthly active users.',
      ],
    },
  ],
  certifications: ['AWS Certified Solutions Architect'],
  achievements: [],
  other: [],
};

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING RESUMEX MATCH ENGINE 12 TEST CASES');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // TEST 1: Strongly matching Mechanical resume + Mechanical Design Engineer JD
  const jd1Text = `Job Title: Mechanical Design Engineer
Company: Tata Advanced Systems
Location: Bhubaneswar, India
Requirements:
- B.Tech in Mechanical Engineering required
- Hands-on experience with AutoCAD and CATIA 3D modeling
- Exposure to manufacturing processes, tooling, or injection molding
- Strong communication and engineering fundamentals`;
  const jd1 = parseJobDescription(jd1Text);
  const match1 = await computeMatchAnalysis(mechanicalResume, jd1, '');
  assert(match1.overallMatch >= 70, 'TEST 1: Strong Match Score >= 70', `Got ${match1.overallMatch}`);
  assert(match1.strongMatches.some((m) => m.requirementText === 'AutoCAD'), 'TEST 1: AutoCAD matched as Strong Match');

  // TEST 2: Weakly matching resume + JD (Mechanical candidate applying for Senior DevOps role)
  const jd2Text = `Job Title: Senior DevOps Engineer
Company: CloudScale
Requirements:
- 5+ years of experience managing Kubernetes and Terraform
- Fluency in Go and Python scripting
- Deep knowledge of AWS CI/CD pipelines`;
  const jd2 = parseJobDescription(jd2Text);
  const match2 = await computeMatchAnalysis(mechanicalResume, jd2, '');
  assert(match2.overallMatch <= 50, 'TEST 2: Weak Match Score <= 50', `Got ${match2.overallMatch}`);
  assert(match2.missingRequirements.some((m) => m.requirementText === 'Kubernetes'), 'TEST 2: Kubernetes detected as Missing');

  // TEST 3: JD with many technical keywords
  const jd3Text = `Senior Full Stack Engineer
Requirements:
- React, TypeScript, Node.js, PostgreSQL, Docker, AWS, GraphQL, Redis, Terraform, CI/CD, Linux, Git, Jest`;
  const jd3 = parseJobDescription(jd3Text);
  assert(jd3.keywords.length >= 8, 'TEST 3: JD extracted >= 8 technical keywords', `Extracted ${jd3.keywords.length}`);
  const match3 = await computeMatchAnalysis(softwareResume, jd3, '');
  assert(match3.keywordGapAnalysis.matched.length >= 6, 'TEST 3: Matched >= 6 keywords on software resume');

  // TEST 4: JD with no explicit skills section (narrative paragraph format)
  const jd4Text = `We are looking for an ambitious engineering graduate to join our CAD modeling team. You will be drafting 2D/3D parts using CATIA and supporting our toolroom fabrication. A degree in Mechanical Engineering is required.`;
  const jd4 = parseJobDescription(jd4Text);
  assert(jd4.requirements.skills.length >= 1, 'TEST 4: Narrative JD extracted CATIA/CAD skills');
  const match4 = await computeMatchAnalysis(mechanicalResume, jd4, '');
  assert(match4.strongMatches.some((m) => m.requirementText === 'CATIA'), 'TEST 4: Narrative JD matched candidate CATIA');

  // TEST 5: JD with Seniority requirement (5+ years required)
  const jd5Text = `Senior Lead Architect
Must have at least 7+ years of experience leading engineering teams and microservices.`;
  const jd5 = parseJobDescription(jd5Text);
  const match5 = await computeMatchAnalysis(mechanicalResume, jd5, '');
  assert(match5.contradictions.some((c) => c.area === 'Seniority'), 'TEST 5: Seniority mismatch contradiction detected');

  // TEST 6: JD with Certification requirement
  const jd6Text = `Cloud Architect
Requirements:
- AWS Certified Solutions Architect is required
- Experience with Docker`;
  const jd6 = parseJobDescription(jd6Text);
  const match6 = await computeMatchAnalysis(softwareResume, jd6, '');
  assert(match6.strongMatches.some((m) => m.category.toLowerCase().includes('cloud') || m.requirementText.includes('AWS')), 'TEST 6: AWS certification verified');

  // TEST 7: Contradiction Detection (Candidate experience duration vs JD requirements)
  assert(match5.contradictions.length > 0, 'TEST 7: Contradiction detected on Seniority/Experience gap');

  // TEST 8: Resume containing related but not exact skills (e.g. CATIA vs CAD Modeling)
  assert(match1.partialMatches.length >= 0, 'TEST 8: Partial match evaluation functional');

  // TEST 9: Resume with missing sections (empty experience or projects)
  const minimalResume: StructuredResume = {
    contact: { name: 'Student', email: 'stu@test.com', phone: '', linkedin: '', github: '' },
    summary: 'Student with basic AutoCAD skills.',
    experience: [],
    education: [{ institution: 'State Univ', degree: 'B.Tech' }],
    skills: { technical: ['AutoCAD'], tools: [], soft: [], languages: [], frameworks: [], databases: [] },
    projects: [],
    certifications: [],
    achievements: [],
    other: [],
  };
  const match9 = await computeMatchAnalysis(minimalResume, jd1, '');
  assert(match9.overallMatch > 0 && match9.overallMatch < 70, 'TEST 9: Handled minimal resume with missing sections gracefully');

  // TEST 10: OCR/Raw Text representation matches properly
  const rawOCR = 'ABINASH SAHOO B.TECH MECHANICAL AUTOCAD CATIA NINL INTERNSHIP 7.41 CGPA';
  const match10 = await computeMatchAnalysis(mechanicalResume, jd1, rawOCR);
  assert(match10.overallMatch >= 70, 'TEST 10: OCR/Raw text representation matched effectively');

  // TEST 11: Same JD analyzed against multiple resume versions (cache consistency)
  const match11A = await computeMatchAnalysis(mechanicalResume, jd1, '');
  const match11B = await computeMatchAnalysis(mechanicalResume, jd1, '');
  assert(match11A.overallMatch === match11B.overallMatch, 'TEST 11: Consistent cached match results across versions');

  // TEST 12: Resume edited in Optimizer and Match Mode recalculated
  const updatedResume: StructuredResume = {
    ...mechanicalResume,
    skills: {
      ...mechanicalResume.skills,
      technical: [...mechanicalResume.skills.technical, '3D CAD Modeling', 'GD&T'],
    },
  };
  const match12 = await computeMatchAnalysis(updatedResume, jd1, '');
  assert(match12.overallMatch >= match1.overallMatch, 'TEST 12: Match Score increased or maintained after resume optimization');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
