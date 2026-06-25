import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
} from "@/lib/defaults";
import { getUsageSnapshot } from "@/lib/credits";
import type {
  JobPreferences,
  Profile,
  Settings,
  TrackedJob,
  UserDataBundle,
} from "@/lib/types";

export type { UserDataBundle };

function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  return value as T;
}

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function defaultBundle(): Omit<UserDataBundle, "usage"> {
  return {
    profile: null,
    settings: { ...DEFAULT_SETTINGS },
    preferences: { ...DEFAULT_PREFERENCES },
    trackedJobs: [],
    savedMatches: [],
    resumeFilename: null,
    resumePdfBase64: null,
    onboardingDone: false,
  };
}

async function ensureUserData(userId: string) {
  return prisma.userData.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getUserDataBundle(
  userId: string,
  options?: { includeResume?: boolean }
): Promise<UserDataBundle> {
  const [row, usage] = await Promise.all([
    prisma.userData.findUnique({ where: { userId } }),
    getUsageSnapshot(userId),
  ]);
  if (!row) return { ...defaultBundle(), usage };

  return {
    profile: row.profile
      ? { ...DEFAULT_PROFILE, ...asJson<Partial<Profile>>(row.profile, {}) }
      : null,
    settings: {
      ...DEFAULT_SETTINGS,
      ...asJson<Partial<Settings>>(row.settings, {}),
    },
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...asJson<Partial<JobPreferences>>(row.preferences, {}),
    },
    trackedJobs: asJson<TrackedJob[]>(row.trackedJobs, []),
    savedMatches: asJson<string[]>(row.savedMatches, []),
    resumeFilename: row.resumeFilename,
    resumePdfBase64: options?.includeResume ? row.resumePdfBase64 : null,
    onboardingDone: row.onboardingDone,
    usage,
  };
}

export async function getUserResume(userId: string) {
  const row = await prisma.userData.findUnique({
    where: { userId },
    select: { resumeFilename: true, resumePdfBase64: true },
  });

  return {
    resumeFilename: row?.resumeFilename ?? null,
    resumePdfBase64: row?.resumePdfBase64 ?? null,
  };
}

export async function updateUserData(
  userId: string,
  updates: Partial<{
    profile: Profile;
    settings: Settings;
    preferences: JobPreferences;
    trackedJobs: TrackedJob[];
    savedMatches: string[];
    resumeFilename: string;
    resumePdfBase64: string;
    onboardingDone: boolean;
  }>
) {
  await ensureUserData(userId);
  return prisma.userData.update({
    where: { userId },
    data: {
      ...(updates.profile !== undefined
        ? { profile: toJsonValue(updates.profile) }
        : {}),
      ...(updates.settings !== undefined
        ? { settings: toJsonValue(updates.settings) }
        : {}),
      ...(updates.preferences !== undefined
        ? { preferences: toJsonValue(updates.preferences) }
        : {}),
      ...(updates.trackedJobs !== undefined
        ? { trackedJobs: toJsonValue(updates.trackedJobs) }
        : {}),
      ...(updates.savedMatches !== undefined
        ? { savedMatches: toJsonValue(updates.savedMatches) }
        : {}),
      ...(updates.resumeFilename !== undefined
        ? { resumeFilename: updates.resumeFilename }
        : {}),
      ...(updates.resumePdfBase64 !== undefined
        ? { resumePdfBase64: updates.resumePdfBase64 }
        : {}),
      ...(updates.onboardingDone !== undefined
        ? { onboardingDone: updates.onboardingDone }
        : {}),
    },
  });
}

export async function addTrackedJob(userId: string, job: TrackedJob) {
  const bundle = await getUserDataBundle(userId);
  if (bundle.trackedJobs.some((j) => j.id === job.id)) return bundle.trackedJobs;
  const trackedJobs = [job, ...bundle.trackedJobs];
  await updateUserData(userId, { trackedJobs });
  return trackedJobs;
}

export async function updateTrackedJob(
  userId: string,
  id: string,
  patch: Partial<TrackedJob>
) {
  const bundle = await getUserDataBundle(userId);
  const trackedJobs = bundle.trackedJobs.map((j) =>
    j.id === id ? { ...j, ...patch } : j
  );
  await updateUserData(userId, { trackedJobs });
  return trackedJobs;
}

export async function removeTrackedJob(userId: string, id: string) {
  const bundle = await getUserDataBundle(userId);
  const trackedJobs = bundle.trackedJobs.filter((j) => j.id !== id);
  await updateUserData(userId, { trackedJobs });
  return trackedJobs;
}

export async function toggleSavedMatch(userId: string, jobId: string) {
  const bundle = await getUserDataBundle(userId);
  const savedMatches = bundle.savedMatches.includes(jobId)
    ? bundle.savedMatches.filter((id) => id !== jobId)
    : [...bundle.savedMatches, jobId];
  await updateUserData(userId, { savedMatches });
  return savedMatches;
}

export async function clearUserData(userId: string) {
  await ensureUserData(userId);
  await prisma.userData.update({
    where: { userId },
    data: {
      profile: Prisma.JsonNull,
      settings: toJsonValue(DEFAULT_SETTINGS),
      preferences: toJsonValue(DEFAULT_PREFERENCES),
      trackedJobs: toJsonValue([]),
      savedMatches: toJsonValue([]),
      resumeFilename: null,
      resumePdfBase64: null,
      onboardingDone: false,
    },
  });
}
