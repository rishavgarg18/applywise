import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const companies = [
  "Stripe", "Notion", "Vercel", "Spotify", "Discord", "Figma", "Datadog", "Google",
];

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden pt-32 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
          <Sparkles className="h-4 w-4 text-accent" />
          Your career command center — powered by one profile
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Land your next role with{" "}
          <span className="gradient-text">intelligent job search</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Discover matched opportunities, tailor your resume, autofill applications,
          and manage your entire search pipeline — all from a single profile.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/login">
            <Button size="lg">
              Build Your Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Browse Opportunities
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          Free forever · No credit card · Join 50,000+ job seekers
        </p>

        <div className="mt-16 overflow-hidden">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted">
            Opportunities from leading companies
          </p>
          <div className="relative flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 gap-12">
              {[...companies, ...companies].map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="text-lg font-semibold text-muted/60 whitespace-nowrap"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
