import * as napiCanvas from '@napi-rs/canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { runDocumentIngestionPipeline } from '../src/engine/ingestion/ingestionPipeline.js';
import { validateFileSignature, IngestionValidationError } from '../src/engine/ingestion/fileValidator.js';

async function createSamplePdf(textLines: string[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  for (const line of textLines) {
    const isHeader = /^[A-Z\s]{4,}$/.test(line.trim());
    page.drawText(line, {
      x: 50,
      y,
      size: isHeader ? 14 : 10,
      font: isHeader ? boldFont : font,
      color: rgb(0, 0, 0),
    });
    y -= isHeader ? 22 : 15;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function createMultiColumnPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header across top
  page.drawText('Jane Doe', { x: 50, y: 750, size: 18, font: boldFont });
  page.drawText('jane.doe@example.com | +1 (555) 234-5678 | San Francisco, CA | github.com/janedoe', {
    x: 50,
    y: 730,
    size: 9,
    font,
  });

  // Left column (Experience)
  page.drawText('EXPERIENCE', { x: 50, y: 690, size: 13, font: boldFont });
  page.drawText('Senior Staff Engineer | CloudScale Inc', { x: 50, y: 670, size: 10, font: boldFont });
  page.drawText('Jan 2021 - Present', { x: 50, y: 655, size: 9, font });
  page.drawText('• Architected microservices with Node.js and Go for 2M daily users.', { x: 50, y: 640, size: 9, font });
  page.drawText('• Reduced p99 latency by 45% using Redis caching and PostgreSQL indexing.', { x: 50, y: 625, size: 9, font });

  // Right column (Skills & Education)
  page.drawText('SKILLS', { x: 340, y: 690, size: 13, font: boldFont });
  page.drawText('• Languages: TypeScript, Go, Python, SQL', { x: 340, y: 670, size: 9, font });
  page.drawText('• Frameworks: React, Next.js, Express, FastAPI', { x: 340, y: 655, size: 9, font });
  page.drawText('• Cloud & DevOps: Docker, Kubernetes, AWS', { x: 340, y: 640, size: 9, font });

  page.drawText('EDUCATION', { x: 340, y: 590, size: 13, font: boldFont });
  page.drawText('B.S. in Computer Science', { x: 340, y: 570, size: 10, font: boldFont });
  page.drawText('Stanford University (2016 - 2020)', { x: 340, y: 555, size: 9, font });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function createSampleImage(format: 'png' | 'jpeg', lines: string[]): Promise<Buffer> {
  const canvas = napiCanvas.createCanvas(1200, 1600);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1200, 1600);

  ctx.fillStyle = '#111111';
  let y = 100;

  for (const line of lines) {
    const isHeader = /^[A-Z\s]{4,}$/.test(line.trim());
    ctx.font = isHeader ? 'bold 28px sans-serif' : '20px sans-serif';
    ctx.fillText(line, 80, y);
    y += isHeader ? 45 : 32;
  }

  return format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg');
}

async function runMatrix() {
  console.log('================================================================');
  console.log('RESUMEX DOCUMENT INGESTION & RECOGNITION TEST MATRIX');
  console.log('================================================================\n');

  const testCases: Array<{
    name: string;
    filename: string;
    mimetype: string;
    generator: () => Promise<Buffer>;
    expectedType: string;
    shouldPass: boolean;
  }> = [
    {
      name: '1. Native Text PDF Resume (Single Column)',
      filename: 'senior_eng_resume.pdf',
      mimetype: 'application/pdf',
      expectedType: 'TEXT_PDF',
      shouldPass: true,
      generator: () =>
        createSamplePdf([
          'Alexander Wright',
          'alex.wright@techmail.com | +1 (415) 555-0199 | San Francisco, CA | linkedin.com/in/alexwright | github.com/alexwright',
          '',
          'PROFESSIONAL SUMMARY',
          'Accomplished Senior Backend Software Engineer with 7+ years architecting fault-tolerant cloud systems in TypeScript, Go, and AWS.',
          '',
          'WORK EXPERIENCE',
          'Lead Backend Engineer | CloudMatrix Systems | Jan 2021 - Present',
          '• Architected microservices platform handling 500M daily API queries using Node.js, Express, and Redis.',
          '• Reduced cloud infrastructure costs by 32% ($140k/yr) via Kubernetes cluster autoscaling.',
          '• Spearheaded migration from monolithic MySQL database to distributed PostgreSQL cluster.',
          '',
          'TECHNICAL SKILLS',
          'Languages: TypeScript, JavaScript, Go, Python, SQL',
          'Cloud & Infrastructure: Docker, Kubernetes, AWS, Terraform, CI/CD Pipelines',
          'Databases: PostgreSQL, Redis, MongoDB, Elasticsearch',
          '',
          'EDUCATION',
          'Bachelor of Science in Computer Science | University of California, Berkeley | 2014 - 2018',
        ]),
    },
    {
      name: '2. Multi-Column PDF Resume (Reading Order Check)',
      filename: 'multicolumn_resume.pdf',
      mimetype: 'application/pdf',
      expectedType: 'TEXT_PDF',
      shouldPass: true,
      generator: () => createMultiColumnPdf(),
    },
    {
      name: '3. High-Resolution PNG Image Resume',
      filename: 'photo_resume.png',
      mimetype: 'image/png',
      expectedType: 'IMAGE_RESUME',
      shouldPass: true,
      generator: () =>
        createSampleImage('png', [
          'Samantha Reed',
          'samantha.reed@example.com | (212) 555-7890 | New York, NY | github.com/sreed',
          '',
          'EXPERIENCE',
          'Full Stack Software Developer | Apex Solutions | 2020 - Present',
          '• Developed customer facing portal using React and TypeScript for 150k users.',
          '• Engineered RESTful APIs with Node.js and MongoDB reducing load times by 40%.',
          '',
          'SKILLS',
          'React, TypeScript, JavaScript, Node.js, MongoDB, Docker, Git',
          '',
          'EDUCATION',
          'B.S. in Software Engineering | NYU | 2016 - 2020',
        ]),
    },
    {
      name: '4. JPEG Image Resume (OCR Validation)',
      filename: 'scan_candidate.jpg',
      mimetype: 'image/jpeg',
      expectedType: 'IMAGE_RESUME',
      shouldPass: true,
      generator: () =>
        createSampleImage('jpeg', [
          'Michael Chang',
          'michael.chang@devmail.org | +1 650-555-1212 | Austin, TX',
          '',
          'WORK EXPERIENCE',
          'DevOps Engineer | Scaled Tech | 2021 - Present',
          '• Automated CI/CD pipelines using GitHub Actions and Terraform across 12 AWS accounts.',
          '• Deployed containerized applications with Docker and Kubernetes.',
          '',
          'SKILLS',
          'Docker, Kubernetes, AWS, Terraform, Python, Linux, CI/CD',
          '',
          'EDUCATION',
          'B.S. in Computer Engineering | UT Austin | 2017 - 2021',
        ]),
    },
    {
      name: '5. Security Check: Renamed Executable (.exe disguised as .pdf)',
      filename: 'malicious.pdf',
      mimetype: 'application/pdf',
      expectedType: 'INVALID',
      shouldPass: false,
      generator: async () => Buffer.from('MZ\x90\x00\x03\x00\x00\x00This is a Windows executable binary.'),
    },
    {
      name: '6. Quality Check: Random Non-Resume Document',
      filename: 'grocery_receipt.pdf',
      mimetype: 'application/pdf',
      expectedType: 'NOT_A_RESUME',
      shouldPass: false,
      generator: () =>
        createSamplePdf([
          'SUPERMARKET GROCERY RECEIPT',
          'Store #402 - 123 Main Street',
          '1x Milk 1 Gallon ................. $4.29',
          '2x Whole Wheat Bread ........... $5.50',
          '1x Organic Bananas ............. $1.99',
          'TOTAL .......................... $11.78',
          'Thank you for shopping with us!',
        ]),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`----------------------------------------------------------------`);
    console.log(`TEST: ${tc.name}`);
    console.log(`File: "${tc.filename}"`);

    try {
      const buffer = await tc.generator();
      const result = await runDocumentIngestionPipeline(buffer, tc.filename, tc.mimetype);

      if (tc.shouldPass) {
        console.log(`✓ PASS: Document successfully recognized!`);
        console.log(`  Document Type: ${result.document.type} (Expected: ${tc.expectedType})`);
        console.log(`  Candidate Name: ${result.resume.contact.name}`);
        console.log(`  Email: ${result.resume.contact.email}`);
        console.log(`  Phone: ${result.resume.contact.phone}`);
        console.log(`  Experience entries: ${result.resume.experience.length}`);
        console.log(`  Technical Skills: ${result.resume.skills.technical.join(', ')}`);
        console.log(`  Confidence Score: ${result.recognition.confidence}`);
        passed++;
      } else {
        console.error(`✗ FAIL: Expected document to be rejected, but it was accepted.`);
        failed++;
      }
    } catch (err: any) {
      if (!tc.shouldPass) {
        console.log(`✓ PASS: Correctly rejected with status "${err.status || err.code}": ${err.message}`);
        passed++;
      } else {
        console.error(`✗ FAIL: Unexpected rejection on valid document: ${err.message}`);
        failed++;
      }
    }
  }

  console.log('\n================================================================');
  console.log(`TEST MATRIX SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMatrix().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
