"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import type { ContactSuggestion } from "@/lib/types";

const WEB = "applywise-web";
const EXT = "applywise-extension";

type ImportedPerson = {
  name: string;
  title?: string;
  location?: string;
  profileUrl?: string;
  score?: number;
};

function buildLinkedInSearchUrl(company: string, role: string) {
  const keywords = [role, company].filter(Boolean).join(" ");
  const params = new URLSearchParams({
    keywords: keywords || "hiring manager",
    origin: "GLOBAL_SEARCH_HEADER",
  });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

export function useLinkedInImport() {
  const [hasExtension, setHasExtension] = useState<boolean | null>(null);
  const [contacts, setContacts] = useState<ContactSuggestion[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.postMessage({ source: WEB, type: "PING_EXTENSION" }, "*");

    const onMessage = (event: MessageEvent) => {
      if (event.data?.source === EXT && event.data?.type === "PONG") {
        setHasExtension(true);
      }
    };

    window.addEventListener("message", onMessage);
    const timer = setTimeout(() => {
      setHasExtension((value) => value ?? false);
    }, 600);

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const saved = await ApiClient.getContacts();
      setContacts(saved);
    } catch {
      /* not signed in yet */
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const openSearch = (company: string, role: string) => {
    window.open(buildLinkedInSearchUrl(company, role), "_blank");
  };

  const importFromLinkedIn = async (company: string, role: string) => {
    setImporting(true);
    setError(null);

    return new Promise<ContactSuggestion[]>((resolve) => {
      const onMessage = async (event: MessageEvent) => {
        const data = event.data;
        if (data?.source !== EXT || data?.type !== "IMPORT_LINKEDIN_RESULT") return;

        window.removeEventListener("message", onMessage);
        setImporting(false);

        if (!data.success) {
          setError(data.error || "Import failed");
          resolve([]);
          return;
        }

        const incoming = (data.people as ImportedPerson[]).map((person) => ({
          name: person.name,
          title: person.title || "",
          company,
          location: person.location,
          linkedinUrl: person.profileUrl || "",
          relevance: person.score || 0,
        }));

        try {
          const saved = await ApiClient.saveContacts(incoming);
          setContacts(saved);
          resolve(saved);
        } catch {
          const local = incoming.map((c, i) => ({
            ...c,
            id: `local-${i}`,
          }));
          setContacts(local);
          resolve(local);
        }
      };

      window.addEventListener("message", onMessage);
      window.postMessage(
        { source: WEB, type: "IMPORT_LINKEDIN", company, role },
        "*"
      );

      setTimeout(() => {
        window.removeEventListener("message", onMessage);
        setImporting(false);
        setError("Import timed out. Is the extension installed?");
        resolve([]);
      }, 30000);
    });
  };

  return {
    hasExtension,
    contacts,
    importing,
    error,
    openSearch,
    importFromLinkedIn,
    reloadContacts: loadSaved,
  };
}
