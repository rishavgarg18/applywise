"use client";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import {
  JobTargetFields,
  hasJobTarget,
  type JobTargetValues,
} from "@/components/app/job-target-fields";
import { ResumePdfViewer } from "@/components/resume-pdf-viewer";
import { Card } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea, Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { tailorResumeSection } from "@/lib/gemini";
import { cn } from "@/lib/cn";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const emptyTarget: JobTargetValues = {
  jobTitle: "",
  company: "",
  jobDescription: "",
};

export default function ResumeTailorPage() {
  const { profile, setProfile, loaded } = useProfile();
  const [target, setTarget] = useState<JobTargetValues>(emptyTarget);
  const [tailoring, setTailoring] = useState<string | null>(null);
  const [tab, setTab] = useState<"pdf" | "edit">("pdf");

  const canTailor = hasJobTarget(target, { requireTitleCompany: false });

  const updateTarget = (field: keyof JobTargetValues, value: string) => {
    setTarget((prev) => ({ ...prev, [field]: value }));
  };

  const tailor = async (section: "summary" | "skills" | "experience") => {
    if (!profile || !canTailor) return;
    setTailoring(section);
    try {
      const result = await tailorResumeSection(
        profile,
        target.jobDescription.trim(),
        section
      );
      if (section === "summary") {
        await setProfile({ ...profile, summary: result });
      } else if (section === "skills") {
        await setProfile({ ...profile, primarySkills: result });
      }
    } catch {
      /* ignore */
    }
    setTailoring(null);
  };

  if (!loaded) return <PageSkeleton />;

  if (!profile) {
    return (
      <>
        <PageHeader
          title="Resume Tailor"
          description="Upload your resume to start tailoring it for specific roles."
        />
        <Card>
          <p className="text-sm text-muted mb-4">
            Complete onboarding or upload a resume in settings to unlock resume tailoring.
          </p>
          <Link href="/onboarding">
            <Button>Complete profile</Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Resume Tailor"
        description="Review your uploaded resume and tailor profile sections for a target role."
      />

      <div className="flex gap-1 mb-6 p-1 rounded-lg border border-border bg-surface2 w-fit">
        {(["pdf", "edit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            {t === "pdf" ? "Uploaded resume" : "Tailor sections"}
          </button>
        ))}
      </div>

      {tab === "pdf" && (
        <Card>
          <h3 className="font-medium mb-4">Your resume PDF</h3>
          <ResumePdfViewer />
        </Card>
      )}

      {tab === "edit" && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-medium mb-4">Target role</h3>
            <JobTargetFields
              values={target}
              onChange={updateTarget}
              showTitleAndCompany
              descriptionRows={6}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Professional summary</h3>
                <LoadingButton
                  size="sm"
                  variant="outline"
                  onClick={() => tailor("summary")}
                  loading={tailoring === "summary"}
                  loadingText="Tailoring..."
                  disabled={!canTailor || tailoring !== null}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tailor
                </LoadingButton>
              </div>
              <Textarea
                value={profile.summary || ""}
                onChange={(e) =>
                  setProfile({ ...profile, summary: e.target.value })
                }
                rows={5}
              />
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Skills</h3>
                <LoadingButton
                  size="sm"
                  variant="outline"
                  onClick={() => tailor("skills")}
                  loading={tailoring === "skills"}
                  loadingText="Tailoring..."
                  disabled={!canTailor || tailoring !== null}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tailor
                </LoadingButton>
              </div>
              <Textarea
                value={profile.primarySkills || ""}
                onChange={(e) =>
                  setProfile({ ...profile, primarySkills: e.target.value })
                }
                rows={5}
              />
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="font-medium mb-4">Experience</h3>
              {profile.experiences?.length > 0 ? (
                <div className="space-y-4">
                  {profile.experiences.map((exp, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-4 space-y-2"
                    >
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input
                          placeholder="Role"
                          value={exp.role || ""}
                          onChange={(e) => {
                            const exps = [...profile.experiences];
                            exps[i] = { ...exps[i], role: e.target.value };
                            setProfile({ ...profile, experiences: exps });
                          }}
                        />
                        <Input
                          placeholder="Company"
                          value={exp.company || ""}
                          onChange={(e) => {
                            const exps = [...profile.experiences];
                            exps[i] = { ...exps[i], company: e.target.value };
                            setProfile({ ...profile, experiences: exps });
                          }}
                        />
                      </div>
                      <Textarea
                        placeholder="Description"
                        value={exp.description || ""}
                        onChange={(e) => {
                          const exps = [...profile.experiences];
                          exps[i] = { ...exps[i], description: e.target.value };
                          setProfile({ ...profile, experiences: exps });
                        }}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No experience entries yet</p>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="font-medium mb-4">Education</h3>
              {profile.education?.length > 0 ? (
                <div className="space-y-3">
                  {profile.education.map((edu, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-center rounded-lg border border-border p-3"
                    >
                      <Input
                        placeholder="Degree"
                        value={edu.degree || ""}
                        onChange={(e) => {
                          const edus = [...profile.education];
                          edus[i] = { ...edus[i], degree: e.target.value };
                          setProfile({ ...profile, education: edus });
                        }}
                      />
                      <Input
                        placeholder="Institution"
                        value={edu.institution || ""}
                        onChange={(e) => {
                          const edus = [...profile.education];
                          edus[i] = { ...edus[i], institution: e.target.value };
                          setProfile({ ...profile, education: edus });
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No education entries yet</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
