import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { extensionPageJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig, absoluteUrl } from "@/lib/site";
import {
  CheckCircle,
  Puzzle,
  Download,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chrome Extension — Job Application Autofill for Naukri, LinkedIn & Indeed",
  description:
    "Install the Applywise Chrome extension to autofill job applications in one click. Works on Naukri, LinkedIn Easy Apply, Indeed India, Internshala, Greenhouse, Lever, and 50+ sites. Free AI resume parsing.",
  keywords: [
    "job application autofill chrome extension",
    "naukri autofill extension",
    "linkedin easy apply autofill",
    "indeed autofill extension india",
    "resume autofill job application",
    "apply jobs faster chrome",
    "job form filler extension",
  ],
  alternates: {
    canonical: absoluteUrl("/extension"),
  },
  openGraph: {
    title: "Applywise Chrome Extension — Autofill Job Applications",
    description:
      "Upload your resume once. Autofill Naukri, LinkedIn, Indeed, and more in one click.",
    url: absoluteUrl("/extension"),
    siteName: siteConfig.name,
    type: "website",
  },
};

const PLATFORMS = [
  "Naukri",
  "LinkedIn Easy Apply",
  "Indeed India",
  "Internshala",
  "Unstop",
  "Wellfound",
  "Cutshort",
  "Shine.com",
  "Greenhouse",
  "Lever",
  "Workday",
  "Generic HTML forms",
];

const STEPS = [
  "Install Applywise from the Chrome Web Store",
  "Sign in and upload your resume PDF",
  "Open any job application page",
  "Click Autofill This Page in the extension popup",
];

export default function ExtensionPage() {
  const storeUrl = siteConfig.chromeExtensionUrl;
  const installHref = storeUrl || "/login";

  return (
    <>
      {extensionPageJsonLd()}
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <Badge variant="accent" className="mb-4">
            Chrome Extension
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Autofill job applications
            <br />
            <span className="gradient-text">on Naukri, LinkedIn &amp; Indeed</span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
            The Applywise Chrome extension reads your resume once, builds your
            profile with AI, and fills every application field in seconds — on
            50+ job boards used in India and worldwide.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href={installHref} target={storeUrl ? "_blank" : undefined} rel={storeUrl ? "noopener noreferrer" : undefined}>
              <Button size="lg">
                <Puzzle className="h-5 w-5" />
                {storeUrl ? "Add to Chrome — Free" : "Get Started Free"}
              </Button>
            </a>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Open Web Dashboard
              </Button>
            </Link>
          </div>
          {!storeUrl && (
            <p className="mt-4 text-xs text-muted">
              Chrome Web Store listing coming soon — create your profile on web while you wait.
            </p>
          )}
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Zap, title: "One-click autofill", text: "Fill name, email, experience, and custom questions automatically." },
            { icon: Shield, title: "Secure sync", text: "Profile syncs with your Applywise account via Google sign-in." },
            { icon: CheckCircle, title: "AI resume parse", text: "Multi-pass AI extraction with quality score and review step." },
          ].map((item) => (
            <Card key={item.title} className="text-center">
              <item.icon className="h-8 w-8 text-accent mx-auto mb-3" />
              <h2 className="font-semibold mb-2">{item.title}</h2>
              <p className="text-sm text-muted">{item.text}</p>
            </Card>
          ))}
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Supported job application sites
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {PLATFORMS.map((p) => (
              <Badge key={p} variant="default">{p}</Badge>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 sm:px-6 mt-16">
          <Card>
            <h2 className="text-xl font-semibold mb-6">How to install</h2>
            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 mt-16 text-center text-sm text-muted">
          <p>
            Searching for a <strong className="text-foreground">Naukri autofill extension</strong>,{" "}
            <strong className="text-foreground">LinkedIn application filler</strong>, or{" "}
            <strong className="text-foreground">Indeed auto apply tool</strong>?
            Applywise combines autofill, resume parsing, and pipeline tracking in one product.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
