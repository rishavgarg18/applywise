"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { ApiClient } from "@/lib/api-client";
import type { Profile, Settings, TrackedJob, UserDataBundle } from "@/lib/types";

type UserDataContextValue = {
  profile: Profile | null;
  settings: Settings | null;
  trackedJobs: TrackedJob[];
  onboardingDone: boolean;
  loaded: boolean;
  setProfile: (profile: Profile) => Promise<void>;
  setSettings: (settings: Settings) => Promise<void>;
  completeOnboarding: (profile: Profile) => Promise<void>;
  refresh: () => Promise<void>;
  session: ReturnType<typeof useSession>["data"];
};

const UserDataContext = createContext<UserDataContextValue | null>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [bundle, setBundle] = useState<UserDataBundle | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const data = await ApiClient.getUserData();
    setBundle(data);
    return data;
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setBundle(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    load()
      .then(() => {
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email, load]);

  const applyBundle = useCallback((data: UserDataBundle) => {
    setBundle(data);
  }, []);

  const setProfile = useCallback(async (profile: Profile) => {
    setBundle((prev) => (prev ? { ...prev, profile } : prev));
    const data = await ApiClient.patchUserData({ profile });
    applyBundle(data);
  }, [applyBundle]);

  const setSettings = useCallback(async (settings: Settings) => {
    setBundle((prev) => (prev ? { ...prev, settings } : prev));
    const data = await ApiClient.patchUserData({ settings });
    applyBundle(data);
  }, [applyBundle]);

  const completeOnboarding = useCallback(async (profile: Profile) => {
    setBundle((prev) =>
      prev ? { ...prev, profile, onboardingDone: true } : prev
    );
    const data = await ApiClient.patchUserData({
      profile,
      onboardingDone: true,
    });
    applyBundle(data);
  }, [applyBundle]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const value = useMemo<UserDataContextValue>(
    () => ({
      profile: bundle?.profile ?? null,
      settings: bundle?.settings ?? null,
      trackedJobs: bundle?.trackedJobs ?? [],
      onboardingDone: bundle?.onboardingDone ?? false,
      loaded,
      setProfile,
      setSettings,
      completeOnboarding,
      refresh,
      session,
    }),
    [
      bundle,
      loaded,
      setProfile,
      setSettings,
      completeOnboarding,
      refresh,
      session,
    ]
  );

  return (
    <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider");
  }
  return context;
}
