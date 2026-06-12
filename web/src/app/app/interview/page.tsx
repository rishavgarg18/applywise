"use client";

import { EmptyState } from "@/components/app/empty-state";
import {
  JobTargetFields,
  hasJobTarget,
  type JobTargetValues,
} from "@/components/app/job-target-fields";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { TextBlockSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { generateInterviewQuestion } from "@/lib/gemini";
import { MessageSquare, RefreshCw } from "lucide-react";
import { useState } from "react";

const emptyTarget: JobTargetValues = {
  jobTitle: "",
  company: "",
  jobDescription: "",
};

export default function InterviewPage() {
  const { profile, loaded } = useProfile();
  const [target, setTarget] = useState<JobTargetValues>(emptyTarget);
  const [question, setQuestion] = useState("");
  const [tip, setTip] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; tip: string }[]>(
    []
  );

  const updateTarget = (field: keyof JobTargetValues, value: string) => {
    setTarget((prev) => ({ ...prev, [field]: value }));
  };

  const nextQuestion = async () => {
    if (!profile || !hasJobTarget(target)) return;
    setLoading(true);
    setQuestion("");
    setTip("");
    try {
      const result = await generateInterviewQuestion(
        profile,
        target.jobTitle.trim(),
        target.company.trim()
      );
      setQuestion(result.question);
      setTip(result.tip);
      setAnswer("");
      setHistory((h) => [result, ...h].slice(0, 10));
    } catch {
      setQuestion("Tell me about a challenging project you worked on.");
      setTip("Use the STAR method. Focus on your specific contributions.");
    }
    setLoading(false);
  };

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="AI Interviewer"
        description="Practice interview questions tailored to the role you are preparing for."
      />

      <Card className="mb-6">
        <JobTargetFields
          values={target}
          onChange={updateTarget}
          descriptionRows={4}
        />
        <LoadingButton
          className="w-full mt-5"
          onClick={nextQuestion}
          loading={loading}
          loadingText="Generating question..."
          disabled={!profile || !hasJobTarget(target)}
        >
          <RefreshCw className="h-4 w-4" />
          New question
        </LoadingButton>
      </Card>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <TextBlockSkeleton rows={4} />
          </Card>
          <Card>
            <TextBlockSkeleton rows={10} />
          </Card>
        </div>
      ) : question ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 mb-4 text-accent">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-medium">Interview question</h3>
            </div>
            <p className="text-base leading-relaxed">{question}</p>
            <div className="mt-6 p-4 rounded-lg bg-accent-dim/40 border border-accent/20">
              <p className="text-xs font-medium text-accent mb-2">Tip</p>
              <p className="text-sm text-muted leading-relaxed">{tip}</p>
            </div>
          </Card>

          <Card>
            <h3 className="font-medium mb-4">Your answer</h3>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your practice answer using the STAR method..."
              rows={10}
            />
            <p className="text-xs text-muted mt-3 leading-relaxed">
              Practice out loud for best results. Focus on specific examples and measurable outcomes.
            </p>
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="Start practicing"
            description="Enter the target role details above and generate your first interview question."
          />
        </Card>
      )}

      {history.length > 1 && (
        <div className="mt-8">
          <h3 className="font-medium mb-4">Previous questions</h3>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <Card key={i} className="p-4">
                <p className="text-sm">{h.question}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
