"use client";

import { ApiClient } from "./api-client";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from "./defaults";
import type { Profile, Settings, TrackedJob, JobPreferences } from "./types";

export { DEFAULT_PROFILE, DEFAULT_SETTINGS } from "./defaults";

export const Storage = {
  async getProfile(): Promise<Profile | null> {
    const data = await ApiClient.getUserData();
    return data.profile;
  },

  async setProfile(profile: Profile) {
    await ApiClient.patchUserData({ profile });
  },

  async getSettings(): Promise<Settings> {
    const data = await ApiClient.getUserData();
    return data.settings;
  },

  async setSettings(settings: Settings) {
    await ApiClient.patchUserData({ settings });
  },

  async isOnboardingDone(): Promise<boolean> {
    const data = await ApiClient.getUserData();
    return data.onboardingDone;
  },

  async setOnboardingDone(done: boolean) {
    await ApiClient.patchUserData({ onboardingDone: done });
  },

  async getResumeFilename(): Promise<string | null> {
    const data = await ApiClient.getResume();
    return data.resumeFilename;
  },

  async setResumeFilename(name: string) {
    await ApiClient.patchUserData({ resumeFilename: name });
  },

  async getResumePdfBase64(): Promise<string | null> {
    const data = await ApiClient.getResume();
    return data.resumePdfBase64;
  },

  async getResume() {
    return ApiClient.getResume();
  },

  async setResumePdfBase64(base64: string) {
    await ApiClient.patchUserData({ resumePdfBase64: base64 });
  },

  async getTrackedJobs(): Promise<TrackedJob[]> {
    const data = await ApiClient.getUserData();
    return data.trackedJobs;
  },

  async setTrackedJobs(jobs: TrackedJob[]) {
    await ApiClient.patchUserData({ trackedJobs: jobs });
  },

  async addTrackedJob(job: TrackedJob) {
    await ApiClient.patchUserData({ addTrackedJob: job });
  },

  async updateTrackedJob(id: string, updates: Partial<TrackedJob>) {
    await ApiClient.patchUserData({ updateTrackedJob: { id, updates } });
  },

  async removeTrackedJob(id: string) {
    await ApiClient.patchUserData({ removeTrackedJob: id });
  },

  async getPreferences(): Promise<JobPreferences> {
    const data = await ApiClient.getUserData();
    return data.preferences;
  },

  async setPreferences(prefs: JobPreferences) {
    await ApiClient.patchUserData({ preferences: prefs });
  },

  async getSavedMatches(): Promise<string[]> {
    const data = await ApiClient.getUserData();
    return data.savedMatches;
  },

  async toggleSavedMatch(jobId: string) {
    const data = await ApiClient.patchUserData({ toggleSavedMatch: jobId });
    return data.savedMatches;
  },

  async clearAll() {
    await ApiClient.clearUserData();
  },
};
