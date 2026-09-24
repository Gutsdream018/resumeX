import path from 'path';
import * as napiCanvas from '@napi-rs/canvas';
import { LayoutBlock } from './types.js';

// Polyfills for pdfjs-dist in Node environment
(global as any).DOMMatrix = napiCanvas.DOMMatrix;
(global as any).Path2D = napiCanvas.Path2D;
(global as any).ImageData = napiCanvas.ImageData;

let pdfjsLib: any = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist/legacy/build/pdf.js');
    pdfjsLib = mod.default || mod;
  }
  return pdfjsLib;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  blocks: LayoutBlock[];
  isMultiColumn: boolean;
  columnsDetected: number;
}

/**
 * Extracts structured text and layout geometry (x, y, width, height) from a native PDF document.
 * Groups items into coherent lines and reconstructs multi-column reading order.
 */
export async function extractPdfStructuredContent(
  pdfBuffer: Buffer,
  maxPages: number = 10
): Promise<PdfExtractionResult> {
  const pdfjs = await getPdfJs();
  const standardFontDataUrl =
    path.resolve(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts') + '/';

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    standardFontDataUrl,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = Math.min(pdfDoc.numPages, maxPages);
  const allBlocks: LayoutBlock[] = [];
  const pageTexts: string[] = [];
  let multiColumnDetectedOverall = false;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const content = await page.getTextContent();

    const rawItems: Array<{
      str: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
      hasEOL: boolean;
    }> = [];

    for (const item of (content.items || [])) {
      const str = (item.str || '').trim();
      if (!str) continue;

      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = Math.round(transform[4]);
      // Convert PDF coordinate space (y from bottom) to top-down coordinate space
      const y = Math.round(viewport.height - transform[5]);
      const width = Math.round(item.width || str.length * 6);
      const height = Math.round(item.height || Math.abs(transform[0]) || 12);
      const fontSize = Math.round(Math.abs(transform[0]) || Math.abs(transform[3]) || 12);

      rawItems.push({
        str: item.str,
        x,
        y,
        width,
        height,
        fontSize,
        hasEOL: !!item.hasEOL,
      });
    }

    if (rawItems.length === 0) continue;

    // Detect if page has multi-column layout by inspecting x-coordinate distributions
    const pageWidth = viewport.width;
    const midX = pageWidth / 2;
    let leftColCount = 0;
    let rightColCount = 0;

    for (const it of rawItems) {
      if (it.x < midX - 30 && it.x + it.width < midX + 30) {
        leftColCount++;
      } else if (it.x >= midX - 30) {
        rightColCount++;
      }
    }

    const isTwoColumn =
      leftColCount > 10 &&
      rightColCount > 10 &&
      Math.abs(leftColCount - rightColCount) / (leftColCount + rightColCount) < 0.6;

    if (isTwoColumn) multiColumnDetectedOverall = true;

    // Group items into coherent lines based on vertical proximity (y delta <= 4px)
    const lineGroups: Array<typeof rawItems> = [];
    // Sort raw items primarily by y then x
    const sorted = [...rawItems].sort((a, b) => a.y - b.y || a.x - b.x);

    let currentLine: typeof rawItems = [];
    let currentY: number | null = null;

    for (const item of sorted) {
      if (currentY === null || Math.abs(item.y - currentY) <= 4) {
        currentLine.push(item);
        currentY = item.y;
      } else {
        if (currentLine.length > 0) {
          lineGroups.push(currentLine.sort((a, b) => a.x - b.x));
        }
        currentLine = [item];
        currentY = item.y;
      }
    }
    if (currentLine.length > 0) {
      lineGroups.push(currentLine.sort((a, b) => a.x - b.x));
    }

    // If multi-column, sort blocks column-by-column (Header -> Left Col -> Right Col -> Footer)
    const pageBlocks: LayoutBlock[] = [];

    for (const group of lineGroups) {
      const lineText = group.map((g) => g.str).join(' ').replace(/\s+/g, ' ').trim();
      if (!lineText) continue;

      const minX = Math.min(...group.map((g) => g.x));
      const minY = Math.min(...group.map((g) => g.y));
      const maxX = Math.max(...group.map((g) => g.x + g.width));
      const maxY = Math.max(...group.map((g) => g.y + g.height));
      const avgFontSize =
        group.reduce((acc, g) => acc + g.fontSize, 0) / group.length;

      const column = isTwoColumn ? (minX < midX ? 1 : 2) : 1;

      pageBlocks.push({
        text: lineText,
        page: pageNum,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        fontSize: Math.round(avgFontSize),
        isBold: avgFontSize > 13,
        column,
      });
    }

    let orderedPageText = '';
    if (isTwoColumn) {
      // Find top header blocks spanning across or at the top
      const headerBlocks = pageBlocks.filter((b) => b.y < 120 || b.width > pageWidth * 0.7);
      const col1Blocks = pageBlocks.filter(
        (b) => !headerBlocks.includes(b) && b.column === 1
      );
      const col2Blocks = pageBlocks.filter(
        (b) => !headerBlocks.includes(b) && b.column === 2
      );

      const ordered = [
        ...headerBlocks.sort((a, b) => a.y - b.y),
        ...col1Blocks.sort((a, b) => a.y - b.y),
        ...col2Blocks.sort((a, b) => a.y - b.y),
      ];

      orderedPageText = ordered.map((b) => b.text).join('\n');
      allBlocks.push(...ordered);
    } else {
      orderedPageText = pageBlocks.map((b) => b.text).join('\n');
      allBlocks.push(...pageBlocks);
    }

    if (orderedPageText.trim().length > 0) {
      pageTexts.push(orderedPageText);
    }
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount: numPages,
    blocks: allBlocks,
    isMultiColumn: multiColumnDetectedOverall,
    columnsDetected: multiColumnDetectedOverall ? 2 : 1,
  };
}
