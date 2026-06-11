async function extractProfile({ base64, resumeText }) {
  const local = resumeText ? extractProfileFromText(resumeText) : null;
  let geminiProfile = null;
  let geminiError = null;

  if (resumeText) {
    try {
      const res = await Api.ai('extractProfileFromText', { resumeText });
      geminiProfile = res.result;
    } catch (err) {
      geminiError = err;
    }
  }

  if (!geminiProfile && base64) {
    try {
      const res = await Api.ai('extractProfileFromPdf', { base64Pdf: base64 });
      geminiProfile = res.result;
    } catch (err) {
      geminiError = geminiError || err;
    }
  }

  if (geminiProfile) {
    return {
      profile: { ...Storage.DEFAULT_PROFILE, ...mergeProfiles(local, geminiProfile) },
      warning: null
    };
  }

  if (local && profileHasContent(local)) {
    let warning = 'Profile parsed locally from your PDF.';
    if (geminiError?.message?.includes('429')) {
      warning = 'Gemini quota exceeded — used local parser. Experience, skills, and education were extracted from your PDF.';
    } else if (geminiError?.message?.includes('503')) {
      warning = 'Gemini is busy — used local parser. Experience, skills, and education were extracted from your PDF.';
    } else if (geminiError) {
      warning = 'Gemini unavailable — used local parser instead.';
    }
    return {
      profile: { ...Storage.DEFAULT_PROFILE, ...local },
      warning
    };
  }

  if (geminiError) throw geminiError;
  throw new Error('Could not extract profile from resume.');
}

async function mapFields({ fields, profile, jobDescription, autoCoverLetter, rulesFirst }) {
  let mapping = ruleBasedMapping(fields, profile);

  if (rulesFirst !== false) {
    const matched = Object.values(mapping).filter((v) => v).length;
    if (matched >= Math.max(2, Math.floor(fields.length * 0.35))) return mapping;
  }

  try {
    const res = await Api.ai('mapFieldsWithAi', {
      fields,
      profile,
      jobDescription,
      autoCoverLetter
    });
    if (res.result) return { ...mapping, ...res.result };
  } catch {
    /* use rules */
  }

  return mapping;
}

async function generateCoverLetter({ profile, jobContext }) {
  const res = await Api.ai('generateCoverLetter', {
    profile,
    jobTitle: jobContext?.title || '',
    company: jobContext?.company || '',
    jobDescription: jobContext?.description || ''
  });
  return { letter: res.result, source: 'gemini' };
}

async function generateReferralMessage({ profile, jobContext, person }) {
  const res = await Api.ai('generateReferralMessage', {
    profile,
    jobContext: jobContext || {},
    person: person || {}
  });
  return { message: res.result, source: 'gemini' };
}
