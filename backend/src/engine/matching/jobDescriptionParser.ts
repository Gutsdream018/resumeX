import { createHash } from 'crypto';

export type RequirementImportance = 'MUST_HAVE' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface JDRequirement {
  id: string;
  text: string;
  category: 'skill' | 'responsibility' | 'education' | 'certification' | 'experience' | 'other';
  importance: RequirementImportance;
  keywords: string[];
}

export interface JDSkill {
  id: string;
  name: string;
  normalizedName: string;
  category: 'technical' | 'tool' | 'framework' | 'database' | 'cloud' | 'soft' | 'domain';
  importance: RequirementImportance;
}

export interface JDEducationRequirement {
  id: string;
  degree: string;
  field?: string;
  importance: RequirementImportance;
  text: string;
}

export interface JDCertificationRequirement {
  id: string;
  name: string;
  importance: RequirementImportance;
  text: string;
}

export interface JDExperienceRequirement {
  id: string;
  minYears?: number;
  maxYears?: number;
  level?: string;
  text: string;
  importance: RequirementImportance;
}

export interface JobDescriptionJSON {
  hash: string;
  rawText: string;
  jobTitle: string;
  company?: string;
  location?: string;
  experienceLevel: string;
  requirements: {
    mustHave: JDRequirement[];
    preferred: JDRequirement[];
    responsibilities: JDRequirement[];
    skills: JDSkill[];
    education: JDEducationRequirement[];
    certifications: JDCertificationRequirement[];
  };
  technologies: string[];
  softSkills: string[];
  domainTerms: string[];
  keywords: string[];
  experienceRequirements: JDExperienceRequirement[];
  signals: {
    seniority: 'Entry-Level' | 'Mid-Level' | 'Senior' | 'Lead' | 'Executive' | 'Unspecified';
    domain: string;
    roleType: string;
    locationType: 'On-Site' | 'Remote' | 'Hybrid' | 'Unspecified';
  };
}

export const SYNONYM_MAP: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  py: 'Python',
  golang: 'Go',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  k8s: 'Kubernetes',
  reactjs: 'React',
  react: 'React',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  autocad: 'AutoCAD',
  catia: 'CATIA',
  solidworks: 'SolidWorks',
  ansys: 'ANSYS',
  matlab: 'MATLAB',
  creo: 'Creo',
  proe: 'Creo/Pro-E',
  rest: 'REST APIs',
  'rest api': 'REST APIs',
  'restful apis': 'REST APIs',
  graphql: 'GraphQL',
  docker: 'Docker',
  ci_cd: 'CI/CD',
  'ci/cd': 'CI/CD',
  cicd: 'CI/CD',
  ml: 'Machine Learning',
  ai: 'Artificial Intelligence',
  gdt: 'GD&T',
  'gd&t': 'GD&T',
  cad: 'CAD',
  cam: 'CAM',
  cae: 'CAE',
  cnc: 'CNC Machining',
};

const COMMON_TECH_TAXONOMY: Array<{ name: string; category: JDSkill['category']; synonyms: string[] }> = [
  // Software & Web
  { name: 'React', category: 'framework', synonyms: ['react', 'react.js', 'reactjs'] },
  { name: 'TypeScript', category: 'technical', synonyms: ['typescript', 'ts'] },
  { name: 'JavaScript', category: 'technical', synonyms: ['javascript', 'js', 'es6', 'es2020'] },
  { name: 'Node.js', category: 'technical', synonyms: ['node', 'node.js', 'nodejs', 'express'] },
  { name: 'Python', category: 'technical', synonyms: ['python', 'py', 'django', 'fastapi', 'flask'] },
  { name: 'Go', category: 'technical', synonyms: ['go', 'golang'] },
  { name: 'Java', category: 'technical', synonyms: ['java', 'spring', 'spring boot'] },
  { name: 'C++', category: 'technical', synonyms: ['c++', 'cpp'] },
  { name: 'C#', category: 'technical', synonyms: ['c#', '.net', 'asp.net'] },
  { name: 'PostgreSQL', category: 'database', synonyms: ['postgres', 'postgresql', 'psql'] },
  { name: 'MySQL', category: 'database', synonyms: ['mysql'] },
  { name: 'MongoDB', category: 'database', synonyms: ['mongodb', 'mongo'] },
  { name: 'Redis', category: 'database', synonyms: ['redis'] },
  { name: 'GraphQL', category: 'technical', synonyms: ['graphql', 'apollo'] },
  { name: 'REST APIs', category: 'technical', synonyms: ['rest', 'restful', 'rest apis', 'web apis', 'http services'] },
  { name: 'AWS', category: 'cloud', synonyms: ['aws', 'amazon web services', 's3', 'ec2', 'lambda', 'ecs'] },
  { name: 'GCP', category: 'cloud', synonyms: ['gcp', 'google cloud', 'google cloud platform'] },
  { name: 'Azure', category: 'cloud', synonyms: ['azure', 'microsoft azure'] },
  { name: 'Docker', category: 'tool', synonyms: ['docker', 'dockerfile', 'containers', 'containerization'] },
  { name: 'Kubernetes', category: 'tool', synonyms: ['kubernetes', 'k8s', 'helm'] },
  { name: 'Terraform', category: 'tool', synonyms: ['terraform', 'iac', 'infrastructure as code'] },
  { name: 'CI/CD', category: 'tool', synonyms: ['ci/cd', 'cicd', 'github actions', 'jenkins', 'gitlab ci'] },
  { name: 'Git', category: 'tool', synonyms: ['git', 'github', 'gitlab'] },
  { name: 'Linux', category: 'technical', synonyms: ['linux', 'unix', 'bash', 'shell'] },
  { name: 'Next.js', category: 'framework', synonyms: ['next.js', 'nextjs', 'next'] },
  { name: 'TailwindCSS', category: 'tool', synonyms: ['tailwindcss', 'tailwind'] },

  // Mechanical / Core Engineering
  { name: 'AutoCAD', category: 'tool', synonyms: ['autocad', '2d cad', 'drafting'] },
  { name: 'CATIA', category: 'tool', synonyms: ['catia', 'catia v5', 'catia v6'] },
  { name: 'SolidWorks', category: 'tool', synonyms: ['solidworks', 'solid works'] },
  { name: '3D CAD Modeling', category: 'technical', synonyms: ['3d modeling', '3d cad', 'part modeling', 'surface modeling', 'assembly design'] },
  { name: 'GD&T', category: 'technical', synonyms: ['gd&t', 'geometric dimensioning and tolerancing', 'tolerancing', 'engineering drawings'] },
  { name: 'ANSYS', category: 'tool', synonyms: ['ansys', 'fea', 'finite element analysis'] },
  { name: 'CNC Machining', category: 'domain', synonyms: ['cnc', 'machining', 'cnc machining', 'lathe', 'milling'] },
  { name: 'Injection Molding', category: 'domain', synonyms: ['injection molding', 'tool design', 'plastic molding', 'mould design'] },
  { name: 'Manufacturing Processes', category: 'domain', synonyms: ['manufacturing processes', 'manufacturing documentation', 'fabrication', 'dfm', 'dfa'] },
  { name: 'Creo', category: 'tool', synonyms: ['creo', 'pro/e', 'pro-engineer'] },
  { name: 'MATLAB', category: 'technical', synonyms: ['matlab', 'simulink'] },
  { name: 'Thermodynamics / Turbines', category: 'domain', synonyms: ['turbines', 'microturbines', 'thermodynamics', 'fluid mechanics', 'heat transfer'] },
];

const SOFT_SKILLS_LIST = [
  'Communication', 'Teamwork', 'Collaboration', 'Problem Solving', 'Critical Thinking',
  'Leadership', 'Agile', 'Scrum', 'Adaptability', 'Time Management', 'Mentorship', 'Creativity'
];

export function normalizeTerm(term: string): string {
  const clean = term.trim().toLowerCase().replace(/[^\w\s#+.-]/g, '');
  return SYNONYM_MAP[clean] || term.trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseJobDescription(rawText: string): JobDescriptionJSON {
  const cleanedText = rawText.replace(/\r\n/g, '\n').trim();
  const jdHash = createHash('sha256').update(cleanedText).digest('hex').substring(0, 16);
  const lines = cleanedText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // 1. Extract Role Title
  let jobTitle = 'Engineering / Technical Role';
  for (const line of lines.slice(0, 8)) {
    if (/^(title|role|position|job\s*title)[:\s-]/i.test(line)) {
      jobTitle = line.replace(/^(title|role|position|job\s*title)[:\s-]+/i, '').trim();
      break;
    }
    if (/(engineer|developer|architect|designer|lead|manager|analyst|intern|scientist|technician)/i.test(line) && line.length < 80) {
      jobTitle = line.replace(/^#+\s*/, '').replace(/^[*_-]+\s*/, '').trim();
      break;
    }
  }

  // 2. Extract Company Name
  let company: string | undefined;
  for (const line of lines.slice(0, 10)) {
    const compMatch = line.match(/\b(?:at|with|join|company:)\s+([A-Z][A-Za-z0-9&., ]{2,35})/);
    if (compMatch && compMatch[1]) {
      company = compMatch[1].replace(/[,.-]$/, '').trim();
      break;
    }
  }

  // 3. Extract Location & Work Mode
  let location: string | undefined;
  let locationType: 'On-Site' | 'Remote' | 'Hybrid' | 'Unspecified' = 'Unspecified';
  if (/remote|work from home|wfh/i.test(cleanedText)) {
    locationType = 'Remote';
  } else if (/hybrid/i.test(cleanedText)) {
    locationType = 'Hybrid';
  } else if (/on-site|onsite|in-office/i.test(cleanedText)) {
    locationType = 'On-Site';
  }

  const locMatch = cleanedText.match(/\b(location|city|office|based in)[:\s-]*([A-Za-z, -]{3,40})/i);
  if (locMatch && locMatch[2]) {
    location = locMatch[2].trim();
  }

  // 4. Extract Seniority & Experience Requirements
  let seniority: JobDescriptionJSON['signals']['seniority'] = 'Unspecified';
  if (/director|vp|head of|executive|chief/i.test(jobTitle + ' ' + cleanedText.substring(0, 300))) {
    seniority = 'Executive';
  } else if (/principal|staff|lead|architect|manager/i.test(jobTitle + ' ' + cleanedText.substring(0, 300))) {
    seniority = 'Lead';
  } else if (/senior|sr\.?|5\+|6\+|7\+|8\+/i.test(jobTitle + ' ' + cleanedText.substring(0, 300))) {
    seniority = 'Senior';
  } else if (/junior|entry|intern|graduate|fresher|0-2|0\s*-\s*1/i.test(jobTitle + ' ' + cleanedText.substring(0, 300))) {
    seniority = 'Entry-Level';
  } else if (/mid|2-4|3-5|intermediate/i.test(cleanedText)) {
    seniority = 'Mid-Level';
  }

  const expRequirements: JDExperienceRequirement[] = [];
  const expMatches = cleanedText.match(/(\d+\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|hands-on|industry|professional))?\s+experience[^\n.,;]*)/gi);
  if (expMatches) {
    expMatches.forEach((matchText, idx) => {
      const numMatch = matchText.match(/(\d+)(?:\s*-\s*(\d+))?/);
      const minYears = numMatch ? parseInt(numMatch[1], 10) : undefined;
      const maxYears = numMatch && numMatch[2] ? parseInt(numMatch[2], 10) : undefined;
      expRequirements.push({
        id: `exp_req_${idx + 1}`,
        minYears,
        maxYears,
        level: seniority,
        text: matchText.trim(),
        importance: minYears && minYears >= 3 ? 'MUST_HAVE' : 'HIGH',
      });
    });
  }

  // 5. Extract Education Requirements
  const educationRequirements: JDEducationRequirement[] = [];
  const eduMatches = cleanedText.match(/\b(b\.?tech|b\.?e\.?|bachelor|master|m\.?tech|m\.?s\.?|phd|diploma|associate|matriculation)\b[^\n,;.]*/gi);
  if (eduMatches) {
    const seenEdu = new Set<string>();
    eduMatches.forEach((eduText, idx) => {
      const cleanEdu = eduText.trim();
      if (!seenEdu.has(cleanEdu.toLowerCase())) {
        seenEdu.add(cleanEdu.toLowerCase());
        const fieldMatch = cleanEdu.match(/\bin\s+([A-Za-z\s&]+)/i);
        educationRequirements.push({
          id: `edu_req_${idx + 1}`,
          degree: cleanEdu,
          field: fieldMatch ? fieldMatch[1].trim() : undefined,
          importance: /required|must have|minimum/i.test(cleanEdu) ? 'MUST_HAVE' : 'HIGH',
          text: cleanEdu,
        });
      }
    });
  }

  // 6. Extract Skills & Tools with Importance
  const extractedSkills: JDSkill[] = [];
  const detectedTechnologies: string[] = [];
  const detectedDomainTerms: string[] = [];
  const allKeywords: Set<string> = new Set();

  COMMON_TECH_TAXONOMY.forEach((tax, idx) => {
    let found = false;
    for (const syn of tax.synonyms) {
      const reg = new RegExp(`\\b${escapeRegex(syn)}\\b`, 'i');
      if (reg.test(cleanedText)) {
        found = true;
        break;
      }
    }
    if (found) {
      // Determine importance based on surrounding context
      const skillReg = new RegExp(`([^.\n]{0,50}\\b${escapeRegex(tax.name)}\\b[^.\n]{0,50})`, 'i');
      const ctxMatch = cleanedText.match(skillReg);
      const ctx = ctxMatch ? ctxMatch[1].toLowerCase() : '';

      let importance: RequirementImportance = 'HIGH';
      if (/required|must have|essential|minimum|core requirement/i.test(ctx)) {
        importance = 'MUST_HAVE';
      } else if (/preferred|plus|bonus|nice to have|advantageous/i.test(ctx)) {
        importance = 'MEDIUM';
      } else if (/familiarity|exposure|good to have/i.test(ctx)) {
        importance = 'LOW';
      }

      extractedSkills.push({
        id: `skill_${idx + 1}`,
        name: tax.name,
        normalizedName: tax.name,
        category: tax.category,
        importance,
      });

      if (tax.category === 'domain') {
        detectedDomainTerms.push(tax.name);
      } else {
        detectedTechnologies.push(tax.name);
      }
      allKeywords.add(tax.name);
    }
  });

  // Soft Skills
  const detectedSoftSkills: string[] = [];
  SOFT_SKILLS_LIST.forEach((soft, idx) => {
    const reg = new RegExp(`\\b${escapeRegex(soft.toLowerCase())}\\b`, 'i');
    if (reg.test(cleanedText)) {
      detectedSoftSkills.push(soft);
      extractedSkills.push({
        id: `soft_skill_${idx + 1}`,
        name: soft,
        normalizedName: soft,
        category: 'soft',
        importance: 'MEDIUM',
      });
      allKeywords.add(soft);
    }
  });

  // 7. Extract Responsibilities & Must-Have / Preferred Requirements
  const mustHaves: JDRequirement[] = [];
  const preferreds: JDRequirement[] = [];
  const responsibilities: JDRequirement[] = [];
  const certRequirements: JDCertificationRequirement[] = [];

  let currentSection: 'mustHave' | 'preferred' | 'responsibilities' | 'general' = 'general';

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (/^(required|requirements|qualifications|must have|what you need|minimum qualifications)/i.test(lower)) {
      currentSection = 'mustHave';
      return;
    }
    if (/^(preferred|nice to have|bonus|plus|good to have|preferred qualifications)/i.test(lower)) {
      currentSection = 'preferred';
      return;
    }
    if (/^(responsibilities|what you will do|role responsibilities|duties|your mission)/i.test(lower)) {
      currentSection = 'responsibilities';
      return;
    }

    // Identify bullet or numbered list
    const isBullet = /^[-*•–▪]\s*/.test(line) || /^\d+\.\s*/.test(line);
    const cleanLine = line.replace(/^[-*•–▪\d.]+\s*/, '').trim();

    if (cleanLine.length > 15 && isBullet) {
      const lineKeywords = Array.from(allKeywords).filter((kw) =>
        new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(cleanLine)
      );

      // Certification check
      if (/certificat(ion|ed)|licensed|aws certified|autodesk certified/i.test(cleanLine)) {
        certRequirements.push({
          id: `cert_req_${certRequirements.length + 1}`,
          name: cleanLine,
          importance: currentSection === 'mustHave' ? 'MUST_HAVE' : 'HIGH',
          text: cleanLine,
        });
      }

      if (currentSection === 'responsibilities' || /design|develop|build|maintain|lead|coordinate|prepare|support|analyze/i.test(cleanLine.substring(0, 20))) {
        responsibilities.push({
          id: `resp_${responsibilities.length + 1}`,
          text: cleanLine,
          category: 'responsibility',
          importance: 'HIGH',
          keywords: lineKeywords,
        });
      } else if (currentSection === 'preferred') {
        preferreds.push({
          id: `pref_${preferreds.length + 1}`,
          text: cleanLine,
          category: 'skill',
          importance: 'MEDIUM',
          keywords: lineKeywords,
        });
      } else {
        mustHaves.push({
          id: `must_${mustHaves.length + 1}`,
          text: cleanLine,
          category: 'skill',
          importance: currentSection === 'mustHave' ? 'MUST_HAVE' : 'HIGH',
          keywords: lineKeywords,
        });
      }
    }
  });

  // Determine Domain
  let domain = 'Technology & Software';
  if (/mechanical|cad|catia|autocad|machining|tooling|automotive|manufacturing/i.test(cleanedText)) {
    domain = 'Mechanical & Manufacturing Engineering';
  } else if (/cloud|devops|infrastructure|kubernetes|terraform|aws|sre/i.test(cleanedText)) {
    domain = 'Cloud, DevOps & Systems Infrastructure';
  } else if (/data|analytics|machine learning|ai|python|sql|bi/i.test(cleanedText)) {
    domain = 'Data Engineering & AI/ML';
  }

  return {
    hash: jdHash,
    rawText: cleanedText,
    jobTitle,
    company,
    location,
    experienceLevel: seniority !== 'Unspecified' ? `${seniority} (${expRequirements[0]?.text || 'Relevant Experience'})` : 'Professional Experience',
    requirements: {
      mustHave: mustHaves.slice(0, 10),
      preferred: preferreds.slice(0, 8),
      responsibilities: responsibilities.slice(0, 10),
      skills: extractedSkills,
      education: educationRequirements,
      certifications: certRequirements,
    },
    technologies: detectedTechnologies,
    softSkills: detectedSoftSkills,
    domainTerms: detectedDomainTerms,
    keywords: Array.from(allKeywords),
    experienceRequirements: expRequirements,
    signals: {
      seniority,
      domain,
      roleType: jobTitle,
      locationType,
    },
  };
}
