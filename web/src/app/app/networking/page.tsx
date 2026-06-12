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
import { Input, Textarea } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { useLinkedInImport } from "@/hooks/use-linkedin-import";
import { generateNetworkingMessage } from "@/lib/gemini";
import type { ContactSuggestion } from "@/lib/types";
import { Copy, MessageSquare, Check } from "lucide-react";
import { useState } from "react";

const emptyTarget: JobTargetValues = {
  jobTitle: "",
  company: "",
  jobDescription: "",
};

export default function NetworkingPage() {
  const { profile, loaded } = useProfile();
  const linkedIn = useLinkedInImport();
  const [target, setTarget] = useState<JobTargetValues>(emptyTarget);
  const [selected, setSelected] = useState<ContactSuggestion | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateTarget = (field: keyof JobTargetValues, value: string) => {
    setTarget((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const pickContact = (contact: ContactSuggestion) => {
    setSelected(contact);
    setContactName(contact.name);
    setContactTitle(contact.title);
    setMessage("");
  };

  const draftMessage = async () => {
    if (!profile || !hasJobTarget(target) || !contactName.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await generateNetworkingMessage(
        profile,
        contactName.trim(),
        contactTitle.trim() || "Professional",
        target.company.trim(),
        target.jobTitle.trim()
      );
      setMessage(result);
    } catch {
      setMessage("Failed to generate message. Please try again.");
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Contact Outreach"
        description="Import contacts from LinkedIn or enter details manually, then draft outreach messages."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="space-y-5">
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
            <ContactPicker
              contacts={linkedIn.contacts}
              selectedId={selected?.id}
              onSelect={pickContact}
            />
          </Card>

          <Card className="space-y-4">
            <p className="text-sm text-muted">Or enter contact details manually</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Contact name" required>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Sarah Chen"
                />
              </FormField>
              <FormField label="Contact title">
                <Input
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  placeholder="Engineering Manager"
                />
              </FormField>
            </div>
            <LoadingButton
              className="w-full"
              onClick={draftMessage}
              loading={loading}
              loadingText="Drafting message..."
              disabled={
                !profile || !hasJobTarget(target) || !contactName.trim()
              }
            >
              <MessageSquare className="h-4 w-4" />
              Draft message
            </LoadingButton>
          </Card>
        </div>

        <Card className="min-h-[320px]">
          {loading ? (
            <TextBlockSkeleton rows={8} />
          ) : message ? (
            <>
              <h3 className="font-medium mb-1">Message for {contactName}</h3>
              <p className="text-xs text-muted mb-4">
                Copy and send manually on LinkedIn or email.
              </p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
              />
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy message"}
                </Button>
                {selected?.linkedinUrl && (
                  <a href={selected.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      Open LinkedIn profile
                    </Button>
                  </a>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No message yet"
              description="Import or select a contact, then generate a personalized outreach draft."
            />
          )}
        </Card>
      </div>
    </>
  );
}
