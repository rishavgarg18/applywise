"use client";

import { cn } from "@/lib/cn";
import {
  Bookmark,
  PenTool,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";

const tabs = [
  {
    id: "matches",
    label: "Job Matches",
    icon: Search,
    title: "Get matched to relevant jobs, personalized to you",
    description:
      "Set your target role and preferences. Search live listings, ranked by fit with your skills and experience.",
    preview: (
      <div className="space-y-3 p-4">
        {[
          { title: "Software Developer", company: "Razorpay", match: 92, loc: "Bangalore" },
          { title: "Full Stack Engineer", company: "Swiggy", match: 87, loc: "Gurgaon" },
          { title: "Backend Developer", company: "Flipkart", match: 84, loc: "Bengaluru" },
        ].map((job) => (
          <div
            key={job.title}
            className="flex items-center justify-between rounded-xl border border-border bg-surface2/50 p-3"
          >
            <div>
              <p className="font-medium text-sm">{job.title}</p>
              <p className="text-xs text-muted">
                {job.company} · {job.loc}
              </p>
            </div>
            <span className="rounded-full bg-accent-dim px-2.5 py-1 text-xs font-semibold text-accent">
              {job.match}%
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "copilot",
    label: "Copilot Extension",
    icon: Zap,
    title: "Autofill repetitive application questions",
    description:
      "Install the Applywise extension to autofill job applications on LinkedIn, Naukri, Indeed, and 50+ boards.",
    preview: (
      <div className="p-4 space-y-2">
        <div className="rounded-lg border border-accent/30 bg-accent-dim/30 p-3 text-sm">
          ⚡ Autofill This Page
        </div>
        {["Full Name", "Email", "Phone", "Current Company"].map((field) => (
          <div key={field} className="rounded-lg border border-border bg-surface2/40 px-3 py-2">
            <p className="text-[10px] text-muted">{field}</p>
            <p className="text-sm text-accent">✓ Filled from profile</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "resume",
    label: "Resume Builder",
    icon: PenTool,
    title: "Tailor your resume for every job",
    description:
      "Use AI to tailor sections, check ATS fit, and spot missing keywords — in a few clicks.",
    preview: (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/50 p-3">
          <span className="text-sm font-medium">ATS Score</span>
          <span className="text-2xl font-bold text-success">78</span>
        </div>
        <div className="rounded-xl border border-border bg-surface2/50 p-3 text-xs text-muted space-y-1">
          <p className="text-foreground font-medium text-sm mb-2">Missing keywords</p>
          <p>+ React · + TypeScript · + system design</p>
        </div>
      </div>
    ),
  },
  {
    id: "tracker",
    label: "Job Tracker",
    icon: Bookmark,
    title: "Bookmark jobs and track your search",
    description:
      "Goodbye spreadsheets. Save roles, move them through your pipeline, and stay organized from saved to offer.",
    preview: (
      <div className="grid grid-cols-3 gap-2 p-4 text-center text-xs">
        {[
          { col: "Saved", count: 4, color: "text-violet" },
          { col: "Applied", count: 12, color: "text-accent" },
          { col: "Interview", count: 2, color: "text-success" },
        ].map((c) => (
          <div key={c.col} className="rounded-xl border border-border bg-surface2/40 p-3">
            <p className={`text-xl font-bold ${c.color}`}>{c.count}</p>
            <p className="text-muted mt-1">{c.col}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export function ProductShowcase() {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) || tabs[0];

  return (
    <section className="py-20 border-y border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            We&apos;re here for{" "}
            <span className="gradient-text">every step</span> of your search
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active === tab.id
                  ? "bg-accent text-[#0a0f1a]"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h3 className="text-2xl font-semibold mb-4">{current.title}</h3>
            <p className="text-muted leading-relaxed">{current.description}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface shadow-2xl shadow-accent/5 overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-surface2/50">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
              <span className="ml-2 text-xs text-muted">Applywise</span>
            </div>
            {current.preview}
          </div>
        </div>
      </div>
    </section>
  );
}
