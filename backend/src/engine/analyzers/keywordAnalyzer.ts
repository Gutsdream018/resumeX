import { safeClamp } from '../scoring/scoreNormalizer.js';
import { KeywordCoverageDetails } from '../schemas/analysisSchema.js';

// Canonical Synonym Dictionary
export const CANONICAL_SYNONYM_MAP: Record<string, string[]> = {
  javascript: ['js', 'ecmascript', 'es6', 'vanilla js', 'javascript.js'],
  typescript: ['ts', 'typescript.js'],
  react: ['reactjs', 'react.js', 'react native'],
  'next.js': ['nextjs', 'next'],
  node: ['nodejs', 'node.js'],
  express: ['expressjs', 'express.js'],
  kubernetes: ['k8s', 'kube'],
  aws: ['amazon web services', 'amazon aws', 'aws cloud'],
  gcp: ['google cloud', 'google cloud platform', 'google cloud engine'],
  azure: ['microsoft azure', 'azure cloud'],
  postgresql: ['postgres', 'psql', 'postgres db'],
  mongodb: ['mongo', 'mongo db'],
  redis: ['redis cache', 'redis db'],
  docker: ['containerization', 'containers', 'dockerfile'],
  'ci/cd': ['continuous integration', 'continuous deployment', 'cicd', 'github actions', 'gitlab ci'],
  'rest api': ['restful', 'rest', 'restful api', 'restful apis', 'rest apis'],
  graphql: ['gql'],
  terraform: ['iac', 'infrastructure as code'],
  sql: ['relational database', 'rdbms', 'structured query language'],
  nosql: ['non-relational', 'document db'],
  'machine learning': ['ml', 'deep learning'],
  'artificial intelligence': ['ai', 'genai', 'generative ai', 'llm', 'llms'],
  python: ['py', 'python3'],
  microservices: ['microservice architecture', 'distributed systems', 'service oriented'],
  golang: ['go', 'go language'],
  java: ['core java', 'j2ee'],
  'c++': ['cpp', 'cplusplus'],
  'c#': ['csharp', 'c sharp', '.net'],
  git: ['github', 'gitlab', 'version control'],
  linux: ['unix', 'ubuntu', 'centos', 'redhat'],
  tailwind: ['tailwindcss', 'tailwind css'],
};

// Build reverse lookup table
const CANONICAL_LOOKUP = new Map<string, string>();
for (const [canonical, variants] of Object.entries(CANONICAL_SYNONYM_MAP)) {
  CANONICAL_LOOKUP.set(canonical.toLowerCase(), canonical);
  for (const v of variants) {
    CANONICAL_LOOKUP.set(v.toLowerCase(), canonical);
  }
}

export function normalizeKeyword(word: string): string {
  const clean = word.toLowerCase().trim();
  return CANONICAL_LOOKUP.get(clean) || clean;
}

export interface KeywordAnalysisResult extends KeywordCoverageDetails {
  signals: string[];
  deductions: string[];
  topIdentifiedSkills: string[];
}

export const CORE_TECH_TAXONOMY = {
  languages: [
    'JavaScript', 'TypeScript', 'Python', 'Go', 'Java', 'C++', 'C#', 'Rust',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS', 'Bash', 'Shell', 'R', 'Scala'
  ],
  frameworks: [
    'React', 'Next.js', 'Node.js', 'Express', 'Vue', 'Angular', 'Django', 'FastAPI',
    'Flask', 'Spring Boot', 'ASP.NET', 'Ruby on Rails', 'TailwindCSS', 'GraphQL', 'Redux'
  ],
  tools: [
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Git', 'GitHub',
    'GitLab', 'Jenkins', 'Linux', 'Jira', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka',
    'Elasticsearch', 'CI/CD', 'Webpack', 'Vite', 'Prometheus', 'Grafana'
  ],
  soft: [
    'Leadership', 'Mentoring', 'Cross-functional Collaboration', 'Problem Solving',
    'Agile', 'Scrum', 'Strategic Planning', 'System Design', 'Architecture'
  ]
};

export function analyzeKeywords(
  text: string,
  jobDescription?: string
): KeywordAnalysisResult {
  const signals: string[] = [];
  const deductions: string[] = [];
  const textLower = text.toLowerCase();

  // Mode 1: Without Job Description (Domain breadth analysis)
  if (!jobDescription || jobDescription.trim().length === 0) {
    const identifiedLanguages = new Set<string>();
    const identifiedFrameworks = new Set<string>();
    const identifiedTools = new Set<string>();
    const identifiedSoft = new Set<string>();

    for (const lang of CORE_TECH_TAXONOMY.languages) {
      const esc = lang.replace('+', '\\+');
      if (new RegExp(`(?:^|\\W)${esc}(?:$|\\W)`, 'i').test(text)) identifiedLanguages.add(lang);
    }
    for (const fw of CORE_TECH_TAXONOMY.frameworks) {
      const esc = fw.replace('.', '\\.');
      if (new RegExp(`(?:^|\\W)${esc}(?:$|\\W)`, 'i').test(text)) identifiedFrameworks.add(fw);
    }
    for (const tool of CORE_TECH_TAXONOMY.tools) {
      if (new RegExp(`(?:^|\\W)${tool}(?:$|\\W)`, 'i').test(text)) identifiedTools.add(tool);
    }
    for (const s of CORE_TECH_TAXONOMY.soft) {
      if (new RegExp(`(?:^|\\W)${s}(?:$|\\W)`, 'i').test(text)) identifiedSoft.add(s);
    }

    const matched = [
      ...Array.from(identifiedLanguages),
      ...Array.from(identifiedFrameworks),
      ...Array.from(identifiedTools),
      ...Array.from(identifiedSoft),
    ];

    const totalCount = matched.length;
    let score = 40;
    score += Math.min(40, totalCount * 3.5);
    if (identifiedLanguages.size >= 2) score += 10;
    if (identifiedTools.size >= 2) score += 10;

    const highDemandTerms = ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Redis'];
    const missing = highDemandTerms.filter((term) => !new RegExp(`\\b${term}\\b`, 'i').test(text)).slice(0, 4);

    if (totalCount >= 10) {
      signals.push(`Strong keyword breadth: detected ${totalCount} recognized technologies and domain terms.`);
    } else if (totalCount >= 5) {
      signals.push(`Identified ${totalCount} standard technical keywords.`);
    } else {
      deductions.push('Low keyword density. Incorporate standard language, framework, and infrastructure terms.');
    }

    return {
      keywordScore: safeClamp(score, 20, 100),
      coverage: parseFloat((Math.min(1.0, totalCount / 12)).toFixed(2)),
      matched,
      missing,
      partial: [],
      byCategory: {
        languages: Array.from(identifiedLanguages),
        technical: Array.from(identifiedFrameworks),
        tools: Array.from(identifiedTools),
        soft: Array.from(identifiedSoft),
        domain: [],
      },
      signals,
      deductions,
      topIdentifiedSkills: matched.slice(0, 10),
    };
  }

  // Mode 2: With Job Description (Targeted JD Match Mode)
  const jdLower = jobDescription.toLowerCase();
  const candidateKeywords = [
    ...CORE_TECH_TAXONOMY.languages,
    ...CORE_TECH_TAXONOMY.frameworks,
    ...CORE_TECH_TAXONOMY.tools,
    ...CORE_TECH_TAXONOMY.soft,
    'REST API', 'Microservices', 'Unit Testing', 'Automated Testing', 'Performance Optimization',
    'Security', 'Cloud Architecture', 'System Design'
  ];

  const jdMatchedKeywords: string[] = [];
  for (const term of candidateKeywords) {
    const esc = term.replace('+', '\\+').replace('.', '\\.');
    if (new RegExp(`(?:^|\\W)${esc}(?:$|\\W)`, 'i').test(jdLower)) {
      jdMatchedKeywords.push(term);
    }
  }

  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();
  const partialMatches: Array<{ keyword: string; matchedWith: string }> = [];

  let requiredWeightSum = 0;
  let requiredMatchedSum = 0;

  for (const jdTerm of jdMatchedKeywords) {
    const canonical = normalizeKeyword(jdTerm);
    const esc = jdTerm.replace('+', '\\+').replace('.', '\\.');
    const isRequired = /required|must have|minimum|essential/i.test(jobDescription) &&
      new RegExp(`(?:required|must have|essential)[\\s\\S]{0,100}${esc}`, 'i').test(jdLower);

    const termWeight = isRequired ? 1.5 : 1.0;
    requiredWeightSum += termWeight;

    // Check exact match
    if (new RegExp(`(?:^|\\W)${esc}(?:$|\\W)`, 'i').test(textLower)) {
      matchedSet.add(jdTerm);
      requiredMatchedSum += termWeight;
      continue;
    }

    // Check synonym
    const variants = CANONICAL_SYNONYM_MAP[canonical] || [];
    let synFound = false;
    for (const syn of variants) {
      const synEsc = syn.replace('+', '\\+').replace('.', '\\.');
      if (new RegExp(`(?:^|\\W)${synEsc}(?:$|\\W)`, 'i').test(textLower)) {
        partialMatches.push({ keyword: jdTerm, matchedWith: syn });
        matchedSet.add(jdTerm);
        requiredMatchedSum += termWeight * 0.85;
        synFound = true;
        break;
      }
    }

    if (!synFound) {
      missingSet.add(jdTerm);
    }
  }

  const totalTerms = jdMatchedKeywords.length || 1;
  const coverage = Math.min(1.0, (matchedSet.size + partialMatches.length * 0.5) / totalTerms);
  const requiredCoverage = requiredWeightSum > 0 ? Math.min(1.0, requiredMatchedSum / requiredWeightSum) : coverage;

  const keywordScore = safeClamp(requiredCoverage * 100, 20, 100);

  if (coverage >= 0.75) {
    signals.push(`High JD alignment: matched ${matchedSet.size} of ${totalTerms} target keywords from the job description.`);
  } else if (coverage >= 0.5) {
    signals.push(`Moderate JD alignment (${Math.round(coverage * 100)}% keyword overlap).`);
  } else {
    deductions.push(`Significant keyword gap: missing ${missingSet.size} core technologies explicitly requested in the job description.`);
  }

  return {
    keywordScore,
    coverage: parseFloat(coverage.toFixed(2)),
    requiredCoverage: parseFloat(requiredCoverage.toFixed(2)),
    technicalCoverage: parseFloat(coverage.toFixed(2)),
    matched: Array.from(matchedSet),
    missing: Array.from(missingSet),
    partial: partialMatches,
    signals,
    deductions,
    topIdentifiedSkills: Array.from(matchedSet).slice(0, 10),
  };
}
