const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];
const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiPart = {
  text?: string;
  inline_data?: { mime_type: string; data: string };
};

export type GenerationConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
};

export const JSON_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGemini(
  parts: GeminiPart[],
  generationConfig?: GenerationConfig
): Promise<string> {
  const apiKey = getApiKey();
  let lastError: Error & { status?: number } | null = null;

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent`;

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          ...(generationConfig ? { generationConfig } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini");
        return text;
      }

      const errText = await res.text();
      lastError = new Error(
        `Gemini API error (${res.status}): ${errText.slice(0, 200)}`
      );
      lastError.status = res.status;

      if (res.status === 503 && attempt < 2) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      break;
    }

    if (lastError?.status === 429 || lastError?.status === 403) break;
  }

  throw lastError || new Error("Gemini API failed");
}

export function repairTruncatedJson(input: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let repaired = input;
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/, "").replace(/:\s*$/, ": null");
  while (stack.length) repaired += stack.pop();
  return repaired;
}

export function parseJsonResponse(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1) return null;

  const candidate =
    end > start ? cleaned.slice(start, end + 1) : cleaned.slice(start);
  const noTrailingCommas = candidate.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(noTrailingCommas);
  } catch {
    try {
      return JSON.parse(repairTruncatedJson(noTrailingCommas));
    } catch {
      return null;
    }
  }
}
