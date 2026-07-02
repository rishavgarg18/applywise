import { Card } from "@/components/ui/card";
import {
  BarChart3,
  Bookmark,
  FileText,
  Mail,
  PenTool,
  Search,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Opportunities",
    description:
      "Search live job listings ranked by fit with your profile. No endless scrolling through irrelevant roles.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
  {
    icon: Zap,
    title: "Copilot Extension",
    description:
      "One-click autofill on LinkedIn, Naukri, Indeed India, and dozens more application sites.",
    color: "text-violet",
    bg: "bg-violet-dim",
  },
  {
    icon: PenTool,
    title: "AI Resume Studio",
    description:
      "Tailor your resume per role, rewrite sections with AI, and improve your ATS score before you apply.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
  {
    icon: Bookmark,
    title: "Pipeline Tracker",
    description:
      "Kanban board for saved → applied → interview → offer. Replace messy spreadsheets forever.",
    color: "text-violet",
    bg: "bg-violet-dim",
  },
  {
    icon: BarChart3,
    title: "ATS Score Check",
    description:
      "Paste a job description and see how your resume scores — plus missing keywords to add.",
    color: "text-success",
    bg: "bg-success/15",
  },
  {
    icon: FileText,
    title: "Cover Letters",
    description:
      "Generate tailored cover letters in seconds, matched to the role and your experience.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
  {
    icon: Mail,
    title: "Outreach Emails",
    description:
      "Draft networking messages, follow-ups, and referral requests with a professional tone.",
    color: "text-violet",
    bg: "bg-violet-dim",
  },
  {
    icon: Users,
    title: "Networking",
    description:
      "Import LinkedIn contacts and draft personalized outreach for referrals and intros.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            More tools to help you{" "}
            <span className="gradient-text">stand out</span>
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Everything you need from first search to signed offer — one platform,
            one profile.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="hover:border-accent/30 transition-colors">
              <div
                className={`mb-4 inline-flex rounded-xl p-3 ${f.bg} ${f.color}`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {f.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
