"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ApiClient } from "@/lib/api-client";
import type { Profile, Settings } from "@/lib/types";

export function useProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (status === "loading") return;
    if (!isAuthenticated) {
      setProfileState(null);
      setSettingsState(null);
      setOnboardingDone(false);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    ApiClient.getUserData()
      .then((data) => {
        if (cancelled) return;
        setProfileState(data.profile);
        setSettingsState(data.settings);
        setOnboardingDone(data.onboardingDone);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, status, session?.user?.email]);

  const setProfile = useCallback(async (p: Profile) => {
    setProfileState(p);
    await ApiClient.patchUserData({ profile: p });
  }, []);

  const setSettings = useCallback(async (s: Settings) => {
    setSettingsState(s);
    await ApiClient.patchUserData({ settings: s });
  }, []);

  const completeOnboarding = useCallback(async (p: Profile) => {
    setProfileState(p);
    setOnboardingDone(true);
    await ApiClient.patchUserData({ profile: p, onboardingDone: true });
  }, []);

  const refresh = useCallback(async () => {
    const data = await ApiClient.getUserData();
    setProfileState(data.profile);
    setOnboardingDone(data.onboardingDone);
  }, []);

  return {
    profile,
    settings,
    onboardingDone,
    loaded,
    session,
    setProfile,
    setSettings,
    completeOnboarding,
    refresh,
  };
}
