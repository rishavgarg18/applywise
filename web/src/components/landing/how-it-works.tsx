import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Build your profile",
    description:
      "Upload your resume once. Our AI extracts your experience, skills, and preferences into a complete profile.",
  },
  {
    step: "02",
    title: "Discover matched roles",
    description:
      "Set dealbreakers and preferences. We surface opportunities from 20,000+ companies that fit your criteria.",
  },
  {
    step: "03",
    title: "Apply with confidence",
    description:
      "Tailor your resume, generate cover letters, autofill applications, and track everything in your pipeline.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Three steps to your next role
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <span className="text-5xl font-bold text-accent/20">{s.step}</span>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-muted leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/login">
            <Button size="lg">
              Start Your Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
