# ResumeX — Job Match & Discovery

> Evidence-based Job Match & Discovery engine built into ResumeX.
> Complete candidate journey: **Resume → Find Jobs → Match → Optimize → Apply**.

---

## Architecture & Flow

```
   [Parsed Resume] ─────────► [Resume Profile Extractor] 
                                        │
                                        ▼
   [Adzuna / Official APIs] ◄── [Query Builder (3-5 queries)]
             │
             ▼
   [Job Normalization & Deduplicator] (company + title + location)
             │
             ▼
   [Cheap Pre-Filter] (Heuristic score: title similarity, skills, location, recency)
             │ (Top ~20 Jobs)
             ▼
   [Match Engine] (10-dimension zero-hallucination alignment scoring)
             │
             ▼
   [Find Jobs UI] (ATS Score Ring, Matched & Missing Chips, Side Drawer)
             │
             ▼
   [Tailor Resume Handoff] ──► [Resume Optimizer] ──► [Saved Variant (tailored_resumes)]
                                                              │
                                                              ▼
                                                     [View Job to Apply ↗]
```

---

## 1. How to Get Adzuna API Keys

Adzuna provides free official REST API access for developer integrations across multiple countries including India (`in`), the US (`us`), UK (`gb`), and more.

1. Navigate to the **Adzuna Developer Portal**: [https://developer.adzuna.com/](https://developer.adzuna.com/)
2. Click **"Get API Access"** and register for a free developer account.
3. Once logged in, open your dashboard to find your:
   - **`App ID`** (e.g. `d719...`)
   - **`App Key`** (e.g. `9ac0b87f...`)
4. Copy these credentials into `backend/.env`:
   ```bash
   ADZUNA_APP_ID="your_adzuna_app_id"
   ADZUNA_APP_KEY="your_adzuna_app_key"
   JOB_CACHE_TTL_HOURS=24
   ```

> **Note on Offline / Fallback Mode:**
> If `ADZUNA_APP_ID` or `ADZUNA_APP_KEY` are omitted or if network limits are reached, the system automatically falls back to an offline high-fidelity dataset of realistic verified software engineering, product, and data listings so development and testing are never blocked.

---

## 2. How to Run and Test the Feature

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Step 1: Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment
In `backend/.env`:
```bash
PORT=5001
NVIDIA_API_KEY=""
NVIDIA_MODEL="meta/muse-glimmer-30b"
ADZUNA_APP_ID="your_app_id"
ADZUNA_APP_KEY="your_app_key"
JOB_CACHE_TTL_HOURS=24
```

### Step 3: Run Automated Tests
Run unit tests for the Query Builder, Deduplication, Cheap Pre-filter, and Integration test for `/api/jobs/search`:
```bash
cd backend
npm test
# Or: npx vitest run tests/jobDiscovery.test.ts
```

### Step 4: Run the Development Servers
```bash
# Terminal 1 - Backend (port 5001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

### Step 5: Test the Feature in the App
1. Open [http://localhost:5173/](http://localhost:5173/) in your browser.
2. Click **"Find Jobs"** in the top navigation bar (or click "Review My Resume" / select a sample resume, then choose **"Find Jobs"** from the left dashboard sidebar).
3. The **Job Match & Discovery** page will load:
   - View your parsed profile snippet (Target Role, Experience, Seniority, Market).
   - Use the filter bar to search target roles, locations, toggle **"Remote Only"**, or sort by **"Highest Match Score"** / **"Most Recent"**.
   - Inspect job cards featuring the ATS-style circular score ring, green matched-skill chips, and amber/red missing-qualification chips.
   - Click **"View Job"** to open the official apply URL in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).
   - Click any card to open the **Side Drawer** for full 10-dimension match insights and sanitized plain-text job descriptions.
   - Click **"Tailor Resume"** to preload the job into Match Mode and the Resume Optimizer, then click **"Save Tailored Variant"** (persisted in `tailored_resumes` without mutating your original resume) with the next step prompt **"View Job to Apply"**.

---

## 3. How to Add a New `JobProvider`

The provider architecture is decoupled and strictly backend-only. To add an additional official job API (e.g. Indeed Partner API, Reed, ZipRecruiter):

### 1. Implement the `JobProvider` Interface
Create a new file under `backend/src/services/jobs/providers/` (e.g. `reedProvider.ts`):

```typescript
import { Job, JobFilter, JobProvider } from '../types.js';

export class ReedProvider implements JobProvider {
  public readonly name = 'Reed';
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.REED_API_KEY?.trim();
  }

  public async search(filter: JobFilter): Promise<Job[]> {
    if (!this.apiKey) return [];

    const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(filter.query || '')}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map((item: any): Job => ({
      id: `reed_${item.jobId}`,
      title: item.jobTitle,
      company: item.employerName || 'Confidential',
      location: item.locationName || 'Unknown',
      isRemote: /remote/i.test(item.jobTitle || '') || /remote/i.test(item.jobDescription || ''),
      salaryMin: item.minimumSalary,
      salaryMax: item.maximumSalary,
      description: item.jobDescription || '',
      source: 'Reed',
      applyUrl: item.jobUrl,
      postedAt: item.date || new Date().toISOString(),
    }));
  }
}

export const reedProvider = new ReedProvider();
```

### 2. Register in the Query Aggregator
In `backend/src/api/controllers/jobDiscovery.controller.ts`, import your new provider and include it in the concurrent query fetch:

```typescript
import { reedProvider } from '../../services/jobs/providers/reedProvider.js';

// Inside searchMatchedJobsHandler:
const queryPromises = queries.flatMap((q) => [
  adzunaProvider.search({ query: q.term, location: preferences.location, countryCode: preferences.countryCode }),
  reedProvider.search({ query: q.term, location: preferences.location, countryCode: preferences.countryCode }),
]);
```

The unified deduplication and pre-filtering pipeline will automatically normalize, dedupe across both providers, and pass the top 20 candidates into the Match Engine!
