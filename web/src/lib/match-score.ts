import type { JobListing, Profile, Settings } from "./types";

export type MatchContext = {
  settings?: Settings | null;
};

function profileSkillTokens(profile: Profile): string[] {
  const raw = [
    profile.primarySkills,
    profile.secondarySkills,
    profile.programmingLanguages,
    ...profile.experiences.map((e) => `${e.role || ""} ${e.description || ""}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [...new Set(raw.split(/[,;/|\n]+/).map((s) => s.trim()).filter(Boolean))];
}

function profileSkillHaystack(profile: Profile): string {
  return [
    profile.primarySkills,
    profile.secondarySkills,
    profile.programmingLanguages,
    profile.summary,
    ...profile.experiences.map((e) => e.description),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function titleTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,/|-]+/)
    .filter((t) => t.length > 2);
}

export function computeMatchScore(
  profile: Profile | null,
  job: JobListing,
  context: MatchContext = {}
): number {
  if (!profile) return 55;

  let score = 40;
  const haystack = profileSkillHaystack(profile);
  const skillTokens = profileSkillTokens(profile);

  const jobText = `${job.title} ${job.description} ${job.skills.join(" ")}`.toLowerCase();
  const jobSkills = job.skills.map((s) => s.toLowerCase());

  const matchedSkills = jobSkills.filter(
    (skill) =>
      haystack.includes(skill) ||
      skill.split(/[\s/]+/).some((part) => part.length > 2 && haystack.includes(part))
  );
  score += matchedSkills.length * 10;

  for (const token of skillTokens) {
    if (token.length > 2 && jobText.includes(token)) {
      score += 4;
    }
  }

  const targetRoles =
    context.settings?.targetRoles ||
    profile.currentDesignation ||
    "";
  const roleTerms = titleTokens(targetRoles);
  const jobTitleTerms = titleTokens(job.title);

  if (roleTerms.length && jobTitleTerms.length) {
    const roleOverlap = roleTerms.filter((t) =>
      jobTitleTerms.some((jt) => jt.includes(t) || t.includes(jt))
    ).length;
    score += Math.min(20, roleOverlap * 8);
  }

  if (profile.currentDesignation) {
    const designation = profile.currentDesignation.toLowerCase();
    const jobTitle = job.title.toLowerCase();
    const desigWord = designation.split(/\s+/)[0];
    if (desigWord && desigWord.length > 2) {
      if (jobTitle.includes(desigWord) || designation.split(/\s+/).some((w) => w.length > 3 && jobTitle.includes(w))) {
        score += 12;
      }
    }
  }

  const workMode =
    context.settings?.preferredWorkMode || profile.workMode || "";
  if (workMode === "remote" && job.remote) score += 10;
  if (workMode === "onsite" && !job.remote) score += 4;

  const preferredLoc =
    profile.preferredLocations || profile.city || profile.state || "";
  if (preferredLoc) {
    const locParts = preferredLoc.toLowerCase().split(/[,/|]+/);
    const jobLoc = job.location.toLowerCase();
    if (
      locParts.some((part) => part.trim().length > 2 && jobLoc.includes(part.trim())) ||
      (preferredLoc.toLowerCase().includes("remote") && job.remote)
    ) {
      score += 8;
    }
  }

  const exp = parseFloat(profile.totalExperience || "0");
  if (job.type === "Internship" && exp < 2) score += 10;
  if (job.type === "New Grad" && exp < 1) score += 10;
  if (job.type === "Full-time" && exp >= 2) score += 6;

  return Math.min(98, Math.max(35, score));
}

export function profileHasMatchableData(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.primarySkills ||
      profile.currentDesignation ||
      profile.experiences.length > 0
  );
}

export function sortJobsByMatch(
  jobs: JobListing[],
  profile: Profile | null,
  context: MatchContext = {},
  options?: { minScore?: number }
): (JobListing & { matchScore: number })[] {
  const minScore = options?.minScore ?? (profileHasMatchableData(profile) ? 45 : 0);

  return jobs
    .map((job) => ({ ...job, matchScore: computeMatchScore(profile, job, context) }))
    .filter((job) => job.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}
