// Estimate the width of a space for a token, derived from its font height.
function spaceWidthFor(token) {
  return (token.h || 10) * 0.28;
}

// Group tokens that share a baseline into a single visual line. Uses an
// adaptive threshold based on font height so large headings and small body
// text are both grouped correctly (a fixed pixel threshold splits headings
// and merges tight body lines).
function groupIntoRows(tokens) {
  const sorted = [...tokens].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  let current = null;

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
  return rows;
}

// Join the tokens of one visual line left-to-right. Inserts a space between
// tokens separated by a real gap, but keeps glyph runs of the same word
// together (PDFs often split a word into multiple text items with ~0 gap).
function rowToText(row) {
  const items = [...row.items].sort((a, b) => a.x - b.x);
  let out = "";
  let prevEnd = null;
  let prevSpace = spaceWidthFor(items[0]);

  for (const t of items) {
    if (prevEnd !== null) {
      const gap = t.x - prevEnd;
      if (gap > prevSpace * 0.25) out += " ";
    }
    out += t.str;
    prevEnd = t.endX;
    prevSpace = spaceWidthFor(t);
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

// Detect a clean vertical gutter that splits the page into two columns. Many
// resumes use a sidebar (skills/contact) + main column; sorting everything by
// Y interleaves the two into unreadable lines. Returns the split x-coordinate
// or null when the page is single-column.
function detectColumnSplit(tokens) {
  if (tokens.length < 12) return null;

  let left = Infinity;
  let right = -Infinity;
  for (const t of tokens) {
    if (t.x < left) left = t.x;
    if (t.endX > right) right = t.endX;
  }
  const width = right - left;
  if (width <= 0) return null;

  let best = null;
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
    const minSide = Math.min(leftCount, rightCount);
    if (minSide < tokens.length * 0.15) continue;
    if (!best || crossing < best.crossing) best = { split, crossing, minSide };
  }

  if (!best) return null;
  // Require a genuinely clean gutter — few tokens straddle the divider.
  if (best.crossing > tokens.length * 0.04) return null;
  return best.split;
}

function tokensToText(tokens) {
  return groupIntoRows(tokens)
    .map(rowToText)
    .filter(Boolean)
    .join("\n");
}

function pageToText(items) {
  const tokens = [];
  for (const item of items) {
    if (item.str == null || !item.str.trim()) continue;
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

async function extractTextFromPdfFile(file) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.min.js");
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(pageToText(content.items));
  }
  return pages.join("\n").trim();
}
