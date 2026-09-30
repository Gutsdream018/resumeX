import { ResumeProfile, JobPreferences } from './types.js';

export interface BuiltSearchQuery {
  term: string;
  category: 'primary_title' | 'title_skills' | 'adjacent_title' | 'seniority_skill' | 'core_stack';
  location?: string;
  countryCode?: string;
}

/**
 * Derives suggested role categories strictly from candidate skills and titles (not company names).
 */
export function deriveRoleCategories(profile: ResumeProfile): string[] {
  const categories: Set<string> = new Set();
  const skillsLower = (profile.skills || []).map((s) => s.toLowerCase());
  const titlesLower = (profile.titles || []).map((t) => t.toLowerCase());
  const combined = `${skillsLower.join(' ')} ${titlesLower.join(' ')}`;

  // Frontend / UI
  const hasFrontend = skillsLower.some((s) =>
    ['react', 'vue', 'angular', 'next.js', 'svelte', 'typescript', 'javascript', 'css', 'html', 'tailwind', 'redux'].includes(s)
  ) || titlesLower.some((t) => t.includes('frontend') || t.includes('ui') || t.includes('web'));

  // Backend / APIs
  const hasBackend = skillsLower.some((s) =>
    ['node.js', 'node', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'golang', 'go', 'postgresql', 'postgres', 'sql', 'mongodb', 'redis'].includes(s)
  ) || titlesLower.some((t) => t.includes('backend') || t.includes('api') || t.includes('server'));

  // DevOps / Cloud
  const hasDevOps = skillsLower.some((s) =>
    ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'terraform', 'linux', 'devops'].includes(s)
  ) || titlesLower.some((t) => t.includes('devops') || t.includes('cloud') || t.includes('infrastructure') || t.includes('sre'));

  // Data / AI
  const hasDataAi = skillsLower.some((s) =>
    ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'data science', 'llm', 'nlp'].includes(s)
  ) || titlesLower.some((t) => t.includes('data') || t.includes('ai') || t.includes('ml'));

  // Mechanical / Hardware
  const hasMechanical = skillsLower.some((s) =>
    ['autocad', 'catia', 'solidworks', 'mechanical design', 'thermodynamics', 'manufacturing', 'molding'].includes(s)
  ) || titlesLower.some((t) => t.includes('mechanical') || t.includes('cad') || t.includes('manufacturing'));

  if (hasFrontend && hasBackend) {
    categories.add('Full Stack Engineer');
  }
  if (hasFrontend) {
    categories.add('Frontend Engineer');
  }
  if (hasBackend) {
    categories.add('Backend Engineer');
  }
  if (hasDevOps) {
    categories.add('DevOps / Cloud Engineer');
  }
  if (hasDataAi) {
    categories.add('Machine Learning Engineer');
  }
  if (hasMechanical) {
    categories.add('Mechanical Design Engineer');
  }

  // Include primary parsed title if clean (no company names)
  if (profile.titles?.length > 0) {
    const rawTitle = profile.titles[0];
    const cleanTitle = rawTitle.split(/[\n\r,–—|]|\bat\b|\bfrom\b/i)[0].replace(/\b(19|20)\d{2}\b.*$/i, '').trim();
    if (cleanTitle) categories.add(cleanTitle);
  }

  // Fallback if empty
  if (categories.size === 0) {
    categories.add('Software Engineer');
    categories.add('Full Stack Developer');
  }

  return Array.from(categories).slice(0, 5);
}

/**
 * Derives suggested role chips that user can toggle in the UI.
 */
export function deriveSuggestedRoleChips(profile: ResumeProfile, preferences?: JobPreferences): string[] {
  const derived = deriveRoleCategories(profile);
  const chips = new Set<string>();

  if (preferences?.targetRole) {
    chips.add(preferences.targetRole);
  }

  derived.forEach((role) => chips.add(role));
  (preferences?.adjacentRoles || []).forEach((role) => chips.add(role));

  return Array.from(chips).slice(0, 6);
}

/**
 * Generates 3-5 high-signal search queries from candidate role categories and preferences,
 * strictly derived from skills and titles, avoiding company names.
 */
export function buildJobQueries(profile: ResumeProfile, preferences: JobPreferences): BuiltSearchQuery[] {
  const queries: BuiltSearchQuery[] = [];
  const derivedRoles = deriveRoleCategories(profile);

  // Clean target role to ensure no company names are embedded
  const targetRole = (preferences.targetRole?.trim() || derivedRoles[0] || 'Software Engineer')
    .replace(/\bat\s+[A-Za-z0-9_-]+/i, '')
    .trim();

  const location = preferences.location?.trim() || profile.location || '';
  const countryCode = preferences.countryCode || 'us';

  const topSkills = (profile.skills || [])
    .filter((s) => s.length > 1 && !['git', 'jira', 'agile', 'communication', 'teamwork'].includes(s.toLowerCase()))
    .slice(0, 5);

  // 1. Primary Target Role
  queries.push({
    term: targetRole,
    category: 'primary_title',
    location,
    countryCode,
  });

  // 2. Secondary Derived Role Category
  if (derivedRoles.length > 1 && derivedRoles[1] !== targetRole) {
    queries.push({
      term: derivedRoles[1],
      category: 'adjacent_title',
      location,
      countryCode,
    });
  }

  // 3. Target Role + Key Skills
  if (topSkills.length >= 2) {
    queries.push({
      term: `${targetRole} ${topSkills[0]} ${topSkills[1]}`,
      category: 'title_skills',
      location,
      countryCode,
    });
  } else if (topSkills.length === 1) {
    queries.push({
      term: `${targetRole} ${topSkills[0]}`,
      category: 'title_skills',
      location,
      countryCode,
    });
  }

  // 4. Seniority + Core Skill
  if (profile.seniority && profile.seniority !== 'mid' && topSkills.length > 0) {
    const seniorityPrefix = profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1);
    queries.push({
      term: `${seniorityPrefix} ${topSkills[0]} Engineer`,
      category: 'seniority_skill',
      location,
      countryCode,
    });
  }

  // 5. Core Stack Query (e.g., "React Node.js Developer")
  if (topSkills.length >= 2 && queries.length < 5) {
    queries.push({
      term: `${topSkills.slice(0, 3).join(' ')} Developer`,
      category: 'core_stack',
      location,
      countryCode,
    });
  }

  // Ensure between 3 and 5 queries
  if (queries.length < 3) {
    queries.push({
      term: `${targetRole} Developer`,
      category: 'adjacent_title',
      location,
      countryCode,
    });
  }

  return queries.slice(0, 5);
}

