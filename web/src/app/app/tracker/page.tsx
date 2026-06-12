"use client";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { Storage } from "@/lib/storage";
import type { ApplicationStatus, TrackedJob } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";

const COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "saved", label: "Saved", color: "border-violet/30" },
  { status: "applied", label: "Applied", color: "border-accent/30" },
  { status: "interview", label: "Interview", color: "border-warning/30" },
  { status: "offer", label: "Offer", color: "border-success/30" },
  { status: "rejected", label: "Rejected", color: "border-danger/30" },
];

export default function TrackerPage() {
  const { trackedJobs: contextJobs, loaded, refresh } = useProfile();
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [syncing, setSyncing] = useState(true);

  const syncJobs = useCallback(async () => {
    setSyncing(true);
    const data = await Storage.getTrackedJobs();
    setJobs(data);
    setSyncing(false);
  }, []);

  useEffect(() => {
    if (loaded) {
      setJobs(contextJobs);
      setSyncing(false);
    }
  }, [loaded, contextJobs]);

  const moveJob = async (id: string, status: ApplicationStatus) => {
    await Storage.updateTrackedJob(id, {
      status,
      ...(status === "applied" ? { appliedAt: new Date().toISOString() } : {}),
    });
    await refresh();
    await syncJobs();
  };

  const removeJob = async (id: string) => {
    await Storage.removeTrackedJob(id);
    await refresh();
    await syncJobs();
  };

  if (!loaded || syncing) {
    return (
      <>
        <PageHeader
          title="Pipeline Board"
          description="Track every application from saved to offer"
        />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.status} className="min-w-[260px] flex-1 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pipeline Board"
        description="Track every application from saved to offer"
      />

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.status);
          return (
            <div
              key={col.status}
              className="min-w-[260px] flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-medium text-sm">{col.label}</h3>
                <Badge variant="default">{colJobs.length}</Badge>
              </div>
              <div className="space-y-3 flex-1">
                {colJobs.map((job) => (
                  <Card
                    key={job.id}
                    className={`p-4 border-t-2 ${col.color}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-muted">{job.company}</p>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-muted hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => removeJob(job.id)}
                          className="p-1 text-muted hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Badge variant="accent" className="mt-2">
                      {job.matchScore}% match
                    </Badge>
                    <select
                      value={job.status}
                      onChange={(e) =>
                        moveJob(job.id, e.target.value as ApplicationStatus)
                      }
                      className="mt-3 w-full rounded-md border border-border bg-surface2 px-2 py-1.5 text-xs"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Card>
                ))}
                {colJobs.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
                    No jobs here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
