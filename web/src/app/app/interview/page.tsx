"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea, Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { generateInterviewQuestion } from "@/lib/gemini";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function InterviewPage() {
  const { profile } = useProfile();
  const [selectedJob, setSelectedJob] = useState(JOB_LISTINGS[0].id);
  const [question, setQuestion] = useState("");
  const [tip, setTip] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { question: string; tip: string }[]
  >([]);

  const job = JOB_LISTINGS.find((j) => j.id === selectedJob);

  const nextQuestion = async () => {
    if (!profile || !job) return;
    setLoading(true);
    try {
      const result = await generateInterviewQuestion(
        profile,
        job.title,
        job.company
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

  return (
    <>
      <PageHeader
        title="AI Interviewer"
        description="Practice with realistic interview questions tailored to your target role"
      />

      <Card className="mb-6">
        <label className="text-xs text-muted uppercase tracking-wide">
          Practice for role
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
        <Button className="w-full mt-4" onClick={nextQuestion} disabled={loading || !profile}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> New Question
            </>
          )}
        </Button>
      </Card>

      {question && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 mb-4 text-accent">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">Interview Question</h3>
            </div>
            <p className="text-lg leading-relaxed">{question}</p>
            <div className="mt-6 p-4 rounded-xl bg-violet-dim/30 border border-violet/20">
              <p className="text-xs text-violet uppercase tracking-wide mb-2">
                Tip
              </p>
              <p className="text-sm text-muted">{tip}</p>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Your Answer</h3>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your practice answer here using the STAR method..."
              rows={10}
            />
            <p className="text-xs text-muted mt-3">
              Practice out loud for best results. Focus on specific examples and measurable outcomes.
            </p>
          </Card>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Previous Questions</h3>
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
