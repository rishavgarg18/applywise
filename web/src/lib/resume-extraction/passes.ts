import {
  callGemini,
  parseJsonResponse,
  type GeminiPart,
  type GenerationConfig,
} from "../gemini-client";
import type { Profile } from "../types";
import {
  CONTACT_PROMPT,
  EDUCATION_PROMPT,
  EXPERIENCE_PROMPT,
  SKILLS_PROMPT,
} from "./prompts";
import {
  CONTACT_SCHEMA,
  EDUCATION_SCHEMA,
  EXPERIENCE_SCHEMA,
  SKILLS_SCHEMA,
} from "./schemas";

export type DocumentSource = "pdf" | "text";

export type PassContext = {
  source: DocumentSource;
  base64Pdf?: string;
  resumeText?: string;
};

const CONTACT_CONFIG: GenerationConfig = {
  temperature: 0,
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
  responseSchema: CONTACT_SCHEMA,
};

const EXPERIENCE_CONFIG: GenerationConfig = {
  temperature: 0,
  maxOutputTokens: 16384,
  responseMimeType: "application/json",
  responseSchema: EXPERIENCE_SCHEMA,
};

const EDUCATION_CONFIG: GenerationConfig = {
  temperature: 0,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
  responseSchema: EDUCATION_SCHEMA,
};

const SKILLS_CONFIG: GenerationConfig = {
  temperature: 0,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: SKILLS_SCHEMA,
};

function buildDocumentParts(ctx: PassContext, prompt: string): GeminiPart[] {
  if (ctx.source === "pdf" && ctx.base64Pdf) {
    return [
      { inline_data: { mime_type: "application/pdf", data: ctx.base64Pdf } },
      { text: prompt },
    ];
  }

  const text = ctx.resumeText?.slice(0, 24000) || "";
  return [{ text: `${prompt}\n\n--- RESUME TEXT ---\n${text}` }];
}

async function runPass(
  ctx: PassContext,
  prompt: string,
  config: GenerationConfig
): Promise<Partial<Profile>> {
  const raw = await callGemini(buildDocumentParts(ctx, prompt), config);
  const parsed = parseJsonResponse(raw);
  return (parsed || {}) as Partial<Profile>;
}

export async function runAllPasses(
  ctx: PassContext
): Promise<Partial<Profile>> {
  const [contact, experiences, education, skills] = await Promise.all([
    runPass(ctx, CONTACT_PROMPT, CONTACT_CONFIG),
    runPass(ctx, EXPERIENCE_PROMPT, EXPERIENCE_CONFIG),
    runPass(ctx, EDUCATION_PROMPT, EDUCATION_CONFIG),
    runPass(ctx, SKILLS_PROMPT, SKILLS_CONFIG),
  ]);

  return {
    ...contact,
    experiences: experiences.experiences || [],
    education: education.education || [],
    summary: skills.summary ?? null,
    primarySkills: skills.primarySkills ?? null,
    secondarySkills: skills.secondarySkills ?? null,
    programmingLanguages: skills.programmingLanguages ?? null,
    spokenLanguages: skills.spokenLanguages ?? null,
    projects: skills.projects || [],
    certifications: skills.certifications || [],
    achievements: skills.achievements || [],
  };
}
