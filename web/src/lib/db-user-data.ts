import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
} from "@/lib/defaults";
import type {
  JobPreferences,
  Profile,
  Settings,
  TrackedJob,
  UserDataBundle,
} from "@/lib/types";

export type { UserDataBundle };

async function ensureUserData(userId: string) {
  return prisma.userData.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getUserDataBundle(userId: string): Promise<UserDataBundle> {
  const row = await ensureUserData(userId);

  return {
    profile: row.profile
      ? ({ ...DEFAULT_PROFILE, ...(row.profile as object) } as Profile)
      : null,
    settings: {
      ...DEFAULT_SETTINGS,
      ...((row.settings as Partial<Settings> | null) ?? {}),
    },
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...((row.preferences as Partial<JobPreferences> | null) ?? {}),
    },
    trackedJobs: (row.trackedJobs as TrackedJob[]) ?? [],
    savedMatches: (row.savedMatches as string[]) ?? [],
    resumeFilename: row.resumeFilename,
    resumePdfBase64: row.resumePdfBase64,
    onboardingDone: row.onboardingDone,
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
      ...(updates.profile !== undefined ? { profile: updates.profile } : {}),
      ...(updates.settings !== undefined ? { settings: updates.settings } : {}),
      ...(updates.preferences !== undefined
        ? { preferences: updates.preferences }
        : {}),
      ...(updates.trackedJobs !== undefined
        ? { trackedJobs: updates.trackedJobs }
        : {}),
      ...(updates.savedMatches !== undefined
        ? { savedMatches: updates.savedMatches }
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
      profile: null,
      settings: DEFAULT_SETTINGS,
      preferences: DEFAULT_PREFERENCES,
      trackedJobs: [],
      savedMatches: [],
      resumeFilename: null,
      resumePdfBase64: null,
      onboardingDone: false,
    },
  });
}
