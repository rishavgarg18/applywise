"use client";

import Link from "next/link";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

type Props = {
  company: string;
  role: string;
  hasExtension: boolean | null;
  importing: boolean;
  error: string | null;
  onOpenSearch: () => void;
  onImport: () => void;
};

export function LinkedInImportBar({
  company,
  role,
  hasExtension,
  importing,
  error,
  onOpenSearch,
  onImport,
}: Props) {
  const canSearch = Boolean(company.trim() || role.trim());

  if (hasExtension === false) {
    return (
      <div className="rounded-lg border border-border bg-surface2 p-4 text-sm">
        <p className="font-medium">Chrome extension required for LinkedIn import</p>
        <p className="text-muted mt-1 leading-relaxed">
          Install the Applywise extension to import contacts from LinkedIn. You can still enter
          details manually below.
        </p>
        <Link href="/app/copilot" className="inline-block mt-3">
          <Button size="sm" variant="outline">
            Get extension
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenSearch}
          disabled={!canSearch}
        >
          <ExternalLink className="h-4 w-4" />
          Open LinkedIn search
        </Button>
        <LoadingButton
          size="sm"
          onClick={onImport}
          loading={importing}
          loadingText="Importing..."
          disabled={!canSearch || hasExtension !== true}
        >
          <Download className="h-4 w-4" />
          Import from LinkedIn
        </LoadingButton>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        Open LinkedIn people search, scroll to load profiles, then click Import.
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
