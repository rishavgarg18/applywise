"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { useProfile } from "@/hooks/use-profile";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { sortJobsByMatch } from "@/lib/match-score";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  PenTool,
  Search,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function DashboardPage() {
  const { profile, onboardingDone, trackedJobs, loaded } = useProfile();

  const stats = useMemo(
    () => ({
      saved: trackedJobs.filter((j) => j.status === "saved").length,
      applied: trackedJobs.filter((j) => j.status === "applied").length,
      interview: trackedJobs.filter((j) => j.status === "interview").length,
    }),
    [trackedJobs]
  );

  if (!loaded) return <PageSkeleton />;

  const topMatches = sortJobsByMatch(JOB_LISTINGS, profile).slice(0, 3);
  const name = profile?.fullName?.split(" ")[0] || "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description={
          onboardingDone
            ? "Here's your job search at a glance"
            : "Complete your profile to unlock personalized matches"
        }
        action={
          !onboardingDone ? (
            <Link href="/onboarding">
              <Button>Complete Profile</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: "Saved", value: stats.saved, color: "text-violet" },
          { label: "Applied", value: stats.applied, color: "text-accent" },
          { label: "Interviews", value: stats.interview, color: "text-success" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-6">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-muted mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { href: "/app/matches", icon: Search, label: "Opportunities", desc: "Browse matched roles" },
          { href: "/app/resume", icon: PenTool, label: "Resume Tailor", desc: "Tailor for a role" },
          { href: "/app/ats", icon: BarChart3, label: "ATS Score", desc: "Check resume fit" },
          { href: "/app/copilot", icon: Zap, label: "Extension", desc: "Autofill applications" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-border cursor-pointer h-full transition-colors">
              <item.icon className="h-5 w-5 text-accent mb-3" />
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Top Matches For You</h2>
        <Link href="/app/matches">
          <Button variant="ghost" size="sm">
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {topMatches.map((job) => (
          <Card key={job.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-violet-dim flex items-center justify-center text-violet font-bold text-sm shrink-0">
                {job.logo}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{job.title}</p>
                <p className="text-sm text-muted truncate">
                  {job.company} · {job.location}
                </p>
              </div>
            </div>
            <Badge variant="accent">{job.matchScore}% match</Badge>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-violet-dim/30 border-violet/20">
        <div className="flex items-center gap-3">
          <Bookmark className="h-5 w-5 text-violet" />
          <div className="flex-1">
            <p className="font-medium">Track your applications</p>
            <p className="text-sm text-muted">
              Add jobs to your pipeline board to stay organized
            </p>
          </div>
          <Link href="/app/tracker">
            <Button variant="secondary" size="sm">
              Open Pipeline
            </Button>
          </Link>
        </div>
      </Card>
    </>
  );
}
