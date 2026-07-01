import type { Profile } from "../types";
import { isBulletLine } from "../open-resume/text-utils";

export function isValidExperience(
  e: NonNullable<Profile["experiences"]>[number]
): boolean {
  if (!e.company?.trim() || !e.role?.trim()) return false;
  if (isBulletLine(e.company)) return false;
  if (e.role.includes(" - ") && e.role.length > 60) return false;
  return true;
}

function hasMeaningfulSkills(profile: Partial<Profile>): boolean {
  const skills = profile.primarySkills?.trim();
  return !!skills && skills.length >= 8;
}

/**
 * Score extraction quality 0–100.
 * - ≥70 good: contact + experience + (education or skills)
 * - ≥50 acceptable: contact + at least one structured section
 * - <50 poor: needs retry or manual review
 */
export function scoreExtraction(profile: Partial<Profile>): number {
  let score = 0;

  if (profile.fullName) score += 15;
  if (profile.email) score += 12;
  if (profile.phone) score += 8;
  if (profile.linkedin || profile.github) score += 5;

  const expCount =
    profile.experiences?.filter(isValidExperience).length ?? 0;
  if (expCount >= 1) score += 20;
  if (expCount >= 2) score += 10;
  if (expCount >= 3) score += 5;

  const eduCount = profile.education?.filter((e) => e.degree || e.institution).length ?? 0;
  if (eduCount >= 1) score += 15;
  if (eduCount >= 2) score += 5;

  if (hasMeaningfulSkills(profile)) score += 12;
  if (profile.summary && profile.summary.length > 40) score += 8;

  const projCount = profile.projects?.filter((p) => p.name)?.length ?? 0;
  if (projCount >= 1) score += 5;

  return Math.min(100, score);
}

export function qualityWarning(score: number): string | undefined {
  if (score >= 70) return undefined;
  if (score >= 50) {
    return "Profile partially extracted — please review work history and education before applying.";
  }
  return "We couldn't read your full resume — please add work history and education manually.";
}

export function profileHasContent(profile: Partial<Profile>): boolean {
  return scoreExtraction(profile) >= 50;
}
