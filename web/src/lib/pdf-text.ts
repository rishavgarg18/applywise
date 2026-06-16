type PdfTextItem = {
  str?: string;
  transform: number[];
};

/** Rebuild readable lines from PDF text items using Y/X coordinates. */
function itemsToLines(items: PdfTextItem[]): string[] {
  const positioned: { str: string; x: number; y: number }[] = [];

  for (const item of items) {
    if (!item.str?.trim()) continue;
    positioned.push({
      str: item.str,
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    });
  }

  positioned.sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 4) return yDiff;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let current: string[] = [];
  let lastY: number | null = null;

  for (const item of positioned) {
    if (lastY !== null && Math.abs(item.y - lastY) > 4) {
      if (current.length) {
        lines.push(current.join(" ").replace(/\s+/g, " ").trim());
      }
      current = [];
    }
    current.push(item.str);
    lastY = item.y;
  }

  if (current.length) {
    lines.push(current.join(" ").replace(/\s+/g, " ").trim());
  }

  return lines;
}

/** Extract plain text from a PDF file in the browser. */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    lines.push(...itemsToLines(content.items as PdfTextItem[]));
  }

  return lines.join("\n").trim();
}
