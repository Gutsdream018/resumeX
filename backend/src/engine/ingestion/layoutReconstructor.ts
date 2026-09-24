import { LayoutBlock } from './types.js';

export interface ReconstructedLayout {
  fullText: string;
  sections: Array<{
    heading: string;
    rawText: string;
    blocks: LayoutBlock[];
    page: number;
  }>;
  headerBlocks: LayoutBlock[];
}

/**
 * Reconstructs document hierarchy and organizes layout blocks into structured sections.
 */
export function reconstructDocumentLayout(
  blocks: LayoutBlock[],
  rawFallbackText: string
): ReconstructedLayout {
  if (!blocks || blocks.length === 0) {
    return {
      fullText: rawFallbackText,
      sections: [],
      headerBlocks: [],
    };
  }

  // Sort blocks by page, then column, then y-coordinate
  const sortedBlocks = [...blocks].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if ((a.column || 1) !== (b.column || 1)) return (a.column || 1) - (b.column || 1);
    return a.y - b.y;
  });

  const fullText = sortedBlocks.map((b) => b.text).join('\n');
  const headerBlocks = sortedBlocks.filter((b) => b.page === 1 && b.y < 160);

  return {
    fullText,
    sections: [],
    headerBlocks,
  };
}
