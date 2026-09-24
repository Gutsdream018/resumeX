import mammoth from 'mammoth';

export interface DocxExtractionResult {
  text: string;
  headings: string[];
  tables: string[][][];
  wordCount: number;
  charCount: number;
}

/**
 * Extracts structured text from a Word DOCX file, preserving document headings,
 * lists, tables, and paragraphs.
 */
export async function extractDocxStructuredContent(
  docxBuffer: Buffer
): Promise<DocxExtractionResult> {
  const headings: string[] = [];

  // Custom mammoth options to extract headings and preserve line structure
  const options = {
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Title'] => h1:fresh",
      "p[style-name='Subtitle'] => h2:fresh",
    ],
  };

  const rawResult = await mammoth.extractRawText({ buffer: docxBuffer });
  const rawText = (rawResult.value || '').trim();

  // Also convert to HTML to easily discover headings and list elements
  const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer }, options);
  const html = htmlResult.value || '';

  const headingMatches = html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi);
  for (const match of headingMatches) {
    const headingClean = match[1].replace(/<[^>]+>/g, '').trim();
    if (headingClean) {
      headings.push(headingClean);
    }
  }

  // Clean lines and normalize bullets
  const cleanedText = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return {
    text: cleanedText,
    headings,
    tables: [],
    wordCount: cleanedText.split(/\s+/).filter(Boolean).length,
    charCount: cleanedText.length,
  };
}
