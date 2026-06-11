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
      "Stop endless scrolling. Set your preferences and get matched with roles that actually fit your skills and goals.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
  {
    icon: Zap,
    title: "Browser Assistant",
    description:
      "Install our Chrome extension to autofill any job application form in seconds. Works on 50+ job boards.",
    color: "text-violet",
    bg: "bg-violet-dim",
  },
  {
    icon: PenTool,
    title: "Resume Studio",
    description:
      "Tailor your resume for each role with AI. Optimize keywords, rewrite sections, and boost your ATS score.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
  {
    icon: Bookmark,
    title: "Pipeline Board",
    description:
      "Track every application from saved to offer. Visual kanban board replaces messy spreadsheets forever.",
    color: "text-violet",
    bg: "bg-violet-dim",
  },
  {
    icon: BarChart3,
    title: "Resume Health Check",
    description:
      "See how your resume scores against any job description. Get actionable fixes and missing keyword alerts.",
    color: "text-success",
    bg: "bg-success/15",
  },
  {
    icon: FileText,
    title: "Letter Craft",
    description:
      "Generate tailored cover letters in seconds. Each one matches your experience to the specific role.",
    color: "text-accent",
    bg: "bg-accent-dim",
  },
  {
    icon: Mail,
    title: "Outreach Drafts",
    description:
      "Craft networking emails, follow-ups, and thank-you notes with AI. Professional tone, every time.",
    color: "text-violet",
    bg: "bg-violet-dim",
  },
  {
    icon: Users,
    title: "Contact Finder",
    description:
      "Discover hiring managers and team leads at target companies. Draft personalized outreach messages.",
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
            Everything you need to{" "}
            <span className="gradient-text">stand out</span>
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            From discovery to offer letter — one platform handles your entire job search workflow.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="hover:border-border/80">
              <div
                className={`mb-4 inline-flex rounded-xl p-3 ${f.bg} ${f.color}`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
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
