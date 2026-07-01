import type { ExtractionResult, Profile } from "./types";
import { extractTextFromPdf } from "./pdf-text";

async function postAi<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI request failed");
  return data.result as T;
}

export async function extractProfileFromResume(
  file: File
): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), "")
  );

  let resumeText = "";
  try {
    resumeText = await extractTextFromPdf(file);
  } catch {
    /* server-side PDF parsing */
  }

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "extractProfile",
      resumeText: resumeText || undefined,
      base64Pdf: base64,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Extraction failed");
  return {
    profile: data.profile as Profile,
    qualityScore: (data.qualityScore as number) ?? 0,
    warning: data.warning as string | undefined,
  };
}

export async function generateCoverLetter(
  profile: Profile,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<string> {
  return postAi<string>("generateCoverLetter", {
    profile,
    jobTitle,
    company,
    jobDescription,
  });
}

export async function generateEmail(
  profile: Profile,
  type: "networking" | "followup" | "thankyou",
  recipientName: string,
  recipientTitle: string,
  company: string,
  jobTitle: string,
  context: string
): Promise<string> {
  return postAi<string>("generateEmail", {
    profile,
    type,
    recipientName,
    recipientTitle,
    company,
    jobTitle,
    context,
  });
}

export async function analyzeATS(
  profile: Profile,
  jobDescription: string
): Promise<{
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  summary: string;
}> {
  return postAi("analyzeATS", { profile, jobDescription });
}

export async function tailorResumeSection(
  profile: Profile,
  jobDescription: string,
  section: "summary" | "skills" | "experience"
): Promise<string> {
  return postAi<string>("tailorResumeSection", {
    profile,
    jobDescription,
    section,
  });
}

export async function generateInterviewQuestion(
  profile: Profile,
  jobTitle: string,
  company: string
): Promise<{ question: string; tip: string }> {
  return postAi("generateInterviewQuestion", { profile, jobTitle, company });
}

export async function generateNetworkingMessage(
  profile: Profile,
  personName: string,
  personTitle: string,
  company: string,
  jobTitle: string
): Promise<string> {
  return postAi<string>("generateNetworkingMessage", {
    profile,
    personName,
    personTitle,
    company,
    jobTitle,
  });
}
