// Match working curl: X-goog-api-key header + gemini-flash-latest
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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

function buildFieldMappingPrompt(fields, profile, jobDescription, autoCoverLetter) {
  const labels = fields.map((f) => f.label);
  const coverLetterNote = autoCoverLetter
    ? 'For cover letter / about / message / why fields: write a 150-word tailored professional paragraph using the JD context.'
    : 'For cover letter fields, use the profile summary if available.';

  return `You are a job autofill assistant.
Form fields on this page: ${JSON.stringify(labels)}
Candidate profile: ${JSON.stringify(profile)}
Job description (if found on page): ${JSON.stringify(jobDescription || '')}

Return ONLY a valid JSON object mapping each field label (exact string from the list) to the correct profile value.
Use null for no match.
${coverLetterNote}
No markdown. No explanation. Raw JSON only.`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(apiKey, parts) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent`;

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({ contents: [{ parts }] })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from Gemini');
        return text;
      }

      const errText = await res.text();
      lastError = new Error(`Gemini API error (${res.status}): ${errText.slice(0, 200)}`);
      lastError.status = res.status;

      if (res.status === 503 && attempt < 2) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      break;
    }

    if (lastError?.status === 429 || lastError?.status === 403) break;
  }

  throw lastError || new Error('Gemini API failed');
}

async function geminiExtractProfileFromPdf(apiKey, base64Pdf) {
  const text = await callGemini(apiKey, [
    { inline_data: { mime_type: 'application/pdf', data: base64Pdf } },
    { text: EXTRACTION_PROMPT }
  ]);
  const profile = parseJsonResponse(text);
  if (!profile) throw new Error('Could not parse profile JSON from Gemini');
  return profile;
}

async function geminiExtractProfileFromText(apiKey, resumeText) {
  const prompt = `${EXTRACTION_PROMPT}\n\n--- RESUME TEXT ---\n${resumeText.slice(0, 12000)}`;
  const text = await callGemini(apiKey, [{ text: prompt }]);
  const profile = parseJsonResponse(text);
  if (!profile) throw new Error('Could not parse profile JSON from Gemini');
  return profile;
}

async function geminiMapFields(apiKey, fields, profile, jobDescription, autoCoverLetter) {
  const prompt = buildFieldMappingPrompt(fields, profile, jobDescription, autoCoverLetter);
  const text = await callGemini(apiKey, [{ text: prompt }]);
  return parseJsonResponse(text);
}

async function geminiGenerateCoverLetter(apiKey, profile, jobContext) {
  const prompt = `You are an expert career coach. Write a tailored cover letter for this job application using ONLY the resume and job description below.

=== JOB ===
Title: ${jobContext.jobTitle || 'Not specified'}
Company: ${jobContext.companyName || 'Not specified'}
Job Description:
${(jobContext.jobDescription || 'Not provided').slice(0, 4500)}

=== CANDIDATE RESUME (JSON) ===
${JSON.stringify(profile).slice(0, 9000)}

Instructions:
- 180-220 words, professional tone
- Match candidate skills and experiences to JD requirements
- Mention the company and role by name
- Do not invent facts not in the resume
- Sign off with candidate name, email, phone from resume
- Plain text only, no markdown`;

  const text = await callGemini(apiKey, [{ text: prompt }]);
  if (!text?.trim()) throw new Error('Gemini returned empty cover letter');
  return text.trim();
}

async function geminiGenerateReferralMessage(apiKey, profile, jobContext, person) {
  const prompt = `Write a LinkedIn connection request note (max 280 characters) asking for a referral.

Target person: ${person.name || 'Unknown'} — ${person.title || 'Unknown role'}
Company applying to: ${jobContext.companyName || 'the company'}
Role applying for: ${jobContext.jobTitle || 'the role'}

Candidate resume summary:
Name: ${profile.fullName}
Current role: ${profile.currentDesignation} at ${profile.currentCompany}
Experience: ${profile.totalExperience}
Key skills: ${(profile.primarySkills || '').slice(0, 300)}

Job description excerpt:
${(jobContext.jobDescription || '').slice(0, 1200)}

Rules:
- Under 280 characters (LinkedIn limit)
- Polite, specific, not pushy
- Mention the exact role and company
- Plain text, no quotes or markdown
- Return ONLY the note text`;

  const text = await callGemini(apiKey, [{ text: prompt }]);
  const note = text?.trim().replace(/^["']|["']$/g, '');
  if (!note) throw new Error('Gemini returned empty referral message');
  return note.slice(0, 300);
}
