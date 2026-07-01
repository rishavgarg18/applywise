"use client";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { useJobSearch } from "@/hooks/use-job-search";
import { useProfile } from "@/hooks/use-profile";
import { buildSearchQuery } from "@/lib/jobs/search";
import { profileHasMatchableData, sortJobsByMatch } from "@/lib/match-score";
import { Storage } from "@/lib/storage";
import type { JobListing, TrackedJob } from "@/lib/types";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function MatchesPage() {
  const { profile, settings, loaded } = useProfile();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [defaultsSet, setDefaultsSet] = useState(false);

  const { data, loading, error, hasSearched, search } = useJobSearch();

  useEffect(() => {
    if (!loaded || defaultsSet) return;
    const defaults = buildSearchQuery(profile, settings);
    setQuery(defaults.q);
    setLocation(defaults.location);
    setDefaultsSet(true);
  }, [loaded, profile, settings, defaultsSet]);

  const jobs = useMemo(() => {
    if (!data?.jobs) return [];
    return sortJobsByMatch(data.jobs, profile, { settings });
  }, [data?.jobs, profile, settings]);

  const runSearch = (nextPage = 1) => {
    setPage(nextPage);
    search({
      q: query,
      location: location || undefined,
      page: nextPage,
      remote: remoteOnly,
      type: typeFilter,
    });
  };

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
    hasSearched && data?.query
      ? data.location
        ? `Results for "${data.query}" in ${data.location}`
        : `Results for "${data.query}"`
      : null;

  return (
    <>
      <PageHeader
        title="Smart Opportunities"
        description={
          hasProfile
            ? "Search live roles — ranked by fit with your profile after you search"
            : "Complete your profile for better match scores"
        }
      />

      <div className="flex flex-col gap-3 mb-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="e.g. software developer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch(1);
              }}
              className="pl-10"
            />
          </div>
          <Input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch(1);
            }}
            className="sm:w-48"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="rounded accent-accent"
            />
            Remote only
          </label>
          <Button onClick={() => runSearch(1)} disabled={loading || !query.trim()}>
            Search
          </Button>
        </div>

        {loading && (
          <div className="h-1 w-full rounded-full bg-surface2 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-accent animate-[jobSearchBar_1.2s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      {searchHint && (
        <p className="text-xs text-muted mb-4">{searchHint}</p>
      )}

      {!hasSearched ? (
        <div className="text-center py-16 text-muted">
          <p className="font-medium text-foreground mb-1">Ready to search</p>
          <p className="text-sm">
            Enter a role and click Search. Results are ranked against your profile
            — no API call until you search.
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-muted">
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-sm text-muted">
          Finding roles that match your profile...
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
                Try a broader role term or update target roles in Settings.
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

          {data && data.source === "adzuna" && jobs.length > 0 && (
            <div className="flex justify-center mt-8 gap-3">
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => runSearch(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted px-2">
                Page {page}
              </span>
              <Button
                variant="outline"
                disabled={loading || jobs.length < 20}
                onClick={() => runSearch(page + 1)}
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
