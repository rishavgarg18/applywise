import { Logo } from "@/components/logo";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Opportunities", href: "/app/matches" },
    { label: "Chrome Extension", href: "/extension" },
    { label: "Resume Studio", href: "/app/resume" },
    { label: "Pipeline Board", href: "/app/tracker" },
  ],
  Tools: [
    { label: "ATS Score", href: "/app/ats" },
    { label: "Cover Letters", href: "/app/cover-letter" },
    { label: "Outreach Emails", href: "/app/emails" },
    { label: "Networking", href: "/app/networking" },
  ],
  Company: [
    { label: "Sign In", href: "/login" },
    { label: "Get Started", href: "/login" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border py-16 bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted leading-relaxed">
              Your AI job search partner. One profile powers matching, autofill,
              resume tools, and your entire pipeline.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted hover:text-accent transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted">
          <p>© 2026 Applywise. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a
              href="mailto:support@applywise.app"
              className="hover:text-foreground"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
