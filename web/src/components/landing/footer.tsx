import { Logo } from "@/components/logo";
import Link from "next/link";

const footerLinks = {
  Features: [
    { label: "Smart Opportunities", href: "/app/matches" },
    { label: "Browser Assistant", href: "/app/copilot" },
    { label: "Resume Studio", href: "/app/resume" },
    { label: "Pipeline Board", href: "/app/tracker" },
  ],
  Tools: [
    { label: "Resume Health Check", href: "/app/ats" },
    { label: "Letter Craft", href: "/app/cover-letter" },
    { label: "Outreach Drafts", href: "/app/emails" },
    { label: "Contact Finder", href: "/app/networking" },
  ],
  Explore: [
    { label: "AI Interviewer", href: "/app/interview" },
    { label: "All Jobs", href: "/app/matches" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted leading-relaxed">
              Your intelligent career command center. One profile powers your entire job search.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
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
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
