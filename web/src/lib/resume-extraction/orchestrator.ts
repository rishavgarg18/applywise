import { DEFAULT_PROFILE } from "../defaults";
import {
  extractPlainTextFromPdfBase64,
  parseResumeFromPdfBase64,
} from "../open-resume";
import { openResumeToProfile } from "../open-resume/to-profile";
import { parseResumeText } from "../resume-parser";
import type { ExtractionResult, Profile } from "../types";
import {
  contactFieldsOnly,
  ensembleMerge,
  mergeWithContactFields,
} from "./merge";
import { normalizeProfile } from "./normalize";
import { runAllPasses } from "./passes";
import {
  profileHasContent,
  qualityWarning,
  scoreExtraction,
} from "./quality";

const OPEN_RESUME_GOOD_THRESHOLD = 70;

function logMetrics(metrics: {
  qualityScore: number;
  documentSource: string;
  retryCount: number;
}) {
  console.info("[resume-extraction]", JSON.stringify(metrics));
}

async function tryOpenResumeParse(
  base64Pdf: string
): Promise<Partial<Profile> | null> {
  try {
    const resume = await parseResumeFromPdfBase64(base64Pdf);
    return openResumeToProfile(resume);
  } catch {
    return null;
  }
}

export async function orchestrateExtraction(options: {
  resumeText?: string;
  base64Pdf?: string;
}): Promise<ExtractionResult> {
  const local = options.resumeText
    ? parseResumeText(options.resumeText)
    : null;

  let serverText = "";
  if (options.base64Pdf) {
    try {
      serverText = await extractPlainTextFromPdfBase64(options.base64Pdf);
    } catch {
      /* optional */
    }
  }

  const bestText = [serverText, options.resumeText || ""]
    .filter((t) => t && t.length > 50)
    .sort((a, b) => b.length - a.length)[0] || "";

  let profile: Partial<Profile> = {};
  let documentSource = "none";
  let retryCount = 0;
  let lastError: Error | null = null;

  if (options.base64Pdf) {
    const openResumeProfile = await tryOpenResumeParse(options.base64Pdf);
    if (openResumeProfile) {
      profile = normalizeProfile(
        mergeWithContactFields(openResumeProfile, local)
      );
      documentSource = "open-resume";
      const openScore = scoreExtraction(profile);

      if (openScore >= OPEN_RESUME_GOOD_THRESHOLD) {
        logMetrics({ qualityScore: openScore, documentSource, retryCount: 0 });
        return {
          profile: { ...DEFAULT_PROFILE, ...profile } as Profile,
          qualityScore: openScore,
          warning: qualityWarning(openScore),
        };
      }
    }
  }

  let qualityScore = scoreExtraction(profile);

  if (qualityScore < OPEN_RESUME_GOOD_THRESHOLD && options.base64Pdf) {
    try {
      const geminiProfile = await runAllPasses({
        source: "pdf",
        base64Pdf: options.base64Pdf,
      });
      profile = ensembleMerge(profile, geminiProfile);
      documentSource =
        documentSource === "open-resume" ? "open-resume+gemini-pdf" : "gemini-pdf";
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("PDF extraction failed");
    }
  }

  qualityScore = scoreExtraction(profile);

  if (qualityScore < 50 && bestText) {
    try {
      retryCount++;
      const textProfile = await runAllPasses({
        source: "text",
        resumeText: bestText,
      });
      profile = ensembleMerge(profile, textProfile);
      documentSource = documentSource.includes("open-resume")
        ? "open-resume+gemini-text"
        : "gemini-text";
      qualityScore = scoreExtraction(profile);
    } catch (err) {
      lastError = err instanceof Error ? err : lastError;
    }
  }

  profile = normalizeProfile(mergeWithContactFields(profile, local));
  qualityScore = scoreExtraction(profile);

  logMetrics({ qualityScore, documentSource, retryCount });

  if (profileHasContent(profile)) {
    return {
      profile: { ...DEFAULT_PROFILE, ...profile } as Profile,
      qualityScore,
      warning: qualityWarning(qualityScore),
    };
  }

  if (local && profileHasContent(local)) {
    return {
      profile: { ...DEFAULT_PROFILE, ...normalizeProfile(local) } as Profile,
      qualityScore: scoreExtraction(local),
      warning:
        lastError?.message
          ? "AI extraction failed — profile built from local PDF text parser."
          : qualityWarning(scoreExtraction(local)),
    };
  }

  throw lastError || new Error("Could not extract profile from resume");
}
