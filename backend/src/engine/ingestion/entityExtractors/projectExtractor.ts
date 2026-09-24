import { ProjectEntry } from '../types.js';

/**
 * Extracts structured project entries from the Projects section text.
 */
export function extractProjectEntries(sectionText: string): ProjectEntry[] {
  if (!sectionText || sectionText.trim().length === 0) {
    return [];
  }

  const entries: ProjectEntry[] = [];
  const lines = sectionText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const isBullet = /^[•\-*o\u25CF\u25CB\u25AA\u25AB\u2022\u2023\u2043\u2219]/.test(line);
    const hasTechSeparator = line.includes('|') || line.includes('–') || line.includes(':');
    const isHeader = !isBullet && (hasTechSeparator || currentBlock.length > 2 || /^[A-Z0-9\s_-]{3,40}$/.test(line));

    if (isHeader && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  for (const block of blocks) {
    if (block.length === 0) continue;

    const headerLine = block[0];
    let name: string | null = null;
    const technologies: string[] = [];
    const links: string[] = [];
    const bullets: string[] = [];

    // Extract links in header if present
    const linkMatch = headerLine.match(/(?:https?:\/\/[^\s]+|github\.com\/[^\s]+)/gi);
    if (linkMatch) {
      links.push(...linkMatch);
    }

    if (headerLine.includes('|')) {
      const parts = headerLine.split('|').map((p) => p.trim());
      name = parts[0];
      if (parts.length > 1) {
        const rawTechs = parts[1].split(/[,/]/).map((t) => t.trim()).filter(Boolean);
        technologies.push(...rawTechs);
      }
    } else if (headerLine.includes(':')) {
      const parts = headerLine.split(':').map((p) => p.trim());
      name = parts[0];
      if (parts.length > 1) {
        const rawTechs = parts[1].split(/[,/]/).map((t) => t.trim()).filter(Boolean);
        technologies.push(...rawTechs);
      }
    } else {
      name = headerLine;
    }

    for (let i = 1; i < block.length; i++) {
      const line = block[i];
      const cleanBullet = line.replace(/^[•\-*o\u25CF\u25CB\u25AA\u25AB\u2022\u2023\u2043\u2219\s]+/, '').trim();
      if (cleanBullet.length > 10) {
        bullets.push(cleanBullet);
      }
    }

    entries.push({
      name: name || null,
      description: bullets.length > 0 ? bullets[0] : null,
      technologies,
      links,
      bullets,
      source: {
        method: 'pdf_text',
      },
    });
  }

  return entries;
}
