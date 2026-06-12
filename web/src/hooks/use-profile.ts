"use client";

import { useUserData } from "@/components/providers/user-data-provider";

export function useProfile() {
  return useUserData();
}
