import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Upload your resume once",
    description:
      "Our AI extracts your experience, skills, and education into a complete profile — synced across web and extension.",
  },
  {
    step: "02",
    title: "Find roles that fit",
    description:
      "Search live opportunities ranked against your profile. Set target roles, location, and preferences in Settings.",
  },
  {
    step: "03",
    title: "Apply faster, track everything",
    description:
      "Autofill applications with the extension, tailor your resume, generate cover letters, and track every stage in your pipeline.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 border-y border-border/60 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Tell us about your career.
            <br />
            <span className="gradient-text">We&apos;ll help you land the role.</span>
          </h2>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <span className="text-5xl font-bold text-accent/20">{s.step}</span>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/login">
            <Button size="lg">
              Create Your Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
