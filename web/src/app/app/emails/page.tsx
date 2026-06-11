"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { generateEmail } from "@/lib/gemini";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { Copy, Loader2, Check } from "lucide-react";
import { useState } from "react";

export default function EmailsPage() {
  const { profile } = useProfile();
  const [type, setType] = useState<"networking" | "followup" | "thankyou">(
    "networking"
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [selectedJob, setSelectedJob] = useState(JOB_LISTINGS[0].id);
  const [context, setContext] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const job = JOB_LISTINGS.find((j) => j.id === selectedJob);

  const generate = async () => {
    if (!profile || !job) return;
    setLoading(true);
    try {
      const result = await generateEmail(
        profile,
        type,
        recipientName || "Hiring Manager",
        recipientTitle || "Team Lead",
        job.company,
        job.title,
        context
      );
      setEmail(result);
    } catch {
      setEmail("Failed to generate email. Please try again.");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader
        title="Outreach Drafts"
        description="Craft networking emails, follow-ups, and thank-you notes"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">
              Email type
            </label>
            <Select
              value={type}
              onChange={(e) =>
                setType(e.target.value as typeof type)
              }
              className="mt-2"
            >
              <option value="networking">Networking</option>
              <option value="followup">Application Follow-up</option>
              <option value="thankyou">Interview Thank-you</option>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">
              Role
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">
                Recipient name
              </label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Jane Smith"
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide">
                Their title
              </label>
              <Input
                value={recipientTitle}
                onChange={(e) => setRecipientTitle(e.target.value)}
                placeholder="Engineering Manager"
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide">
              Additional context
            </label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any specific details to include..."
              className="mt-2"
              rows={3}
            />
          </div>
          <Button className="w-full" onClick={generate} disabled={loading || !profile}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Drafting...
              </>
            ) : (
              "Generate Email"
            )}
          </Button>
        </Card>

        <Card>
          {email ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Draft</h3>
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <Textarea value={email} onChange={(e) => setEmail(e.target.value)} rows={18} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-12 text-muted text-sm">
              Fill in the details and generate your outreach email
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
