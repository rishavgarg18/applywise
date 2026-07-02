"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Is Applywise free? How do you make money?",
    a: "The core platform — profile, job search, pipeline tracking, resume tools, and extension autofill — is free. We may offer premium AI features and credits for heavy usage. We do not sell your personal data.",
  },
  {
    q: "How does Applywise work?",
    a: "Create one profile from your resume. Search opportunities ranked by fit, tailor your resume for each role, autofill applications with the Chrome extension, and track everything in your pipeline board.",
  },
  {
    q: "How is my data handled?",
    a: "Your resume and profile are stored securely on our servers to sync between web and extension. We use your data only to power matching, autofill, and AI features. See our Privacy Policy for full details.",
  },
  {
    q: "Where do job listings come from?",
    a: "Opportunities are sourced from live job APIs (including Adzuna for India listings). Results are ranked against your profile after you search — we don't auto-fetch to save API usage.",
  },
  {
    q: "Do I need the Chrome extension?",
    a: "The web app handles matching, tracking, and resume tools. The extension adds one-click autofill on job application pages — highly recommended for active applicants.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 border-t border-border/60">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Got questions?</h2>
          <p className="mt-3 text-muted">Everything you need to know before you start</p>
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
                    "h-5 w-5 text-muted transition-transform shrink-0 ml-4",
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
