"use client";

import { FormField } from "@/components/app/form-field";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { Storage } from "@/lib/storage";
import { extractProfileFromResume } from "@/lib/gemini";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { profile, settings, setSettings, setProfile, loaded } = useProfile();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState("");

  useEffect(() => {
    Storage.getResumeFilename().then(setResumeFilename);
  }, []);

  const handleResumeUpload = async (file: File) => {
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), "")
      );
      const { profile: extracted, warning, qualityScore } =
        await extractProfileFromResume(file);
      await setProfile({ ...profile!, ...extracted });
      setUploadWarning(
        warning ||
          (qualityScore < 70
            ? `Profile ${qualityScore}% complete — review experience and education.`
            : "")
      );
      await Storage.setResumeFilename(file.name);
      await Storage.setResumePdfBase64(base64);
      setResumeFilename(file.name);
    } catch {
      /* ignore */
    }
    setUploading(false);
  };

  const clearData = async () => {
    if (confirm("This will delete all your data. Are you sure?")) {
      await Storage.clearAll();
      router.push("/onboarding");
    }
  };

  if (!loaded || !settings) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences, and data"
      />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="font-medium mb-4">Profile</h3>
          {profile && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FormField label="Name">
                <Input
                  value={profile.fullName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Email">
                <Input
                  value={profile.email || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              </FormField>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:border-accent/40 transition-colors">
            {uploading ? (
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
            ) : (
              <Upload className="h-5 w-5 text-accent" />
            )}
            <div>
              <p className="text-sm font-medium">Replace resume PDF</p>
              <p className="text-xs text-muted">
                {resumeFilename || "No file uploaded"}
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleResumeUpload(f);
              }}
            />
          </label>
          {uploadWarning && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {uploadWarning}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="font-medium mb-4">Job preferences</h3>
          <div className="space-y-4">
            <FormField label="Target roles">
              <Input
                value={settings.targetRoles}
                onChange={(e) =>
                  setSettings({ ...settings, targetRoles: e.target.value })
                }
                placeholder="e.g. Software Engineer, Product Manager"
              />
            </FormField>
            <FormField label="Preferred work mode">
              <Select
                value={settings.preferredWorkMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    preferredWorkMode: e.target.value,
                  })
                }
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </Select>
            </FormField>
            <FormField label="Minimum salary">
              <Input
                value={settings.minSalary}
                onChange={(e) =>
                  setSettings({ ...settings, minSalary: e.target.value })
                }
                placeholder="e.g. $120,000"
              />
            </FormField>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Extension Settings</h3>
          <div className="space-y-3">
            {[
              {
                key: "highlightFilled" as const,
                label: "Highlight filled fields",
                desc: "Show visual highlight on autofilled form fields",
              },
              {
                key: "autoCoverLetter" as const,
                label: "Auto-generate cover letters",
                desc: "Generate tailored cover letter text during autofill",
              },
              {
                key: "rulesFirst" as const,
                label: "Rules-first mapping",
                desc: "Use rule-based matching before AI (saves API calls)",
              },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium">{toggle.label}</p>
                  <p className="text-xs text-muted">{toggle.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[toggle.key]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [toggle.key]: e.target.checked,
                    })
                  }
                  className="rounded accent-accent h-5 w-5"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="border-danger/30">
          <h3 className="font-semibold text-danger mb-2">Danger Zone</h3>
          <p className="text-sm text-muted mb-4">
            Permanently delete all profile data and tracked jobs.
          </p>
          <Button variant="danger" onClick={clearData}>
            <Trash2 className="h-4 w-4" /> Clear All Data
          </Button>
        </Card>
      </div>
    </>
  );
}
