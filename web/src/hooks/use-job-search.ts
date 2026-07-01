"use client";

import { useCallback, useState } from "react";
import type { JobListing } from "@/lib/types";

export type JobSearchResponse = {
  jobs: JobListing[];
  total: number;
  page: number;
  source: "adzuna" | "static";
  query: string;
  location: string;
};

export type JobSearchFilters = {
  q?: string;
  location?: string;
  page?: number;
  remote?: boolean;
  type?: string;
};

export function useJobSearch() {
  const [data, setData] = useState<JobSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (filters: JobSearchFilters) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.q?.trim()) params.set("q", filters.q.trim());
    if (filters.location?.trim()) params.set("location", filters.location.trim());
    if (filters.page) params.set("page", String(filters.page));
    if (filters.remote) params.set("remote", "true");
    if (filters.type && filters.type !== "all") params.set("type", filters.type);

    try {
      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load jobs");
      }
      setData(await res.json());
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
      setData(null);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, hasSearched, search };
}
