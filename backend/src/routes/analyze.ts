import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware } from '../services/fileProcessor.js';
import { extractTextFromBuffer, ExtractionError } from '../services/textExtractor.js';
import { evaluateResumeText } from '../services/aiEvaluator.js';
import { SampleResume } from '../types/index.js';

export const analyzeRouter = Router();

/**
 * Curated sample resumes for immediate 1-click testing in UI
 */
export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'senior-swe',
    title: 'Senior Full-Stack Engineer',
    role: 'Senior Software Engineer',
    experience_level: 'Senior (7+ years)',
    expected_score_range: '85 - 95',
    description: 'Impact-driven resume with strong metrics, clear tech stack, and ATS-friendly layout.',
    content: `ALEX RIVERA
San Francisco, CA | (555) 234-5678 | alex.rivera@email.com | linkedin.com/in/alexrivera-dev | github.com/alexrivera

PROFESSIONAL SUMMARY
Senior Full-Stack Software Engineer with 7+ years of experience architecting distributed cloud systems and high-throughput web applications. Proven track record scaling microservices to 10M+ daily active users and mentoring engineering teams.

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Python, Go, SQL
- Frameworks: React, Next.js, Node.js, Express, TailwindCSS
- Cloud & DevOps: AWS (ECS, Lambda, S3, RDS), Docker, Kubernetes, CI/CD (GitHub Actions), Terraform
- Databases: PostgreSQL, Redis, MongoDB, DynamoDB

PROFESSIONAL EXPERIENCE
Staff Software Engineer | NexaCloud Technologies | San Francisco, CA | 2021 – Present
- Architected and deployed microservices backend processing 15M+ requests daily, improving system throughput by 42%.
- Spearheaded migration from monolithic architecture to containerized Kubernetes on AWS, cutting cloud infrastructure costs by $180,000 annually.
- Mentored a cross-functional team of 8 engineers and introduced automated end-to-end testing, reducing production defect escape rate by 35%.
- Implemented Redis caching strategy that slashed average API response latency from 450ms to 65ms.

Senior Full-Stack Developer | Velocity Digital | San Jose, CA | 2018 – 2021
- Developed interactive customer onboarding flow in React and TypeScript, boosting conversion rates by 28%.
- Designed resilient GraphQL and REST APIs integrating with Stripe billing, processing over $12M in annual recurring transactions.
- Automated deployment pipelines using Docker and GitHub Actions, decreasing release cycle duration by 60%.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2014 – 2018`,
  },
  {
    id: 'average-dev',
    title: 'Software Developer (Needs Improvement)',
    role: 'Software Developer',
    experience_level: 'Mid-Level (3 years)',
    expected_score_range: '60 - 72',
    description: 'Typical average resume with passive bullet points and minimal quantifiable metrics.',
    content: `JOHN DOE
john.doe@email.com | 555-987-6543

SUMMARY
Software developer with experience in web technologies looking for new opportunities in software engineering.

SKILLS
JavaScript, React, Node.js, HTML, CSS, Git, MongoDB, Express

WORK EXPERIENCE
Software Developer | Tech Solutions Inc. | 2021 - Present
- Responsible for developing web applications using React.
- Worked on fixing bugs and improving front-end components.
- Helped with database design and backend API development in Node.js.
- Participated in weekly agile sprint meetings and code reviews.
- Handled deployment tasks on cloud servers.

Junior Programmer | CodeCraft Labs | 2019 - 2021
- Worked on website updates for client projects.
- Assisted in writing unit tests for web features.
- Supported senior developers with debugging and documentation.

EDUCATION
B.S. in Computer Science | State College | 2019`,
  },
  {
    id: 'weak-flawed',
    title: 'Flawed Resume (Critical Issues & Weak Bullets)',
    role: 'Junior Web Developer',
    experience_level: 'Junior (1 year)',
    expected_score_range: '40 - 55',
    description: 'Contains first-person pronouns, zero metrics, passive duty language, and missing sections.',
    content: `David Miller
davidm@somemail.com

I am an enthusiastic web developer who loves coding and learning new frameworks. I am eager to contribute to a great engineering team.

My Experience:
Web Dev Intern at StartUp Studio
- I was responsible for making pages look nice using CSS.
- I helped team members with whatever tasks they needed done.
- Worked on various company websites and fixed issues.
- Duties included updating text and uploading images.

Skills:
HTML, CSS, basic Javascript`,
  },
];

/**
 * POST /api/analyze
 * Multipart file upload (PDF, DOCX, TXT)
 */
analyzeRouter.post('/analyze', uploadMiddleware.single('resume'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No resume file uploaded. Please upload a PDF, DOCX, TXT, PNG, or JPG document.',
      });
    }

    // 1. Text Extraction (with OCR fallback for images and scanned PDFs)
    const extracted = await extractTextFromBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // 2. AI / Heuristic Evaluation
    const fileType = req.file.originalname.split('.').pop()?.toLowerCase();
    const analysis = await evaluateResumeText(extracted.text, {
      extractionMethod: extracted.extraction_method,
      fileType,
    });
    analysis.metadata.file_type = fileType;
    analysis.metadata.extraction_method = extracted.extraction_method;
    analysis.metadata.preserved_document = extracted.preserved_document;
    analysis.metadata.raw_text = extracted.text;

    return res.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    if (err instanceof ExtractionError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * POST /api/analyze-text
 * Raw text body analysis
 */
analyzeRouter.post('/analyze-text', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Please provide resume text to evaluate.',
      });
    }

    const analysis = await evaluateResumeText(text);
    return res.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    return next(err);
  }
});

/**
 * GET /api/sample-resumes
 * Provides test sample resumes
 */
analyzeRouter.get('/sample-resumes', (req: Request, res: Response) => {
  return res.json({
    success: true,
    samples: SAMPLE_RESUMES.map(({ content, ...rest }) => rest),
  });
});

/**
 * GET /api/sample-resumes/:id
 * Fetch a specific sample resume's full content
 */
analyzeRouter.get('/sample-resumes/:id', (req: Request, res: Response) => {
  const sample = SAMPLE_RESUMES.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Sample resume not found.' });
  }
  return res.json({ success: true, sample });
});
