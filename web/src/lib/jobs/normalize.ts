import type { JobListing } from "../types";
import type { AdzunaJob } from "./adzuna";

const SKILL_KEYWORDS = [
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Next.js",
  "Angular",
  "Vue",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Go",
  "Rust",
  "C++",
  "C#",
  ".NET",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "Flutter",
  "Machine Learning",
  "Data Science",
  "DevOps",
  "Product Management",
  "UI/UX",
  "Figma",
  "Salesforce",
  "SAP",
  "Excel",
  "Power BI",
  "Tableau",
];

function formatSalary(min?: number, max?: number, country = "in"): string {
  if (!min && !max) return "Not disclosed";
  const symbol = country === "in" ? "₹" : "$";
  const fmt = (n: number) =>
    country === "in"
      ? n >= 100000
        ? `${(n / 100000).toFixed(1)}L`
        : n.toLocaleString("en-IN")
      : n.toLocaleString("en-US");

  if (min && max) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)}`;
  if (min) return `${symbol}${fmt(min)}+`;
  return `Up to ${symbol}${fmt(max!)}`;
}

function relativePostedAt(iso: string): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "Recently";

  const days = Math.floor((Date.now() - created.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function inferJobType(job: AdzunaJob): string {
  const title = job.title.toLowerCase();
  if (title.includes("intern")) return "Internship";
  if (
    title.includes("graduate") ||
    title.includes("fresher") ||
    title.includes("entry level") ||
    title.includes("new grad")
  ) {
    return "New Grad";
  }
  if (job.contract_type?.toLowerCase().includes("contract")) {
    return "Contract";
  }
  return "Full-time";
}

function isRemoteJob(job: AdzunaJob): boolean {
  const location = job.location?.display_name?.toLowerCase() || "";
  const text = `${job.title} ${job.description}`.toLowerCase();
  return (
    location.includes("remote") ||
    text.includes("work from home") ||
    text.includes("remote work") ||
    text.includes("wfh")
  );
}

function extractSkills(job: AdzunaJob): string[] {
  const haystack = `${job.title} ${job.description} ${job.category?.label || ""}`;
  const lower = haystack.toLowerCase();
  const skills = SKILL_KEYWORDS.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );
  if (job.category?.label && !skills.includes(job.category.label)) {
    skills.unshift(job.category.label);
  }
  return [...new Set(skills)].slice(0, 6);
}

function companyLogo(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function adzunaJobToListing(
  job: AdzunaJob,
  country: string
): JobListing {
  const company = job.company?.display_name?.trim() || "Company";
  const location = job.location?.display_name?.trim() || "India";
  const description = stripHtml(job.description || "").slice(0, 500);

  return {
    id: `adzuna-${job.id}`,
    title: job.title.trim(),
    company,
    location,
    salary: formatSalary(job.salary_min, job.salary_max, country),
    type: inferJobType(job),
    remote: isRemoteJob(job),
    description: description || job.title,
    skills: extractSkills(job),
    postedAt: relativePostedAt(job.created),
    logo: companyLogo(company),
    url: job.redirect_url,
    source: "adzuna",
  };
}
