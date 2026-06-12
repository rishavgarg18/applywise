"use client";

import { EmptyState } from "@/components/app/empty-state";
import {
  JobTargetFields,
  hasJobTarget,
  type JobTargetValues,
} from "@/components/app/job-target-fields";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { TextBlockSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { generateCoverLetter } from "@/lib/gemini";
import { Copy, FileText, Check, Sparkles } from "lucide-react";
import { useState } from "react";

const emptyTarget: JobTargetValues = {
  jobTitle: "",
  company: "",
  jobDescription: "",
};

export default function CoverLetterPage() {
  const { profile, loaded } = useProfile();
  const [target, setTarget] = useState<JobTargetValues>(emptyTarget);
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateTarget = (field: keyof JobTargetValues, value: string) => {
    setTarget((prev) => ({ ...prev, [field]: value }));
    setLetter("");
  };

  const generate = async () => {
    if (!profile || !hasJobTarget(target)) return;
    setLoading(true);
    setLetter("");
    try {
      const result = await generateCoverLetter(
        profile,
        target.jobTitle.trim(),
        target.company.trim(),
        target.jobDescription.trim()
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

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Cover Letter Generator"
        description="Create a tailored cover letter from your profile and the role details you provide."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <JobTargetFields values={target} onChange={updateTarget} />
          <LoadingButton
            className="w-full mt-5"
            onClick={generate}
            loading={loading}
            loadingText="Generating cover letter..."
            disabled={!profile || !hasJobTarget(target)}
          >
            <Sparkles className="h-4 w-4" />
            Generate Cover Letter
          </LoadingButton>
        </Card>

        <Card className="min-h-[420px]">
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 rounded bg-surface2 animate-pulse" />
              </div>
              <TextBlockSkeleton rows={14} />
            </div>
          ) : letter ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Your cover letter</h3>
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <Textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={18}
              />
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="Ready to generate"
              description="Enter the job title, company, and description on the left, then generate your cover letter."
            />
          )}
        </Card>
      </div>
    </>
  );
}
