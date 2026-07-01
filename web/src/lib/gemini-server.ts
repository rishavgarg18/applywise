import type { ExtractionResult, Profile } from "./types";
import {
  callGemini,
  JSON_GENERATION_CONFIG,
  parseJsonResponse,
} from "./gemini-client";
import { orchestrateExtraction } from "./resume-extraction/orchestrator";

export async function extractProfile(options: {
  resumeText?: string;
  base64Pdf?: string;
}): Promise<ExtractionResult> {
  return orchestrateExtraction(options);
}

export async function generateCoverLetter(
  profile: Profile,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<string> {
  const prompt = `You are an expert career coach. Write a tailored cover letter for this job application using ONLY the resume and job description below.

=== JOB ===
Title: ${jobTitle || "Not specified"}
Company: ${company || "Not specified"}
Job Description:
${(jobDescription || "Not provided").slice(0, 4500)}

=== CANDIDATE RESUME (JSON) ===
${JSON.stringify(profile).slice(0, 9000)}

Instructions:
- 180-220 words, professional tone
- Match candidate skills and experiences to JD requirements
- Mention the company and role by name
- Do not invent facts not in the resume
- Sign off with candidate name, email, phone from resume
- Plain text only, no markdown`;

  const text = await callGemini([{ text: prompt }]);
  if (!text?.trim()) throw new Error("Gemini returned empty cover letter");
  return text.trim();
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
  const typeInstructions = {
    networking:
      "Write a professional networking email to request an informational chat or express interest in their team.",
    followup:
      "Write a polite follow-up email after submitting a job application.",
    thankyou: "Write a thank-you email after a job interview.",
  };

  const prompt = `You are an expert career coach. ${typeInstructions[type]}

Recipient: ${recipientName}, ${recipientTitle} at ${company}
Role applying for: ${jobTitle}
Additional context: ${context}

Candidate profile:
Name: ${profile.fullName}
Current role: ${profile.currentDesignation} at ${profile.currentCompany}
Skills: ${profile.primarySkills}

Rules:
- 120-180 words
- Professional, warm, not pushy
- Plain text only, include subject line on first line as "Subject: ..."
- Return ONLY the email text`;

  const text = await callGemini([{ text: prompt }]);
  return text?.trim() || "";
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
  const prompt = `Analyze this resume against the job description and return ONLY valid JSON (no markdown):

{
  "score": <number 0-100>,
  "missingKeywords": [<strings>],
  "suggestions": [<strings, max 5>],
  "summary": "<one paragraph assessment>"
}

Resume: ${JSON.stringify(profile).slice(0, 8000)}
Job Description: ${jobDescription.slice(0, 4000)}`;

  const text = await callGemini([{ text: prompt }], JSON_GENERATION_CONFIG);
  const result = parseJsonResponse(text);
  if (!result) {
    return {
      score: 65,
      missingKeywords: [],
      suggestions: ["Add more keywords from the job description"],
      summary: "Unable to parse detailed analysis. Try again.",
    };
  }
  return result as {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    summary: string;
  };
}

export async function tailorResumeSection(
  profile: Profile,
  jobDescription: string,
  section: "summary" | "skills" | "experience"
): Promise<string> {
  const prompt = `Tailor the candidate's ${section} section for this job. Return ONLY the rewritten ${section} text, no markdown.

Job Description: ${jobDescription.slice(0, 4000)}
Current Profile: ${JSON.stringify(profile).slice(0, 6000)}

Rules:
- Do not invent facts
- Optimize for ATS keywords from the JD
- Professional tone`;

  const text = await callGemini([{ text: prompt }]);
  return text?.trim() || "";
}

export async function generateInterviewQuestion(
  profile: Profile,
  jobTitle: string,
  company: string
): Promise<{ question: string; tip: string }> {
  const prompt = `Generate one realistic interview question for this candidate and role. Return ONLY JSON:
{"question": "...", "tip": "how to answer well in 2 sentences"}

Role: ${jobTitle} at ${company}
Candidate: ${profile.fullName}, ${profile.currentDesignation}
Skills: ${profile.primarySkills}`;

  const text = await callGemini([{ text: prompt }], JSON_GENERATION_CONFIG);
  const result = parseJsonResponse(text);
  return (
    (result as { question: string; tip: string }) || {
      question: "Tell me about a challenging project you worked on.",
      tip: "Use the STAR method. Focus on your specific contributions and measurable outcomes.",
    }
  );
}

export async function generateNetworkingMessage(
  profile: Profile,
  personName: string,
  personTitle: string,
  company: string,
  jobTitle: string
): Promise<string> {
  const prompt = `Write a LinkedIn message (max 300 characters) to ${personName} (${personTitle} at ${company}) about interest in the ${jobTitle} role.

Candidate: ${profile.fullName}, ${profile.currentDesignation}
Skills: ${(profile.primarySkills || "").slice(0, 200)}

Rules:
- Under 300 characters
- Polite, specific, not pushy
- Plain text only, no quotes
- Return ONLY the message text`;

  const text = await callGemini([{ text: prompt }]);
  return text?.trim().slice(0, 300) || "";
}

export async function mapFieldsWithAi(
  fields: { label: string; name: string; type: string }[],
  profile: Profile,
  jobDescription: string,
  autoCoverLetter: boolean
): Promise<Record<string, string>> {
  const prompt = `Map form fields to resume values. Return ONLY JSON object where keys are field "name" and values are fill values.

Fields: ${JSON.stringify(fields).slice(0, 6000)}
Profile: ${JSON.stringify(profile).slice(0, 8000)}
Job description: ${(jobDescription || "").slice(0, 3000)}
Auto cover letter: ${autoCoverLetter}

Rules:
- Use exact field "name" as JSON keys
- Empty string if no match
- No markdown`;

  const text = await callGemini([{ text: prompt }], JSON_GENERATION_CONFIG);
  const result = parseJsonResponse(text);
  return (result as Record<string, string>) || {};
}

export async function generateReferralMessage(
  profile: Profile,
  jobContext: { title?: string; company?: string; description?: string },
  person: { name?: string; title?: string }
): Promise<string> {
  const prompt = `Write a short LinkedIn referral request message.

Candidate: ${profile.fullName}, ${profile.currentDesignation}
Job: ${jobContext.title || ""} at ${jobContext.company || ""}
Contact: ${person.name || ""}, ${person.title || ""}
Job description: ${(jobContext.description || "").slice(0, 2000)}

Rules:
- Under 400 characters
- Polite and specific
- Plain text only
- Return ONLY the message`;

  const text = await callGemini([{ text: prompt }]);
  return text?.trim().slice(0, 400) || "";
}
