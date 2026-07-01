"use client";

import { Badge, MatchScore } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Storage } from "@/lib/storage";
import type { JobListing } from "@/lib/types";
import { Bookmark, ExternalLink, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export function JobCard({
  job,
  matchScore,
  onTrack,
}: {
  job: JobListing;
  matchScore: number;
  onTrack?: (job: JobListing) => void | Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    Storage.getSavedMatches().then((matches) => setSaved(matches.includes(job.id)));
  }, [job.id]);

  const toggleSave = async () => {
    setSaving(true);
    try {
      const next = await Storage.toggleSavedMatch(job.id);
      setSaved(next.includes(job.id));
    } finally {
      setSaving(false);
    }
  };

  const handleTrack = async () => {
    if (!onTrack) return;
    setTracking(true);
    try {
      await onTrack(job);
    } finally {
      setTracking(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-dim text-sm font-bold text-violet">
            {job.logo}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{job.title}</h3>
            <p className="text-sm text-muted">{job.company}</p>
          </div>
        </div>
        <button
          onClick={toggleSave}
          disabled={saving}
          className="rounded-md p-2 text-muted hover:bg-surface2 hover:text-accent transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        <span>·</span>
        <span>{job.salary}</span>
        <span>·</span>
        <span>{job.postedAt}</span>
      </div>

      <p className="text-sm text-muted line-clamp-2">{job.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} variant="default">
            {skill}
          </Badge>
        ))}
        {job.remote && <Badge variant="violet">Remote</Badge>}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-0.5">
          <MatchScore score={matchScore} />
          {job.source === "adzuna" && (
            <span className="text-[10px] text-muted">via Adzuna</span>
          )}
        </div>
        <div className="flex gap-2">
          {onTrack && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTrack}
              disabled={tracking}
            >
              {tracking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {tracking ? "Adding..." : "Add to pipeline"}
            </Button>
          )}
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
