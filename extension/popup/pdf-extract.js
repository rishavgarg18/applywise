function itemsToLines(items) {
  const positioned = [];
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

  const lines = [];
  let current = [];
  let lastY = null;

  for (const item of positioned) {
    if (lastY !== null && Math.abs(item.y - lastY) > 4) {
      if (current.length) lines.push(current.join(' ').replace(/\s+/g, ' ').trim());
      current = [];
    }
    current.push(item.str);
    lastY = item.y;
  }

  if (current.length) lines.push(current.join(' ').replace(/\s+/g, ' ').trim());
  return lines;
}

async function extractTextFromPdfFile(file) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const lines = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    lines.push(...itemsToLines(content.items));
  }
  return lines.join('\n').trim();
}
