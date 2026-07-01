"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { extractProfileFromResume } from "@/lib/gemini";
import { Storage, DEFAULT_PROFILE } from "@/lib/storage";
import type { Education, Experience, Profile } from "@/lib/types";
import { useProfile } from "@/hooks/use-profile";
import { Upload, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

function qualityBadgeClass(score: number) {
  if (score >= 70) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState<"upload" | "extracting" | "review">("upload");
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [showExperiences, setShowExperiences] = useState(true);
  const [showEducation, setShowEducation] = useState(true);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF resume");
      return;
    }
    setError("");
    setFilename(file.name);
    setStep("extracting");

    try {
      const { profile: extracted, warning: extractWarning, qualityScore: score } =
        await extractProfileFromResume(file);
      setProfile({ ...DEFAULT_PROFILE, ...extracted });
      setWarning(extractWarning || "");
      setQualityScore(score);
      await Storage.setResumeFilename(file.name);
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), "")
      );
      await Storage.setResumePdfBase64(base64);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
      setStep("upload");
    }
  };

  const finish = async () => {
    await completeOnboarding(profile);
    router.push("/app");
  };

  const updateField = (key: keyof Profile, value: string) => {
    setProfile((p) => ({ ...p, [key]: value }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setProfile((p) => {
      const experiences = [...(p.experiences || [])];
      experiences[index] = { ...experiences[index], [field]: value };
      return { ...p, experiences };
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setProfile((p) => {
      const education = [...(p.education || [])];
      education[index] = { ...education[index], [field]: value };
      return { ...p, education };
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Logo size="lg" className="inline-block" />
          <p className="mt-3 text-muted">
            Upload your resume once — we&apos;ll build your profile automatically
          </p>
        </div>

        {step === "upload" && (
          <Card>
            <label className="flex flex-col items-center gap-4 cursor-pointer border-2 border-dashed border-border rounded-xl p-10 hover:border-accent/50 transition-colors">
              <Upload className="h-10 w-10 text-accent" />
              <div className="text-center">
                <p className="font-medium">Drop your resume PDF here</p>
                <p className="text-sm text-muted mt-1">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => router.push("/app")}>
                Skip for now
              </Button>
            </div>
          </Card>
        )}

        {step === "extracting" && (
          <Card className="text-center py-12">
            <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto" />
            <p className="mt-4 font-medium">Analyzing {filename}...</p>
            <p className="text-sm text-muted mt-2">
              Extracting your experience, skills, and education
            </p>
          </Card>
        )}

        {step === "review" && (
          <Card>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Profile extracted</span>
              </div>
              {qualityScore != null && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full border",
                    qualityBadgeClass(qualityScore)
                  )}
                >
                  {qualityScore}% complete
                </span>
              )}
            </div>
            {warning && (
              <p className="mb-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {warning}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">
                  Full Name
                </label>
                <Input
                  value={profile.fullName || ""}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">
                    Email
                  </label>
                  <Input
                    value={profile.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wide">
                    Phone
                  </label>
                  <Input
                    value={profile.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">
                  Current Role
                </label>
                <Input
                  value={profile.currentDesignation || ""}
                  onChange={(e) =>
                    updateField("currentDesignation", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wide">
                  Skills
                </label>
                <Input
                  value={profile.primarySkills || ""}
                  onChange={(e) => updateField("primarySkills", e.target.value)}
                  className="mt-1"
                />
              </div>

              {(profile.experiences?.length ?? 0) > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-muted/30"
                    onClick={() => setShowExperiences((v) => !v)}
                  >
                    Work experience ({profile.experiences?.length})
                    {showExperiences ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showExperiences && (
                    <div className="p-3 space-y-3">
                      {profile.experiences?.map((exp, i) => (
                        <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                          <Input
                            placeholder="Role"
                            value={exp.role || ""}
                            onChange={(e) => updateExperience(i, "role", e.target.value)}
                          />
                          <Input
                            placeholder="Company"
                            value={exp.company || ""}
                            onChange={(e) => updateExperience(i, "company", e.target.value)}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="From"
                              value={exp.from || ""}
                              onChange={(e) => updateExperience(i, "from", e.target.value)}
                            />
                            <Input
                              placeholder="To"
                              value={exp.to || ""}
                              onChange={(e) => updateExperience(i, "to", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(profile.education?.length ?? 0) > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-muted/30"
                    onClick={() => setShowEducation((v) => !v)}
                  >
                    Education ({profile.education?.length})
                    {showEducation ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showEducation && (
                    <div className="p-3 space-y-3">
                      {profile.education?.map((edu, i) => (
                        <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                          <Input
                            placeholder="Degree"
                            value={edu.degree || ""}
                            onChange={(e) => updateEducation(i, "degree", e.target.value)}
                          />
                          <Input
                            placeholder="Institution"
                            value={edu.institution || ""}
                            onChange={(e) => updateEducation(i, "institution", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button className="w-full mt-6" size="lg" onClick={finish}>
              Launch My Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
