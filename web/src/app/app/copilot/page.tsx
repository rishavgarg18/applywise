import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import Link from "next/link";
import {
  Puzzle,
  Download,
  Zap,
  Shield,
  Globe,
  CheckCircle,
} from "lucide-react";

const SUPPORTED_SITES = [
  "Naukri.com",
  "LinkedIn Easy Apply",
  "Internshala",
  "Indeed India",
  "Unstop",
  "Wellfound",
  "Cutshort",
  "Shine.com",
  "WorkIndia",
  "Greenhouse",
  "Lever",
  "Any HTML form",
];

const STEPS = [
  "Install the Applywise Chrome extension",
  "Sign in and upload your resume in the popup",
  "Navigate to any job application page",
  "Click Autofill This Page in the extension",
];

export default function CopilotPage() {
  const storeUrl = siteConfig.chromeExtensionUrl;
  const installHref = storeUrl || "/extension";

  return (
    <>
      <PageHeader
        title="Browser Assistant"
        description="Autofill Naukri, LinkedIn, Indeed, and 50+ job boards in one click"
      />

      <Card className="mb-8 bg-gradient-to-br from-accent-dim/40 to-violet-dim/40 border-accent/20">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Zap className="h-10 w-10 text-accent" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">Applywise Chrome Extension</h2>
            <p className="text-muted mt-2">
              Upload your resume once. AI maps every form field and fills your
              application — works on Naukri, LinkedIn Easy Apply, Indeed, and more.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <Badge variant="accent">Free core features</Badge>
              <Badge variant="violet">Profile sync</Badge>
              <Badge variant="default">50+ job boards</Badge>
            </div>
          </div>
          <a href={installHref} target={storeUrl ? "_blank" : undefined} rel={storeUrl ? "noopener noreferrer" : undefined}>
            <Button size="lg" className="shrink-0">
              {storeUrl ? <Download className="h-5 w-5" /> : <Puzzle className="h-5 w-5" />}
              {storeUrl ? "Add to Chrome" : "Extension page"}
            </Button>
          </a>
        </div>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Zap, title: "One-click autofill", desc: "Fill entire applications in seconds" },
          { icon: Shield, title: "Account sync", desc: "Same profile on web and extension" },
          { icon: Globe, title: "50+ job boards", desc: "Naukri, LinkedIn, Indeed India & more" },
          { icon: CheckCircle, title: "AI-powered", desc: "Smart field mapping with Gemini" },
        ].map((f) => (
          <Card key={f.title}>
            <f.icon className="h-5 w-5 text-accent mb-3" />
            <h3 className="font-medium">{f.title}</h3>
            <p className="text-sm text-muted mt-1">{f.desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold mb-4">How to get started</h3>
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-sm pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Supported platforms</h3>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_SITES.map((site) => (
              <Badge key={site} variant="default">
                {site}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted mt-4">
            Also works on generic HTML forms with 3+ input fields. See the{" "}
            <Link href="/extension" className="text-accent hover:underline">
              extension page
            </Link>{" "}
            for SEO-friendly install details.
          </p>
        </Card>
      </div>
    </>
  );
}
