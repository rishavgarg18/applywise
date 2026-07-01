import type { TextItem as PdfjsTextItem } from "pdfjs-dist/types/src/display/api";
import type { TextItem, TextItems } from "./types";

/**
 * Read PDF bytes into OpenResume TextItems (font-aware tokens with x/y).
 * Based on OpenResume read-pdf.ts — https://github.com/xitanggg/open-resume
 */
export async function readPdfFromBuffer(data: Uint8Array): Promise<TextItems> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfFile = await pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  let textItems: TextItems = [];

  for (let i = 1; i <= pdfFile.numPages; i++) {
    const page = await pdfFile.getPage(i);
    const textContent = await page.getTextContent();
    await page.getOperatorList();
    const commonObjs = page.commonObjs;

    const pageTextItems = textContent.items.map((item) => {
      const {
        str: text,
        transform,
        fontName: pdfFontName,
        width,
        height,
        hasEOL,
      } = item as PdfjsTextItem;

      const x = transform[4];
      const y = transform[5];

      let fontName = pdfFontName;
      try {
        const fontObj = commonObjs.get(pdfFontName);
        if (fontObj?.name) fontName = fontObj.name;
      } catch {
        /* use default font name */
      }

      const newText = text.replace(/-­‐/g, "-");

      return {
        text: newText,
        x,
        y,
        width: width ?? 0,
        height: height ?? Math.abs(transform[3]) ?? 10,
        fontName,
        hasEOL: hasEOL ?? false,
      } satisfies TextItem;
    });

    textItems.push(...pageTextItems);
  }

  const isEmptySpace = (textItem: TextItem) =>
    !textItem.hasEOL && textItem.text.trim() === "";
  textItems = textItems.filter((textItem) => !isEmptySpace(textItem));

  return textItems;
}

export async function readPdfFromBase64(base64Pdf: string): Promise<TextItems> {
  const buffer = Buffer.from(base64Pdf, "base64");
  return readPdfFromBuffer(new Uint8Array(buffer));
}
