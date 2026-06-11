"use client";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { generateNetworkingMessage } from "@/lib/gemini";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { Copy, Loader2, Check, Search, MessageSquare } from "lucide-react";
import { useState } from "react";

const MOCK_CONTACTS = [
  { id: "c1", name: "Sarah Chen", title: "Engineering Manager", company: "Stripe", relevance: 92 },
  { id: "c2", name: "Marcus Johnson", title: "Senior Software Engineer", company: "Stripe", relevance: 85 },
  { id: "c3", name: "Priya Patel", title: "Tech Lead", company: "Stripe", relevance: 78 },
  { id: "c4", name: "Alex Rivera", title: "Director of Engineering", company: "Stripe", relevance: 95 },
  { id: "c5", name: "Jordan Kim", title: "Recruiter", company: "Stripe", relevance: 70 },
];

export default function NetworkingPage() {
  const { profile } = useProfile();
  const [selectedJob, setSelectedJob] = useState(JOB_LISTINGS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(MOCK_CONTACTS[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const job = JOB_LISTINGS.find((j) => j.id === selectedJob);

  const contacts = MOCK_CONTACTS.map((c) => ({
    ...c,
    company: job?.company || c.company,
  }));

  const filteredContacts = contacts.filter(
    (c) =>
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const draftMessage = async (contact: typeof MOCK_CONTACTS[0]) => {
    if (!profile || !job) return;
    setSelectedContact(contact);
    setLoading(true);
    try {
      const result = await generateNetworkingMessage(
        profile,
        contact.name,
        contact.title,
        job.company,
        job.title
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

  return (
    <>
      <PageHeader
        title="Contact Finder"
        description="Discover hiring managers and draft personalized outreach messages"
      />

      <Card className="mb-6">
        <label className="text-xs text-muted uppercase tracking-wide">
          Target role
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
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className={`cursor-pointer transition-colors ${
                  selectedContact.id === contact.id
                    ? "border-accent/50 bg-accent-dim/20"
                    : "hover:border-border/80"
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-dim flex items-center justify-center text-violet font-semibold text-sm">
                      {contact.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted">
                        {contact.title} · {contact.company}
                      </p>
                    </div>
                  </div>
                  <Badge variant="accent">{contact.relevance}% fit</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      draftMessage(contact);
                    }}
                    disabled={loading}
                  >
                    {loading && selectedContact.id === contact.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                    Draft Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <h3 className="font-semibold mb-1">
            Message for {selectedContact.name}
          </h3>
          <p className="text-xs text-muted mb-4">
            Copy this message and send it on LinkedIn manually
          </p>
          {message ? (
            <>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy Message"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted text-sm text-center">
              <MessageSquare className="h-8 w-8 mb-3 opacity-50" />
              <p>Select a contact and click &ldquo;Draft Message&rdquo; to generate outreach text</p>
              <p className="text-xs mt-2">No auto-connect — you stay in control of every outreach</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
