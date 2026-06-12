import type {
  ContactSuggestion,
  JobPreferences,
  Profile,
  Settings,
  TrackedJob,
  UserDataBundle,
} from "./types";

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

  async getContacts() {
    const data = await request<{ contacts: ContactSuggestion[] }>("/api/contacts");
    return data.contacts;
  },

  async saveContacts(contacts: Omit<ContactSuggestion, "id">[]) {
    const data = await request<{ contacts: ContactSuggestion[] }>("/api/contacts", {
      method: "POST",
      body: JSON.stringify({ contacts }),
    });
    return data.contacts;
  },

  async deleteContact(id: string) {
    return request<{ success: boolean }>(`/api/contacts/${id}`, {
      method: "DELETE",
    });
  },
};
