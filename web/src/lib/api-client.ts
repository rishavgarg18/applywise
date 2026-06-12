import type {
  JobPreferences,
  Profile,
  Settings,
  TrackedJob,
} from "./types";
import type { UserDataBundle } from "./types";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const ApiClient = {
  async getUserData(): Promise<UserDataBundle> {
    return request<UserDataBundle>("/api/user");
  },

  async getResume(): Promise<{
    resumeFilename: string | null;
    resumePdfBase64: string | null;
  }> {
    return request("/api/user/resume");
  },

  async patchUserData(
    updates: Partial<{
      profile: Profile;
      settings: Settings;
      preferences: JobPreferences;
      trackedJobs: TrackedJob[];
      savedMatches: string[];
      resumeFilename: string;
      resumePdfBase64: string;
      onboardingDone: boolean;
      addTrackedJob: TrackedJob;
      updateTrackedJob: { id: string; updates: Partial<TrackedJob> };
      removeTrackedJob: string;
      toggleSavedMatch: string;
    }>
  ) {
    return request<UserDataBundle>("/api/user", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async clearUserData() {
    return request<{ success: boolean }>("/api/user", { method: "DELETE" });
  },
};
