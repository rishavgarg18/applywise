import type { Experience, Profile } from "../types";
import { scoreExtraction } from "./quality";

function expKey(e: Experience): string {
  const company = (e.company || "").toLowerCase().trim();
  const role = (e.role || "").toLowerCase().trim();
  const from = (e.from || "").toLowerCase().trim();
  return `${company}|${role}|${from}`;
}

function dedupeExperiences(experiences: Experience[]): Experience[] {
  const seen = new Map<string, Experience>();
  for (const exp of experiences) {
    const key = expKey(exp);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, exp);
      continue;
    }
    const existingDesc = existing.description?.length ?? 0;
    const newDesc = exp.description?.length ?? 0;
    if (newDesc > existingDesc) seen.set(key, exp);
  }
  return Array.from(seen.values());
}

export function mergePassResults(
  ...parts: Partial<Profile>[]
): Partial<Profile> {
  const merged: Partial<Profile> = {};

  for (const part of parts) {
    if (!part) continue;
    for (const [key, val] of Object.entries(part)) {
      if (val == null || val === "") continue;
      if (Array.isArray(val)) {
        const hasData = val.some(
          (item) =>
            item &&
            typeof item === "object" &&
            Object.values(item).some((v) => v != null && v !== "")
        );
        if (!hasData) continue;
        const existing = (merged as Record<string, unknown>)[key] as unknown[] | undefined;
        if (existing && Array.isArray(existing)) {
          (merged as Record<string, unknown>)[key] = [...existing, ...val];
        } else {
          (merged as Record<string, unknown>)[key] = val;
        }
      } else {
        (merged as Record<string, unknown>)[key] = val;
      }
    }
  }

  if (merged.experiences?.length) {
    merged.experiences = dedupeExperiences(merged.experiences);
  }

  return merged;
}

/** Pick the better profile per section when ensemble retrying. */
export function ensembleMerge(
  primary: Partial<Profile>,
  secondary: Partial<Profile>
): Partial<Profile> {
  const primaryScore = scoreExtraction(primary);
  const secondaryScore = scoreExtraction(secondary);

  const base = primaryScore >= secondaryScore ? { ...primary } : { ...secondary };
  const other = primaryScore >= secondaryScore ? secondary : primary;

  const arrayKeys: (keyof Profile)[] = [
    "experiences",
    "education",
    "projects",
    "certifications",
    "achievements",
  ];

  for (const key of arrayKeys) {
    const baseArr = (base[key] as unknown[] | undefined) || [];
    const otherArr = (other[key] as unknown[] | undefined) || [];
    if (otherArr.length > baseArr.length) {
      (base as Record<string, unknown>)[key] = mergePassResults(
        { [key]: baseArr } as Partial<Profile>,
        { [key]: otherArr } as Partial<Profile>
      )[key];
    }
  }

  for (const [key, val] of Object.entries(other)) {
    if (val == null || val === "") continue;
    const current = (base as Record<string, unknown>)[key];
    if (current == null || current === "") {
      (base as Record<string, unknown>)[key] = val;
    }
  }

  return base;
}

export function contactFieldsOnly(
  local: Partial<Profile> | null
): Partial<Profile> | null {
  if (!local) return null;
  const keys: (keyof Profile)[] = [
    "email",
    "phone",
    "linkedin",
    "github",
    "portfolio",
  ];
  const out: Partial<Profile> = {};
  for (const key of keys) {
    const val = local[key];
    if (val) (out as Record<string, unknown>)[key] = val;
  }
  return out;
}

export function mergeWithContactFields(
  profile: Partial<Profile>,
  local: Partial<Profile> | null
): Partial<Profile> {
  const contact = contactFieldsOnly(local);
  if (!contact) return profile;
  return { ...profile, ...contact };
}
