"use client";

import { PageHeader } from "@/components/app/page-header";
import { ResumePdfViewer } from "@/components/resume-pdf-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { tailorResumeSection } from "@/lib/gemini";
import { JOB_LISTINGS } from "@/lib/jobs-data";
import { cn } from "@/lib/cn";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

export default function ResumeStudioPage() {
  const { profile, setProfile } = useProfile();
  const [selectedJob, setSelectedJob] = useState(JOB_LISTINGS[0].id);
  const [tailoring, setTailoring] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"pdf" | "edit">("pdf");

  if (!profile) {
    return (
      <PageHeader
        title="Resume Studio"
        description="Upload your resume in onboarding to get started"
      />
    );
  }

  const job = JOB_LISTINGS.find((j) => j.id === selectedJob);

  const tailor = async (section: "summary" | "skills" | "experience") => {
    if (!job) return;
    setLoading(true);
    setTailoring(section);
    try {
      const result = await tailorResumeSection(
        profile,
        job.description,
        section
      );
      if (section === "summary") {
        setProfile({ ...profile, summary: result });
      } else if (section === "skills") {
        setProfile({ ...profile, primarySkills: result });
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setTailoring(null);
  };

  return (
    <>
      <PageHeader
        title="Resume Studio"
        description="Edit and tailor your resume for specific roles"
      />

      <div className="flex gap-2 mb-6">
        {(["pdf", "edit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-accent-dim text-accent"
                : "text-muted hover:text-foreground hover:bg-surface2"
            )}
          >
            {t === "pdf" ? "Uploaded PDF" : "Edit Profile"}
          </button>
        ))}
      </div>

      {tab === "pdf" && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Your Resume PDF</h3>
          <ResumePdfViewer />
        </Card>
      )}

      {tab === "edit" && (
        <>
      <Card className="mb-6">
        <label className="text-xs text-muted uppercase tracking-wide">
          Tailor for role
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
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Professional Summary</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => tailor("summary")}
              disabled={loading}
            >
              {loading && tailoring === "summary" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Tailor
            </Button>
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
            <h3 className="font-semibold">Skills</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => tailor("skills")}
              disabled={loading}
            >
              {loading && tailoring === "skills" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Tailor
            </Button>
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
          <h3 className="font-semibold mb-4">Experience</h3>
          {profile.experiences?.length > 0 ? (
            <div className="space-y-4">
              {profile.experiences.map((exp, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border p-4 space-y-2"
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
          <h3 className="font-semibold mb-4">Education</h3>
          {profile.education?.length > 0 ? (
            <div className="space-y-3">
              {profile.education.map((edu, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-center rounded-xl border border-border p-3"
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
        </>
      )}
    </>
  );
}
