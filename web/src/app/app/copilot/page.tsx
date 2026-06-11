import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
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
  "Indeed",
  "Unstop",
  "Wellfound",
  "Cutshort",
  "Shine.com",
  "WorkIndia",
  "Any HTML form",
];

const STEPS = [
  "Install the Applywise Chrome extension",
  "Upload your resume in the extension popup",
  "Navigate to any job application page",
  "Click the ⚡ button to autofill every field",
];

export default function CopilotPage() {
  return (
    <>
      <PageHeader
        title="Browser Assistant"
        description="Autofill any job application in one click with our Chrome extension"
      />

      <Card className="mb-8 bg-gradient-to-br from-accent-dim/40 to-violet-dim/40 border-accent/20">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Zap className="h-10 w-10 text-accent" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">Applywise Chrome Extension</h2>
            <p className="text-muted mt-2">
              Upload your resume once. AI reads every form field and fills your
              application automatically — works on 50+ job boards.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <Badge variant="accent">Free forever</Badge>
              <Badge variant="violet">No login required</Badge>
              <Badge variant="default">200M+ fields filled</Badge>
            </div>
          </div>
          <Button size="lg" className="shrink-0">
            <Download className="h-5 w-5" />
            Add to Chrome
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Zap, title: "One-click autofill", desc: "Fill entire applications in seconds" },
          { icon: Shield, title: "Local storage", desc: "Your data never leaves your device" },
          { icon: Globe, title: "50+ job boards", desc: "Works on major platforms worldwide" },
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
            The extension also works on any generic HTML form with 3+ input fields.
            A floating ⚡ button appears automatically on supported sites.
          </p>
        </Card>
      </div>
    </>
  );
}
