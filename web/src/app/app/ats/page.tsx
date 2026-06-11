"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { analyzeATS } from "@/lib/gemini";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function ATSPage() {
  const { profile } = useProfile();
  const [selectedJob, setSelectedJob] = useState(JOB_LISTINGS[0].id);
  const [customJd, setCustomJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    missingKeywords: string[];
    suggestions: string[];
    summary: string;
  } | null>(null);

  const job = JOB_LISTINGS.find((j) => j.id === selectedJob);
  const jd = customJd || job?.description || "";

  const analyze = async () => {
    if (!profile || !jd) return;
    setLoading(true);
    try {
      const res = await analyzeATS(profile, jd);
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

  return (
    <>
      <PageHeader
        title="Resume Health Check"
        description="See how your resume scores against any job description"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <label className="text-xs text-muted uppercase tracking-wide">
            Compare against
          </label>
          <Select
            value={selectedJob}
            onChange={(e) => {
              setSelectedJob(e.target.value);
              setResult(null);
            }}
            className="mt-2 mb-4"
          >
            {JOB_LISTINGS.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} at {j.company}
              </option>
            ))}
          </Select>
          <label className="text-xs text-muted uppercase tracking-wide">
            Or paste custom job description
          </label>
          <Textarea
            value={customJd}
            onChange={(e) => {
              setCustomJd(e.target.value);
              setResult(null);
            }}
            placeholder={job?.description}
            className="mt-2"
            rows={8}
          />
          <Button
            className="w-full mt-4"
            onClick={analyze}
            disabled={loading || !profile}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              "Run Health Check"
            )}
          </Button>
        </Card>

        <Card>
          {result ? (
            <div>
              <div className="text-center mb-6">
                <p className={`text-6xl font-bold ${scoreColor}`}>
                  {result.score}
                </p>
                <p className="text-sm text-muted mt-1">ATS Score out of 100</p>
              </div>
              <p className="text-sm leading-relaxed mb-6">{result.summary}</p>

              {result.missingKeywords.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Missing Keywords
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
                <p className="text-xs text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Suggestions
                </p>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted flex gap-2"
                    >
                      <span className="text-accent">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="h-20 w-20 rounded-full border-4 border-border flex items-center justify-center mb-4">
                <span className="text-2xl text-muted">?</span>
              </div>
              <p className="text-muted">
                Select a job and run the health check to see your ATS score
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
