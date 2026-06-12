"use client";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { sortJobsByMatch } from "@/lib/match-score";
import { Storage } from "@/lib/storage";
import type { JobListing, TrackedJob } from "@/lib/types";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function MatchesPage() {
  const { profile, loaded } = useProfile();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const jobs = useMemo(() => {
    let filtered = sortJobsByMatch(JOB_LISTINGS, profile);
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((j) => j.type === typeFilter);
    }
    if (remoteOnly) {
      filtered = filtered.filter((j) => j.remote);
    }
    return filtered;
  }, [profile, query, typeFilter, remoteOnly]);

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

  return (
    <>
      <PageHeader
        title="Smart Opportunities"
        description="Roles matched to your profile and preferences"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            placeholder="Search by title, company, or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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
      </div>

      <p className="text-sm text-muted mb-4">{jobs.length} opportunities found</p>

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
    </>
  );
}
