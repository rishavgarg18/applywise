import { JOB_LISTINGS } from "../jobs-data";
import type { JobListing, Profile, Settings } from "../types";
import {
  defaultAdzunaCountry,
  isAdzunaConfigured,
  searchAdzunaJobs,
} from "./adzuna";
import { cacheTtlMs, getCached, setCached } from "./cache";
import { adzunaJobToListing } from "./normalize";

export type JobSearchParams = {
  q?: string;
  location?: string;
  page?: number;
  remote?: boolean;
  type?: string;
};

export type JobSearchResult = {
  jobs: JobListing[];
  total: number;
  page: number;
  source: "adzuna" | "static";
  query: string;
  location: string;
};

function parseSalaryMin(minSalary: string): number | undefined {
  const digits = minSalary.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function topSkills(profile: Profile | null, limit = 3): string[] {
  if (!profile?.primarySkills) return [];
  return profile.primarySkills
    .split(/[,;/|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function buildSearchQuery(
  profile: Profile | null,
  settings: Settings | null,
  overrides: JobSearchParams = {}
): { q: string; location: string; salaryMin?: number } {
  const skills = topSkills(profile);
  const roleQuery =
    overrides.q?.trim() ||
    settings?.targetRoles?.split(",")[0]?.trim() ||
    profile?.currentDesignation?.trim() ||
    skills[0] ||
    "software engineer";

  const skillSuffix =
    skills.length > 1 && !overrides.q
      ? ` ${skills.slice(1, 3).join(" ")}`
      : "";

  const q = `${roleQuery}${skillSuffix}`.trim().slice(0, 120);

  const location =
    overrides.location?.trim() ||
    profile?.preferredLocations?.split(",")[0]?.trim() ||
    profile?.city?.trim() ||
    profile?.state?.trim() ||
    "";

  const salaryMin = parseSalaryMin(settings?.minSalary || "");

  return { q, location, salaryMin };
}

function filterJobs(jobs: JobListing[], params: JobSearchParams): JobListing[] {
  let filtered = jobs;

  if (params.remote) {
    filtered = filtered.filter((job) => job.remote);
  }

  if (params.type && params.type !== "all") {
    filtered = filtered.filter((job) => job.type === params.type);
  }

  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    filtered = filtered.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.skills.some((skill) => skill.toLowerCase().includes(q)) ||
        job.description.toLowerCase().includes(q)
    );
  }

  return filtered;
}

function staticFallback(
  params: JobSearchParams,
  query: string,
  location: string
): JobSearchResult {
  const jobs = filterJobs([...JOB_LISTINGS], params);

  return {
    jobs,
    total: jobs.length,
    page: 1,
    source: "static",
    query,
    location,
  };
}

export async function searchJobs(
  profile: Profile | null,
  settings: Settings | null,
  params: JobSearchParams = {}
): Promise<JobSearchResult> {
  const page = Math.max(1, params.page || 1);
  const { q, location, salaryMin } = buildSearchQuery(profile, settings, params);

  if (!isAdzunaConfigured()) {
    return staticFallback(params, q, location);
  }

  const country = defaultAdzunaCountry();
  const cacheKey = `${country}:${q}:${location}:${page}:${params.type || "all"}:${params.remote ? "remote" : "any"}:${salaryMin || 0}`;
  const cached = getCached<JobSearchResult>(cacheKey);
  if (cached) return cached;

  try {
    const response = await searchAdzunaJobs({
      country,
      page,
      what: q,
      where: location || undefined,
      resultsPerPage: 20,
      fullTime: params.type === "Full-time",
      salaryMin,
    });

    let jobs = response.results.map((job) => adzunaJobToListing(job, country));
    jobs = filterJobs(jobs, params);

    const result: JobSearchResult = {
      jobs,
      total: response.count,
      page,
      source: "adzuna",
      query: q,
      location,
    };

    setCached(cacheKey, result, cacheTtlMs());
    return result;
  } catch {
    return staticFallback(params, q, location);
  }
}
