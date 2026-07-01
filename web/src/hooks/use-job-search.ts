"use client";

import { useCallback, useEffect, useState } from "react";
import type { JobListing } from "@/lib/types";

export type JobSearchResponse = {
  jobs: JobListing[];
  total: number;
  page: number;
  source: "adzuna" | "static";
  query: string;
  location: string;
};

type JobSearchFilters = {
  q?: string;
  location?: string;
  page?: number;
  remote?: boolean;
  type?: string;
};

export function useJobSearch(filters: JobSearchFilters, enabled = true) {
  const [data, setData] = useState<JobSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.location) params.set("location", filters.location);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, filters.q, filters.location, filters.page, filters.remote, filters.type]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { data, loading, error, refresh: fetchJobs };
}
