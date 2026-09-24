import { KeywordMatchResult } from '../../models/resume.types.js';

export interface KeywordExtractionResult {
  skills: string[];
  technologies: string[];
  tools: string[];
  industryTerms: string[];
  repeatedKeywords: Array<{ keyword: string; count: number }>;
}

// Canonical synonym dictionary
const SYNONYM_MAP: Record<string, string[]> = {
  javascript: ['js', 'ecmascript', 'es6', 'vanilla js'],
  typescript: ['ts'],
  react: ['reactjs', 'react.js'],
  node: ['nodejs', 'node.js'],
  kubernetes: ['k8s'],
  aws: ['amazon web services', 'amazon aws'],
  gcp: ['google cloud', 'google cloud platform'],
  azure: ['microsoft azure'],
  postgresql: ['postgres', 'psql'],
  mongodb: ['mongo'],
  vue: ['vuejs', 'vue.js'],
  angular: ['angularjs'],
  golang: ['go'],
  docker: ['containerization', 'containers'],
  'ci/cd': ['continuous integration', 'continuous deployment', 'cicd'],
  'rest api': ['restful', 'rest', 'restful api', 'rest apis'],
  graphql: ['gql'],
  terraform: ['iac', 'infrastructure as code'],
  sql: ['relational database', 'rdbms'],
  nosql: ['non-relational'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai', 'genai', 'generative ai'],
  python: ['py'],
  microservices: ['microservice architecture', 'distributed systems'],
};

// Build reverse lookup
const CANONICAL_LOOKUP: Map<string, string> = new Map();
for (const [canonical, variants] of Object.entries(SYNONYM_MAP)) {
  CANONICAL_LOOKUP.set(canonical.toLowerCase(), canonical);
  for (const v of variants) {
    CANONICAL_LOOKUP.set(v.toLowerCase(), canonical);
  }
}

export function normalizeKeyword(word: string): string {
  const clean = word.toLowerCase().trim();
  return CANONICAL_LOOKUP.get(clean) || clean;
}

export function extractKeywords(text: string): KeywordExtractionResult {
  const lower = text.toLowerCase();
  const words = text.match(/\b[a-zA-Z0-9.+/#-]{2,25}\b/g) || [];

  const freqMap: Map<string, number> = new Map();
  const stopWords = new Set([
    'and', 'the', 'for', 'with', 'that', 'this', 'from', 'have', 'were', 'been',
    'will', 'your', 'about', 'more', 'into', 'some', 'than', 'them', 'then'
  ]);

  for (const w of words) {
    const lw = w.toLowerCase();
    if (stopWords.has(lw) || lw.length < 3) continue;
    freqMap.set(lw, (freqMap.get(lw) || 0) + 1);
  }

  const repeatedKeywords = Array.from(freqMap.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }));

  // Identify tech domains
  const techCandidates = [
    'typescript', 'javascript', 'python', 'go', 'java', 'react', 'node', 'aws',
    'docker', 'kubernetes', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest api',
    'ci/cd', 'terraform', 'git', 'linux', 'html', 'css', 'tailwind', 'microservices'
  ];

  const matchedTech: string[] = [];
  for (const tech of techCandidates) {
    const normalized = normalizeKeyword(tech);
    const regex = new RegExp(`(?:^|\\W)${tech.replace('+', '\\+')}(?:$|\\W)`, 'i');
    if (regex.test(text)) {
      matchedTech.push(normalized);
    }
  }

  return {
    skills: matchedTech.slice(0, 10),
    technologies: matchedTech.slice(0, 8),
    tools: ['Git', 'Docker', 'AWS', 'Linux'].filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(text)),
    industryTerms: ['Agile', 'Scrum', 'Microservices', 'CI/CD'].filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(text)),
    repeatedKeywords,
  };
}

export function compareResumeToJobKeywords(
  resumeText: string,
  jobDescription: string
): KeywordMatchResult {
  const resumeLower = resumeText.toLowerCase();

  // Extract key terms from Job Description
  const candidateTerms = [
    'typescript', 'javascript', 'python', 'go', 'golang', 'java', 'c++', 'c#',
    'react', 'next.js', 'vue', 'angular', 'node', 'node.js', 'express', 'django',
    'fastapi', 'spring boot', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s',
    'terraform', 'postgresql', 'postgres', 'mongodb', 'redis', 'graphql', 'rest api',
    'ci/cd', 'git', 'linux', 'microservices', 'agile', 'scrum', 'sql', 'nosql',
    'machine learning', 'ai', 'kafka', 'testing', 'unit tests', 'leadership',
    'communication', 'problem solving'
  ];

  const jdTerms: string[] = [];
  for (const term of candidateTerms) {
    const escaped = term.replace('+', '\\+').replace('.', '\\.');
    const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
    if (regex.test(jobDescription)) {
      jdTerms.push(term);
    }
  }

  const matched: Set<string> = new Set();
  const missing: Set<string> = new Set();
  const partialMatches: Array<{ keyword: string; matchedWith: string }> = [];

  for (const jdTerm of jdTerms) {
    const canonJd = normalizeKeyword(jdTerm);
    const escapedJd = jdTerm.replace('+', '\\+').replace('.', '\\.');
    const exactMatch = new RegExp(`(?:^|\\W)${escapedJd}(?:$|\\W)`, 'i').test(resumeLower);

    if (exactMatch) {
      matched.add(jdTerm);
      continue;
    }

    // Check for synonym / variation in resume
    const synonyms = SYNONYM_MAP[canonJd] || [];
    let synonymFound = false;
    for (const syn of synonyms) {
      const escSyn = syn.replace('+', '\\+').replace('.', '\\.');
      if (new RegExp(`(?:^|\\W)${escSyn}(?:$|\\W)`, 'i').test(resumeLower)) {
        partialMatches.push({ keyword: jdTerm, matchedWith: syn });
        synonymFound = true;
        break;
      }
    }

    if (!synonymFound) {
      missing.add(jdTerm);
    }
  }

  const totalTerms = jdTerms.length || 1;
  const matchPercentage = Math.round(
    ((matched.size + partialMatches.length * 0.8) / totalTerms) * 100
  );

  return {
    matched: Array.from(matched),
    missing: Array.from(missing),
    partialMatches,
    matchPercentage: Math.min(100, matchPercentage),
  };
}
