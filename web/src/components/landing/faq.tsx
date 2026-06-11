"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Is Applywise free?",
    a: "Yes! The core platform — job matching, pipeline tracking, resume tools, and browser autofill — is free forever. We may offer premium AI features in the future, but your essential toolkit stays free.",
  },
  {
    q: "How does job matching work?",
    a: "When you create a profile, you tell us your skills, target roles, locations, and dealbreakers. Our system matches you against opportunities from thousands of vetted companies and ranks them by fit.",
  },
  {
    q: "How is my data handled?",
    a: "Your data stays on your device. We don't sell your information. Profile data is used only to match you with jobs and power autofill. Nothing is shared without your consent.",
  },
  {
    q: "Where do the job listings come from?",
    a: "Most listings are sourced directly from company career pages. We regularly check 20,000+ companies for new openings. Some employers also post exclusive roles on our platform.",
  },
  {
    q: "Do I need the Chrome extension?",
    a: "The web platform handles matching, tracking, resume tools, and more. The Chrome extension adds one-click autofill on any job application page — highly recommended but optional.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <button
                className="flex w-full items-center justify-between p-5 text-left font-medium"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-muted leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
