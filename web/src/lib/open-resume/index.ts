import { readPdfFromBase64, readPdfFromBuffer } from "./read-pdf";
import { groupTextItemsIntoLines } from "./group-text-items-into-lines";
import { groupLinesIntoSections } from "./group-lines-into-sections";
import { extractResumeFromSections } from "./extract-resume-from-sections";
import type { Resume } from "./resume-types";

/**
 * Parse a resume PDF using the OpenResume algorithm (single-column English).
 * https://github.com/xitanggg/open-resume
 */
export async function parseResumeFromPdfBase64(
  base64Pdf: string
): Promise<Resume> {
  const textItems = await readPdfFromBase64(base64Pdf);
  const lines = groupTextItemsIntoLines(textItems);
  const sections = groupLinesIntoSections(lines);
  return extractResumeFromSections(sections);
}

export async function parseResumeFromBuffer(
  data: Uint8Array
): Promise<Resume> {
  const textItems = await readPdfFromBuffer(data);
  const lines = groupTextItemsIntoLines(textItems);
  const sections = groupLinesIntoSections(lines);
  return extractResumeFromSections(sections);
}

/** Plain text from PDF for Gemini text fallback (reuses OpenResume line grouping). */
export async function extractPlainTextFromPdfBase64(
  base64Pdf: string
): Promise<string> {
  const textItems = await readPdfFromBase64(base64Pdf);
  const lines = groupTextItemsIntoLines(textItems);
  return lines
    .map((line) => line.map((t) => t.text).join(" "))
    .filter(Boolean)
    .join("\n")
    .trim();
}
