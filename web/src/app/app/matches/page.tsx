"use client";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { useJobSearch } from "@/hooks/use-job-search";
import { useProfile } from "@/hooks/use-profile";
import { profileHasMatchableData, sortJobsByMatch } from "@/lib/match-score";
import { Storage } from "@/lib/storage";
import type { JobListing, TrackedJob } from "@/lib/types";
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function MatchesPage() {
  const { profile, settings, loaded } = useProfile();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useJobSearch(
    {
      q: query || undefined,
      page,
      remote: remoteOnly,
      type: typeFilter,
    },
    loaded
  );

  const jobs = useMemo(() => {
    if (!data?.jobs) return [];
    return sortJobsByMatch(data.jobs, profile, { settings });
  }, [data?.jobs, profile, settings]);

  const trackJob = async (job: JobListing, matchScore: number) => {
    const tracked: TrackedJob = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      url: job.url,
      description: job.description,
      status: "saved",
      matchScore,
      savedAt: new Date().toISOString(),
    };
    await Storage.addTrackedJob(tracked);
  };

  if (!loaded) return <PageSkeleton />;

  const hasProfile = profileHasMatchableData(profile);
  const searchHint =
    data?.query && data?.location
      ? `Searching "${data.query}" in ${data.location}`
      : data?.query
        ? `Searching "${data.query}"`
        : null;

  return (
    <>
      <PageHeader
        title="Smart Opportunities"
        description={
          hasProfile
            ? "Live roles ranked by fit with your skills and preferences"
            : "Complete your profile for better matches"
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search by title, company, or skill..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="sm:w-44"
        >
          <option value="all">All types</option>
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
          <option value="New Grad">New Grad</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted px-3">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => {
              setRemoteOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded accent-accent"
          />
          Remote only
        </label>
      </div>

      {searchHint && (
        <p className="text-xs text-muted mb-2">{searchHint}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Finding roles that match your profile...
        </div>
      ) : error ? (
        <div className="text-center py-16 text-muted">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-4">
            {jobs.length} matched opportunit{jobs.length === 1 ? "y" : "ies"}
            {data?.source === "adzuna" ? " · via Adzuna" : ""}
          </p>

          {jobs.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <p className="font-medium text-foreground mb-1">No strong matches yet</p>
              <p className="text-sm">
                Try broadening your search or update target roles in Settings.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  matchScore={job.matchScore}
                  onTrack={(j) => trackJob(j, job.matchScore)}
                />
              ))}
            </div>
          )}

          {data && data.source === "adzuna" && data.total > jobs.length && (
            <div className="flex justify-center mt-8 gap-3">
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted px-2">
                Page {page}
              </span>
              <Button
                variant="outline"
                disabled={loading || jobs.length < 20}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
