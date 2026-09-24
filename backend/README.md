# Resume Reviewer Intelligence Backend & Engine

A production-grade, hybrid **Resume Intelligence Engine** providing deterministic rule validation, ATS-oriented scoring, structured document parsing, keyword matching, and AI recommendations.

---

## 1. Architecture Overview

The system uses a **Hybrid Architecture** where deterministic rule engines handle measurable and repeatable facts, and the LLM handles semantic interpretation and phrasing refinement:

```
Resume File (PDF / DOCX / Image / TXT)
  ↓
File Validation & Multer Middleware (10MB limit, MIME checks)
  ↓
Document Parser (Native text layer, Mammoth for DOCX, OCR fallback for scanned PDFs/images)
  ↓
Section Parser (Boundary detection, regex contact extraction, intact bullet points)
  ↓
Structured Resume JSON Schema (contact, summary, education, experience, projects, skills, certifications)
  ↓
Deterministic Analysis Engine
  ├── Contact Analyzer (Email, phone, LinkedIn, GitHub, name)
  ├── Section Analyzer (Detects 7 standard sections and missing gaps)
  ├── Formatting Analyzer (Word counts, columns, tables, special symbols)
  ├── Content Analyzer (Weak starters, metric density, action verbs, pronouns)
  └── Skills Analyzer (Languages, frameworks, tools, platforms, soft skills)
  ↓
ATS Scoring Engine (Configurable category weights: ATS 20%, Keywords 20%, Experience 20%, Projects 15%, Formatting 10%, Education 5%, Achievements 10%)
  ↓
Keyword Engine (Synonym normalization, e.g. JS ↔ JavaScript, K8s ↔ Kubernetes)
  ↓
Controlled LLM Analysis (Gemini 1.5 Flash with strict zero-hallucination prompt & deterministic fallback)
  ↓
AI Improvement Engine (Google XYZ bullet rewrites without metric fabrication)
  ↓
Final Unified Analysis JSON (Compatible with new schema & existing frontend dashboard)
```

---

## 2. API Endpoints

### 1. File Ingestion
- **`POST /api/resume/upload`**
  - **Body**: `multipart/form-data` with `resume` file (`.pdf`, `.docx`, `.txt`, `.png`, `.jpg`).
  - **Response**:
    ```json
    {
      "resumeId": "resume_40486e604450bc08",
      "filename": "john_resume.pdf",
      "status": "uploaded"
    }
    ```

### 2. Multi-Stage & Direct Analysis
- **`POST /api/resume/analyze`** and **`POST /api/analyze`**
  - **Body**: JSON `{ "resumeId": "..." }` OR `multipart/form-data` with `resume` file OR `{ "text": "..." }`.
  - **Response**: Unified Analysis Object:
    ```json
    {
      "success": true,
      "resumeId": "resume_...",
      "analysis": {
        "resumeId": "...",
        "score": {
          "overall": 84,
          "ats": 90,
          "keywords": 82,
          "experience": 85,
          "projects": 80,
          "formatting": 92,
          "education": 90,
          "achievements": 75
        },
        "strengths": [...],
        "criticalIssues": [...],
        "warnings": [...],
        "missingKeywords": [...],
        "sections": {
          "summary": true,
          "education": true,
          "experience": true,
          "projects": true,
          "skills": true,
          "certifications": true,
          "achievements": false
        },
        "recommendations": [
          {
            "section": "experience",
            "issue": "Missing quantifiable outcome",
            "severity": "medium",
            "explanation": "...",
            "currentText": "...",
            "suggestedText": "..."
          }
        ],
        "structuredResume": {
          "contact": { "name": "...", "email": "...", "phone": "...", "linkedin": "...", "github": "..." },
          "summary": "...",
          "education": [...],
          "experience": [...],
          "projects": [...],
          "skills": { "technical": [...], "soft": [...], "tools": [...], "languages": [...] },
          "certifications": [...],
          "achievements": [...],
          "other": [...]
        },
        "jobMatch": null,
        "overall_score": 84,
        "category_scores": {
          "ats": 90,
          "content": 85,
          "skills": 82,
          "experience": 85,
          "impact": 75,
          "formatting": 92,
          "grammar": 95,
          "professionalism": 94
        },
        "score_grade": "Strong / Interview Ready",
        "bullet_point_improvements": [...]
      }
    }
    ```

### 3. Job Description Match Engine
- **`POST /api/job-match`**
  - **Body**:
    ```json
    {
      "resumeId": "resume_...",
      "jobDescription": "Looking for a Senior Software Engineer with React, TypeScript..."
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "matchScore": 84,
      "matchedSkills": ["react", "typescript"],
      "missingSkills": ["kubernetes"],
      "recommendations": [...],
      "breakdown": {
        "skillMatch": 85,
        "experienceRelevance": 80,
        "keywordMatch": 85,
        "educationRelevance": 90
      }
    }
    ```

### 4. AI Improvement Engine
- **`POST /api/resume/improve`**
  - **Body**:
    ```json
    {
      "resumeId": "resume_...",
      "section": "experience",
      "text": "Worked on an AI application."
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "result": {
        "originalText": "Worked on an AI application.",
        "section": "experience",
        "improvements": [
          {
            "type": "executive_impact",
            "label": "Executive & Impact-Focused",
            "improvedText": "Architected and deployed AI application, driving measurable operational gains across [target metric: e.g. X% latency reduction or Y daily active users].",
            "explanation": "..."
          },
          {
            "type": "technical_depth",
            "label": "Technical Depth & Engineering Rigor",
            "improvedText": "Engineered robust solutions for AI application...",
            "explanation": "..."
          },
          {
            "type": "action_leadership",
            "label": "Action & Leadership-Driven",
            "improvedText": "Spearheaded AI application in close collaboration...",
            "explanation": "..."
          }
        ]
      }
    }
    ```

### 5. Health & Sample Resumes
- **`GET /api/health`**: Returns service status and mode (`hybrid_deterministic` or `gemini_live`).
- **`GET /api/sample-resumes`**: Returns list of curated test sample resumes.
- **`GET /api/sample-resumes/:id`**: Returns specific sample resume text.

---

## 3. Environment Variables

Create or edit `.env` in `backend/`:

```env
# Server Port
PORT=5001

# Optional: Google Gemini API Key
# If omitted or empty, the backend runs in hybrid deterministic mode with zero external dependencies.
GEMINI_API_KEY=
```

---

## 4. Commands to Run Backend & Frontend

### Backend
```bash
cd backend
npm install
npm run dev     # Starts server via tsx watch on http://localhost:5001
npm test        # Runs Vitest automated test suite
npm run build   # Compiles TypeScript to dist/
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Starts Vite dev server on http://localhost:5173
npm run build   # Validates production bundle
```

---

## 5. Testing Instructions

To run the automated test suite across all 15 test suites (66 tests):
```bash
cd backend
npm test
```

The test suite validates:
1. `documentParser.test.ts`: PDF native extraction, empty file validation, unsupported extension rejection, image-only `needs_ocr` detection.
2. `sectionStructuring.test.ts`: Conversion into Structured Resume JSON, preserving bullets, contact extraction.
3. `deterministicAnalyzers.test.ts`: Rule checks for Contact, Sections, Formatting, Content (weak starters/metrics), and Skills taxonomy.
4. `atsScoring.test.ts`: Configurable ATS weights, score calculation, score clamping.
5. `keywordEngine.test.ts`: Keyword extraction, synonym normalization (e.g. `JS` ↔ `JavaScript`, `K8s` ↔ `Kubernetes`).
6. `jobMatchEngine.test.ts`: Separation of skills, experience, keywords, and education fit.
7. `aiImprovement.test.ts`: Multi-variant rewrites without metric hallucination.
8. `mockResumesValidation.test.ts`: Full end-to-end pipeline execution across all 7 archetypes:
   - Excellent Resume (scores 85+)
   - Average Resume (scores 60 - 75)
   - Poor Resume (scores < 55)
   - ATS-Unfriendly Resume (detects tables, symbols)
   - Student Resume (coursework, GPA, projects)
   - Software Engineer Resume (tech stack, microservices)
   - Electrical Engineer Resume (hardware, PCB, firmware, PE license)

---

## 6. Known Limitations
- Password-protected PDFs must have password removed prior to upload.
- OCR on very low-resolution or heavily degraded scans may require clearer scanning resolution (>= 150 DPI recommended).
- The Gemini API is rate-limited according to your Google AI Studio plan quota; when quota is exceeded, the system automatically falls back to deterministic analysis without failing candidate requests.
