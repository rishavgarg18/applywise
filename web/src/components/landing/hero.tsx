import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Puzzle } from "lucide-react";

const companies = [
  "Google",
  "Stripe",
  "Notion",
  "Vercel",
  "Spotify",
  "Meta",
  "Amazon",
  "Flipkart",
  "Razorpay",
  "Swiggy",
];

export function Hero() {
  return (
    <section className="hero-glow mesh-bg relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-6xl lg:text-[4.25rem]">
          Your AI job search companion.
          <br />
          <span className="gradient-text">Built around one profile.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl leading-relaxed">
          Search matched roles, tailor your resume, autofill applications on
          Naukri and LinkedIn, and track every opportunity — without retyping
          yourself into every form.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/login">
            <Button size="lg" className="min-w-[200px]">
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/extension">
            <Button size="lg" variant="outline" className="min-w-[200px]">
              <Puzzle className="h-4 w-4" />
              Chrome Extension
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          Free core tools · Naukri &amp; LinkedIn autofill · India &amp; global roles
        </p>

        <div className="mt-16 overflow-hidden">
          <p className="mb-5 text-xs uppercase tracking-[0.2em] text-muted">
            Apply faster at companies like
          </p>
          <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="animate-marquee flex shrink-0 gap-14">
              {[...companies, ...companies].map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="text-base font-semibold text-muted/50 whitespace-nowrap"
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
