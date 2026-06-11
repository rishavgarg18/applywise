import type { JobListing, Profile } from "./types";

export function computeMatchScore(
  profile: Profile | null,
  job: JobListing
): number {
  if (!profile) return Math.floor(55 + Math.random() * 20);

  let score = 50;
  const profileSkills = [
    profile.primarySkills,
    profile.secondarySkills,
    profile.programmingLanguages,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const jobSkills = job.skills.map((s) => s.toLowerCase());
  const matchedSkills = jobSkills.filter(
    (skill) =>
      profileSkills.includes(skill.toLowerCase()) ||
      skill
        .split(/[\s/]+/)
        .some((part) => part.length > 2 && profileSkills.includes(part))
  );
  score += matchedSkills.length * 8;

  const title = (profile.currentDesignation || "").toLowerCase();
  const jobTitle = job.title.toLowerCase();
  if (
    title &&
    (jobTitle.includes(title.split(" ")[0]) ||
      title.includes(jobTitle.split(" ")[0]))
  ) {
    score += 12;
  }

  if (profile.workMode === "remote" && job.remote) score += 8;
  if (profile.preferredLocations) {
    const locs = profile.preferredLocations.toLowerCase();
    if (
      locs.includes("remote") ||
      job.location.toLowerCase().includes(locs.split(",")[0]?.trim() || "")
    ) {
      score += 6;
    }
  }

  const exp = parseFloat(profile.totalExperience || "0");
  if (job.type === "Internship" && exp < 2) score += 10;
  if (job.type === "New Grad" && exp < 1) score += 10;
  if (job.type === "Full-time" && exp >= 3) score += 8;

  return Math.min(98, Math.max(42, score + Math.floor(Math.random() * 6)));
}

export function sortJobsByMatch(
  jobs: JobListing[],
  profile: Profile | null
): (JobListing & { matchScore: number })[] {
  return jobs
    .map((job) => ({ ...job, matchScore: computeMatchScore(profile, job) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
