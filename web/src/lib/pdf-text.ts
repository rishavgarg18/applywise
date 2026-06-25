type PdfTextItem = {
  str?: string;
  transform: number[];
  width?: number;
  height?: number;
};

type Token = {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  endX: number;
};

function spaceWidthFor(token: Token): number {
  return (token.h || 10) * 0.28;
}

/** Group tokens sharing a baseline into a visual line (adaptive to font size). */
function groupIntoRows(tokens: Token[]): Token[][] {
  const sorted = [...tokens].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: { y: number; h: number; items: Token[] }[] = [];
  let current: { y: number; h: number; items: Token[] } | null = null;

  for (const t of sorted) {
    const threshold = Math.max(3, (current?.h || t.h || 10) * 0.6);
    if (current && Math.abs(t.y - current.y) <= threshold) {
      current.items.push(t);
      current.h = Math.max(current.h, t.h || 0);
    } else {
      current = { y: t.y, h: t.h || 10, items: [t] };
      rows.push(current);
    }
  }
  return rows.map((r) => r.items);
}

/** Join one visual line left-to-right, keeping split glyph-runs of a word together. */
function rowToText(items: Token[]): string {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let out = "";
  let prevEnd: number | null = null;
  let prevSpace = spaceWidthFor(sorted[0]);

  for (const t of sorted) {
    if (prevEnd !== null && t.x - prevEnd > prevSpace * 0.25) out += " ";
    out += t.str;
    prevEnd = t.endX;
    prevSpace = spaceWidthFor(t);
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

/** Find a clean vertical gutter splitting the page into two columns, or null. */
function detectColumnSplit(tokens: Token[]): number | null {
  if (tokens.length < 12) return null;

  let left = Infinity;
  let right = -Infinity;
  for (const t of tokens) {
    if (t.x < left) left = t.x;
    if (t.endX > right) right = t.endX;
  }
  const width = right - left;
  if (width <= 0) return null;

  let best: { split: number; crossing: number } | null = null;
  for (let frac = 0.3; frac <= 0.7; frac += 0.05) {
    const split = left + width * frac;
    let crossing = 0;
    let leftCount = 0;
    let rightCount = 0;
    for (const t of tokens) {
      if (t.x < split && t.endX > split) crossing++;
      else if (t.endX <= split) leftCount++;
      else rightCount++;
    }
    if (Math.min(leftCount, rightCount) < tokens.length * 0.15) continue;
    if (!best || crossing < best.crossing) best = { split, crossing };
  }

  if (!best || best.crossing > tokens.length * 0.04) return null;
  return best.split;
}

function tokensToText(tokens: Token[]): string {
  return groupIntoRows(tokens).map(rowToText).filter(Boolean).join("\n");
}

function pageToText(items: PdfTextItem[]): string {
  const tokens: Token[] = [];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4] ?? 0;
    const y = transform[5] ?? 0;
    const w = item.width ?? 0;
    const h = item.height || Math.abs(transform[3]) || 10;
    tokens.push({ str: item.str, x, y, w, h, endX: x + w });
  }
  if (!tokens.length) return "";

  const split = detectColumnSplit(tokens);
  if (split == null) return tokensToText(tokens);

  const leftCol = tokens.filter((t) => t.x + t.w / 2 < split);
  const rightCol = tokens.filter((t) => t.x + t.w / 2 >= split);
  return [tokensToText(leftCol), tokensToText(rightCol)]
    .filter(Boolean)
    .join("\n");
}

/** Extract plain text from a PDF file in the browser. */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(pageToText(content.items as PdfTextItem[]));
  }

  return pages.join("\n").trim();
}
