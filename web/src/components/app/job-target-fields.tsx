import { FormField } from "@/components/app/form-field";
import { Input, Textarea } from "@/components/ui/input";

export type JobTargetValues = {
  jobTitle: string;
  company: string;
  jobDescription: string;
};

type JobTargetFieldsProps = {
  values: JobTargetValues;
  onChange: (field: keyof JobTargetValues, value: string) => void;
  showTitleAndCompany?: boolean;
  descriptionRows?: number;
};

export function JobTargetFields({
  values,
  onChange,
  showTitleAndCompany = true,
  descriptionRows = 8,
}: JobTargetFieldsProps) {
  return (
    <div className="space-y-4">
      {showTitleAndCompany && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Job title" required>
            <Input
              value={values.jobTitle}
              onChange={(e) => onChange("jobTitle", e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </FormField>
          <FormField label="Company" required>
            <Input
              value={values.company}
              onChange={(e) => onChange("company", e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </FormField>
        </div>
      )}
      <FormField
        label="Job description"
        hint="Paste the full job posting or key requirements you want to target."
        required
      >
        <Textarea
          value={values.jobDescription}
          onChange={(e) => onChange("jobDescription", e.target.value)}
          placeholder="Paste the job description, responsibilities, and required skills..."
          rows={descriptionRows}
        />
      </FormField>
    </div>
  );
}

export function hasJobTarget(
  values: JobTargetValues,
  options?: { requireTitleCompany?: boolean }
) {
  const requireTitleCompany = options?.requireTitleCompany ?? true;
  if (!values.jobDescription.trim()) return false;
  if (requireTitleCompany) {
    return Boolean(values.jobTitle.trim() && values.company.trim());
  }
  return true;
}
