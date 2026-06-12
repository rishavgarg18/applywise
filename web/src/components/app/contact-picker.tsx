"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { ContactSuggestion } from "@/lib/types";
import { Users } from "lucide-react";

type Props = {
  contacts: ContactSuggestion[];
  selectedId?: string;
  onSelect: (contact: ContactSuggestion) => void;
};

export function ContactPicker({ contacts, selectedId, onSelect }: Props) {
  if (!contacts.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        <Users className="h-5 w-5 mx-auto mb-2 opacity-60" />
        No contacts yet. Import from LinkedIn or enter details manually.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
      {contacts.map((contact) => {
        const active = selectedId === contact.id;
        return (
          <Card
            key={contact.id}
            className={cn(
              "p-3 cursor-pointer transition-colors",
              active ? "border-accent/50 bg-accent-dim/30" : "hover:border-border"
            )}
            onClick={() => onSelect(contact)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{contact.name}</p>
                <p className="text-xs text-muted truncate">
                  {contact.title || "—"}
                  {contact.company ? ` · ${contact.company}` : ""}
                </p>
              </div>
              {contact.relevance > 0 && (
                <Badge variant="accent">{contact.relevance}% fit</Badge>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
