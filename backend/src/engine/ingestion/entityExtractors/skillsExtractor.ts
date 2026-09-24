import { CategorizedSkills } from '../types.js';

const CANONICAL_SYNONYMS: Record<string, string> = {
  js: 'JavaScript',
  'vanilla js': 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  golang: 'Go',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  'c++': 'C++',
  cpp: 'C++',
  'c#': 'C#',
  csharp: 'C#',
  react: 'React',
  'react.js': 'React',
  reactjs: 'React',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  node: 'Node.js',
  express: 'Express.js',
  'express.js': 'Express.js',
  vue: 'Vue.js',
  'vue.js': 'Vue.js',
  angular: 'Angular',
  django: 'Django',
  flask: 'Flask',
  fastapi: 'FastAPI',
  'spring boot': 'Spring Boot',
  spring: 'Spring Boot',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  redis: 'Redis',
  dynamodb: 'DynamoDB',
  cassandra: 'Cassandra',
  elasticsearch: 'Elasticsearch',
  elastic: 'Elasticsearch',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  docker: 'Docker',
  containerization: 'Docker',
  terraform: 'Terraform',
  git: 'Git',
  github: 'GitHub',
  gitlab: 'GitLab',
  'ci/cd': 'CI/CD Pipelines',
  'ci cd': 'CI/CD Pipelines',
  aws: 'Amazon Web Services (AWS)',
  gcp: 'Google Cloud Platform (GCP)',
  azure: 'Microsoft Azure',
  linux: 'Linux',
  graphql: 'GraphQL',
  rest: 'RESTful APIs',
  'rest apis': 'RESTful APIs',
  'restful api': 'RESTful APIs',
  microservices: 'Microservices',
  'distributed systems': 'Distributed Systems',
};

const SKILL_TAXONOMY = {
  technical: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Go',
    'Rust',
    'Java',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin',
    'Scala',
    'SQL',
    'R',
  ],
  frameworks: [
    'React',
    'Next.js',
    'Node.js',
    'Express.js',
    'Vue.js',
    'Angular',
    'Django',
    'FastAPI',
    'Flask',
    'Spring Boot',
    'NestJS',
    'GraphQL',
    'Tailwind CSS',
  ],
  databases: [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'DynamoDB',
    'Cassandra',
    'Elasticsearch',
    'SQLite',
    'Neo4j',
    'Supabase',
  ],
  tools: [
    'Docker',
    'Kubernetes',
    'Terraform',
    'Git',
    'GitHub',
    'GitLab',
    'CI/CD Pipelines',
    'Linux',
    'Amazon Web Services (AWS)',
    'Google Cloud Platform (GCP)',
    'Microsoft Azure',
    'Postman',
    'Jira',
    'Kafka',
  ],
  domain: [
    'Microservices',
    'Distributed Systems',
    'RESTful APIs',
    'System Architecture',
    'Machine Learning',
    'DevOps',
    'Serverless',
    'Event-Driven Architecture',
  ],
  soft: [
    'Leadership',
    'Agile',
    'Scrum',
    'Code Review',
    'Mentorship',
    'Cross-functional Collaboration',
    'Problem Solving',
  ],
};

/**
 * Extracts and categorizes skills from the resume text with canonical synonym normalization.
 */
export function extractAndCategorizeSkills(
  skillsSectionText: string,
  fullResumeText: string
): CategorizedSkills {
  const result: CategorizedSkills = {
    technical: [],
    frameworks: [],
    databases: [],
    tools: [],
    domain: [],
    soft: [],
  };

  const textToScan = (skillsSectionText && skillsSectionText.length > 20
    ? skillsSectionText + '\n' + fullResumeText
    : fullResumeText
  ).toLowerCase();

  const foundCanonical = new Set<string>();

  // Check synonym map
  for (const [alias, canonical] of Object.entries(CANONICAL_SYNONYMS)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');

    if (regex.test(textToScan)) {
      foundCanonical.add(canonical);
    }
  }

  // Populate categories
  for (const canonical of foundCanonical) {
    if (SKILL_TAXONOMY.technical.includes(canonical)) {
      result.technical.push(canonical);
    } else if (SKILL_TAXONOMY.frameworks.includes(canonical)) {
      result.frameworks.push(canonical);
    } else if (SKILL_TAXONOMY.databases.includes(canonical)) {
      result.databases.push(canonical);
    } else if (SKILL_TAXONOMY.tools.includes(canonical)) {
      result.tools.push(canonical);
    } else if (SKILL_TAXONOMY.domain.includes(canonical)) {
      result.domain.push(canonical);
    } else if (SKILL_TAXONOMY.soft.includes(canonical)) {
      result.soft.push(canonical);
    } else {
      result.technical.push(canonical);
    }
  }

  return result;
}
