import type { Profile } from "./types";
import { DEFAULT_PROFILE } from "./defaults";
import { mergeProfiles, parseResumeText } from "./resume-parser";

const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];
const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const EXTRACTION_PROMPT = `You are a resume parser. Extract ALL information from this resume and return ONLY a JSON object with these exact keys.
Return null for missing fields. No markdown, no explanation, just raw JSON.

{
  "firstName": null, "lastName": null, "fullName": null, "email": null, "phone": null, "alternatePhone": null,
  "city": null, "state": null, "country": null, "pinCode": null, "dateOfBirth": null, "gender": null,
  "linkedin": null, "github": null, "portfolio": null,
  "currentDesignation": null, "currentCompany": null, "totalExperience": null,
  "currentCTC": null, "expectedCTC": null, "noticePeriod": null,
  "preferredLocations": null, "workMode": null, "summary": null,
  "primarySkills": null, "secondarySkills": null, "programmingLanguages": null, "spokenLanguages": null,
  "fathersName": null, "maritalStatus": null, "nationality": null, "category": null,
  "differentlyAbled": null, "permanentAddress": null, "currentAddress": null,
  "experiences": [{ "company": null, "role": null, "from": null, "to": null, "type": null, "location": null, "description": null }],
  "education": [{ "degree": null, "institution": null, "from": null, "to": null, "percentage": null, "stream": null }],
  "certifications": [{ "name": null, "issuer": null, "date": null, "expiry": null, "id": null, "url": null }],
  "projects": [{ "name": null, "techStack": null, "description": null, "url": null, "duration": null }],
  "achievements": []
}`;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

function parseJsonResponse(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(
  parts: {
    text?: string;
    inline_data?: { mime_type: string; data: string };
  }[]
) {
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
        body: JSON.stringify({ contents: [{ parts }] }),
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

export async function extractProfileFromPdf(base64Pdf: string): Promise<Profile> {
  const text = await callGemini([
    { inline_data: { mime_type: "application/pdf", data: base64Pdf } },
    { text: EXTRACTION_PROMPT },
  ]);
  const profile = parseJsonResponse(text);
  if (!profile) throw new Error("Could not parse profile JSON from Gemini");
  return profile as unknown as Profile;
}

export async function extractProfileFromText(resumeText: string): Promise<Profile> {
  const text = await callGemini([
    { text: `${EXTRACTION_PROMPT}\n\nResume text:\n${resumeText.slice(0, 12000)}` },
  ]);
  const profile = parseJsonResponse(text);
  if (!profile) throw new Error("Could not parse profile JSON from Gemini");
  return profile as unknown as Profile;
}

function profileHasContent(profile: Partial<Profile>) {
  return !!(
    profile.fullName ||
    profile.email ||
    profile.summary ||
    profile.primarySkills ||
    profile.experiences?.length ||
    profile.education?.length
  );
}

/** Text-first extraction with local parser fallback — same strategy as the extension. */
export async function extractProfile(options: {
  resumeText?: string;
  base64Pdf?: string;
}): Promise<{ profile: Profile; warning?: string }> {
  const local = options.resumeText ? parseResumeText(options.resumeText) : null;
  let geminiProfile: Partial<Profile> | null = null;
  let geminiError: Error | null = null;

  if (options.resumeText) {
    try {
      geminiProfile = await extractProfileFromText(options.resumeText);
    } catch (err) {
      geminiError = err instanceof Error ? err : new Error("Gemini text failed");
    }
  }

  if (!geminiProfile && options.base64Pdf) {
    try {
      geminiProfile = await extractProfileFromPdf(options.base64Pdf);
    } catch (err) {
      geminiError =
        geminiError || (err instanceof Error ? err : new Error("Gemini PDF failed"));
    }
  }

  if (geminiProfile) {
    return {
      profile: {
        ...DEFAULT_PROFILE,
        ...mergeProfiles(local, geminiProfile),
      } as Profile,
    };
  }

  if (local && profileHasContent(local)) {
    return {
      profile: { ...DEFAULT_PROFILE, ...local } as Profile,
      warning: geminiError
        ? "AI extraction failed — profile built from local PDF text parser."
        : undefined,
    };
  }

  throw geminiError || new Error("Could not extract profile from resume");
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

  const text = await callGemini([{ text: prompt }]);
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

  const text = await callGemini([{ text: prompt }]);
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

  const text = await callGemini([{ text: prompt }]);
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
