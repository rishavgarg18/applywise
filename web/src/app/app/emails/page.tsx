"use client";

import { ContactPicker } from "@/components/app/contact-picker";
import { EmptyState } from "@/components/app/empty-state";
import { FormField } from "@/components/app/form-field";
import {
  JobTargetFields,
  hasJobTarget,
  type JobTargetValues,
} from "@/components/app/job-target-fields";
import { LinkedInImportBar } from "@/components/app/linkedin-import-bar";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { TextBlockSkeleton } from "@/components/ui/skeleton";
import { Input, Textarea, Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { useLinkedInImport } from "@/hooks/use-linkedin-import";
import { generateEmail } from "@/lib/gemini";
import type { ContactSuggestion } from "@/lib/types";
import { Copy, Mail, Check } from "lucide-react";
import { useState } from "react";

const emptyTarget: JobTargetValues = {
  jobTitle: "",
  company: "",
  jobDescription: "",
};

export default function EmailsPage() {
  const { profile, loaded } = useProfile();
  const linkedIn = useLinkedInImport();
  const [type, setType] = useState<"networking" | "followup" | "thankyou">(
    "networking"
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [target, setTarget] = useState<JobTargetValues>(emptyTarget);
  const [context, setContext] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateTarget = (field: keyof JobTargetValues, value: string) => {
    setTarget((prev) => ({ ...prev, [field]: value }));
    setEmail("");
  };

  const pickContact = (contact: ContactSuggestion) => {
    setRecipientName(contact.name);
    setRecipientTitle(contact.title);
    setEmail("");
  };

  const generate = async () => {
    if (!profile || !hasJobTarget(target)) return;
    setLoading(true);
    setEmail("");
    try {
      const result = await generateEmail(
        profile,
        type,
        recipientName.trim() || "Hiring Manager",
        recipientTitle.trim() || "Team Lead",
        target.company.trim(),
        target.jobTitle.trim(),
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

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Outreach Drafts"
        description="Import contacts from LinkedIn or enter recipient details, then generate outreach emails."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="space-y-5">
            <FormField label="Email type">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
              >
                <option value="networking">Networking</option>
                <option value="followup">Application follow-up</option>
                <option value="thankyou">Interview thank-you</option>
              </Select>
            </FormField>

            <JobTargetFields values={target} onChange={updateTarget} descriptionRows={4} />

            <LinkedInImportBar
              company={target.company}
              role={target.jobTitle}
              hasExtension={linkedIn.hasExtension}
              importing={linkedIn.importing}
              error={linkedIn.error}
              onOpenSearch={() =>
                linkedIn.openSearch(target.company.trim(), target.jobTitle.trim())
              }
              onImport={() =>
                linkedIn.importFromLinkedIn(
                  target.company.trim(),
                  target.jobTitle.trim()
                )
              }
            />
          </Card>

          <Card>
            <h3 className="font-medium mb-3">Imported contacts</h3>
            <ContactPicker contacts={linkedIn.contacts} onSelect={pickContact} />
          </Card>

          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Recipient name">
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </FormField>
              <FormField label="Recipient title">
                <Input
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  placeholder="Engineering Manager"
                />
              </FormField>
            </div>

            <FormField label="Additional context" hint="Optional details to include.">
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any specific details to include..."
                rows={3}
              />
            </FormField>

            <LoadingButton
              className="w-full"
              onClick={generate}
              loading={loading}
              loadingText="Drafting email..."
              disabled={!profile || !hasJobTarget(target)}
            >
              Generate email
            </LoadingButton>
          </Card>
        </div>

        <Card className="min-h-[420px]">
          {loading ? (
            <TextBlockSkeleton rows={16} />
          ) : email ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Draft</h3>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                rows={18}
              />
            </>
          ) : (
            <EmptyState
              icon={Mail}
              title="No draft yet"
              description="Import a contact or fill in recipient details, then generate your email."
            />
          )}
        </Card>
      </div>
    </>
  );
}
