"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { generateCoverLetter } from "@/lib/gemini";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { Copy, Loader2, Sparkles, Check } from "lucide-react";
import { useState } from "react";

export default function CoverLetterPage() {
  const { profile } = useProfile();
  const [selectedJob, setSelectedJob] = useState(JOB_LISTINGS[0].id);
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const job = JOB_LISTINGS.find((j) => j.id === selectedJob);

  const generate = async () => {
    if (!profile || !job) return;
    setLoading(true);
    try {
      const result = await generateCoverLetter(
        profile,
        job.title,
        job.company,
        job.description
      );
      setLetter(result);
    } catch {
      setLetter("Failed to generate cover letter. Please try again.");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader
        title="Letter Craft"
        description="Generate tailored cover letters in seconds"
      />

      <Card className="mb-6">
        <label className="text-xs text-muted uppercase tracking-wide">
          Generate for role
        </label>
        <Select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="mt-2"
        >
          {JOB_LISTINGS.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} at {j.company}
            </option>
          ))}
        </Select>
        <Button className="w-full mt-4" onClick={generate} disabled={loading || !profile}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Crafting letter...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate Cover Letter
            </>
          )}
        </Button>
      </Card>

      {letter && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Your Cover Letter</h3>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <Textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={16} />
        </Card>
      )}
    </>
  );
}
