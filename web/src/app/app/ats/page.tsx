"use client";

import { EmptyState } from "@/components/app/empty-state";
import { FormField } from "@/components/app/form-field";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { ResultPanelSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { analyzeATS } from "@/lib/gemini";
import { BarChart3, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function ATSPage() {
  const { profile, loaded } = useProfile();
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    summary: string;
  } | null>(null);

  const analyze = async () => {
    if (!profile || !jobDescription.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeATS(profile, jobDescription.trim());
      setResult(res);
    } catch {
      setResult({
        score: 0,
        missingKeywords: [],
        suggestions: ["Analysis failed. Please try again."],
        summary: "Unable to complete analysis.",
      });
    }
    setLoading(false);
  };

  const scoreColor =
    !result
      ? "text-muted"
      : result.score >= 80
        ? "text-success"
        : result.score >= 60
          ? "text-warning"
          : "text-danger";

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Resume ATS Score Check"
        description="Measure how well your resume aligns with a specific job description and get actionable improvements."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <FormField
            label="Job description to compare against"
            hint="Paste the full posting or the requirements section from the role you are targeting."
            required
          >
            <Textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                setResult(null);
              }}
              placeholder="Paste the job description here..."
              rows={12}
            />
          </FormField>
          <LoadingButton
            className="w-full mt-5"
            onClick={analyze}
            loading={loading}
            loadingText="Analyzing resume..."
            disabled={!profile || !jobDescription.trim()}
          >
            Run ATS Score Check
          </LoadingButton>
        </Card>

        <Card className="min-h-[420px]">
          {loading ? (
            <ResultPanelSkeleton />
          ) : result ? (
            <div>
              <div className="text-center mb-6">
                <p className={`text-5xl font-semibold tabular-nums ${scoreColor}`}>
                  {result.score}
                </p>
                <p className="text-sm text-muted mt-1">ATS score out of 100</p>
              </div>
              <p className="text-sm leading-relaxed mb-6 text-foreground/90">
                {result.summary}
              </p>

              {result.missingKeywords.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Missing keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw) => (
                      <Badge key={kw} variant="warning">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Recommendations
                </p>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted flex gap-2">
                      <span className="text-accent shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No analysis yet"
              description="Paste a job description and run the ATS score check to see how your resume compares."
            />
          )}
        </Card>
      </div>
    </>
  );
}
