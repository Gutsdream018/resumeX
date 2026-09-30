// ============================================================================
// Job Application Link Resolution & ATS Detection Service
// ============================================================================

export type LinkStatus = 'ok' | 'redirected' | 'dead' | 'unknown';

export interface ResolvedLinkInfo {
  finalUrl: string;
  applyHost: string;
  isAts: boolean;
  atsName?: string;
  linkStatus: LinkStatus;
  lastCheckedAt: string;
}

// Known Enterprise ATS Providers
const ATS_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Greenhouse', pattern: /(?:boards\.greenhouse\.io|greenhouse\.io|gh_src=)/i },
  { name: 'Lever', pattern: /(?:jobs\.lever\.co|lever\.co)/i },
  { name: 'Workday', pattern: /(?:myworkdayjobs\.com|workday\.com)/i },
  { name: 'Ashby', pattern: /(?:jobs\.ashbyhq\.com|ashbyhq\.com)/i },
  { name: 'SmartRecruiters', pattern: /(?:jobs\.smartrecruiters\.com|smartrecruiters\.com)/i },
  { name: 'iCIMS', pattern: /(?:icims\.com|jobs-.*\.icims\.com)/i },
  { name: 'BambooHR', pattern: /(?:bamboohr\.com)/i },
  { name: 'Taleo', pattern: /(?:taleo\.net)/i },
  { name: 'Jobvite', pattern: /(?:jobvite\.com)/i },
];

/**
 * Validates that a string is a secure http or https URL.
 */
export function isValidHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Detects whether a given host or URL belongs to a known official ATS provider.
 */
export function detectAtsHost(urlOrHost: string): { isAts: boolean; atsName?: string } {
  if (!urlOrHost) return { isAts: false };
  for (const { name, pattern } of ATS_PATTERNS) {
    if (pattern.test(urlOrHost)) {
      return { isAts: true, atsName: name };
    }
  }
  return { isAts: false };
}

/**
 * Extracts a clean hostname from a URL.
 */
export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * Determines button label based on ATS detection and source.
 */
export function getApplyButtonLabel(isAts: boolean, source: string = 'Adzuna'): string {
  if (isAts) {
    return 'Apply on company site';
  }
  return `Apply via ${source || 'Job Board'}`;
}

/**
 * Resolves a job's applyUrl through redirects, checks link liveness, and detects ATS.
 * Uses a safe HEAD/GET request with a 3500ms timeout.
 */
export async function resolveJobUrl(
  rawUrl: string,
  timeoutMs: number = 3500
): Promise<ResolvedLinkInfo> {
  const now = new Date().toISOString();

  if (!isValidHttpUrl(rawUrl)) {
    return {
      finalUrl: rawUrl || '#',
      applyHost: '',
      isAts: false,
      linkStatus: 'dead',
      lastCheckedAt: now,
    };
  }

  // Pre-check for known ATS in original URL
  const initialAts = detectAtsHost(rawUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Try HEAD first for minimal payload
    let response: Response;
    try {
      response = await fetch(rawUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch (e: any) {
      // If HEAD is rejected by server (405/403/method not allowed), try GET with range limit
      response = await fetch(rawUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Range': 'bytes=0-1024',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    const finalUrl = response.url || rawUrl;
    const applyHost = extractHostname(finalUrl);
    const atsCheck = detectAtsHost(finalUrl);
    const isAts = atsCheck.isAts || initialAts.isAts;
    const atsName = atsCheck.atsName || initialAts.atsName;

    let linkStatus: LinkStatus = 'ok';
    if (response.status >= 400) {
      if (response.status === 404 || response.status === 410) {
        linkStatus = 'dead';
      } else {
        linkStatus = 'unknown';
      }
    } else if (finalUrl !== rawUrl) {
      linkStatus = 'redirected';
    }

    return {
      finalUrl,
      applyHost,
      isAts,
      atsName,
      linkStatus,
      lastCheckedAt: now,
    };
  } catch (err: any) {
    // Network abort or timeout
    const isAbort = err.name === 'AbortError' || err.message?.includes('abort');
    const applyHost = extractHostname(rawUrl);

    return {
      finalUrl: rawUrl,
      applyHost,
      isAts: initialAts.isAts,
      atsName: initialAts.atsName,
      linkStatus: isAbort ? 'unknown' : 'dead',
      lastCheckedAt: now,
    };
  }
}
