"use client";

import { Storage } from "@/lib/storage";
import { PdfViewerSkeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export function ResumePdfViewer({ refreshKey = 0 }: { refreshKey?: number }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { resumePdfBase64: base64, resumeFilename: name } =
          await Storage.getResume();
        if (cancelled) return;

        setFilename(name);

        if (!base64) {
          setPdfUrl(null);
          return;
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [refreshKey]);

  if (loading) {
    return <PdfViewerSkeleton />;
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface2 py-16 text-center">
        <FileText className="h-10 w-10 text-muted mb-3" />
        <p className="text-sm font-medium text-foreground">No resume uploaded</p>
        <p className="text-xs text-muted mt-1 max-w-xs">
          Upload a PDF in onboarding or settings to preview it here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {filename && (
        <p className="text-xs text-muted mb-2 truncate">{filename}</p>
      )}
      <iframe
        src={pdfUrl}
        title="Resume PDF"
        className="w-full h-[600px] rounded-lg border border-border bg-white"
      />
    </div>
  );
}
