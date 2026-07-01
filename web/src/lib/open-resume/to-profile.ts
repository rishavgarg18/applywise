import type { Experience, Profile } from "../types";
import type { Resume } from "./resume-types";
import {
  normalizeDate,
  normalizePhone,
  normalizeUrl,
} from "../resume-extraction/normalize";

function splitDateRange(date: string): { from: string | null; to: string | null } {
  if (!date?.trim()) return { from: null, to: null };
  const parts = date.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    return {
      from: normalizeDate(parts[0].trim()),
      to: normalizeDate(parts[parts.length - 1].trim()),
    };
  }
  return { from: normalizeDate(date.trim()), to: null };
}

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
]);

function parseLocation(location: string): {
  city: string | null;
  state: string | null;
  country: string | null;
} {
  if (!location?.trim()) {
    return { city: null, state: null, country: null };
  }
  const parts = location.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) return { city: parts[0], state: null, country: null };
  if (parts.length === 2) {
    if (US_STATES.has(parts[1].toUpperCase())) {
      return { city: parts[0], state: parts[1], country: null };
    }
    return { city: parts[0], state: null, country: parts[1] };
  }
  return {
    city: parts[0],
    state: parts[1],
    country: parts[parts.length - 1],
  };
}

function splitName(fullName: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

import { isBulletLine, stripBullet } from "./text-utils";

function splitRoleCompany(
  combined: string
): { role: string; company: string } | null {
  const trimmed = combined.trim();
  const dashMatch = trimmed.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    const role = dashMatch[1].trim();
    const company = dashMatch[2].trim();
    if (
      role.length > 0 &&
      role.length < 80 &&
      company.length > 0 &&
      company.length < 80 &&
      !isBulletLine(company) &&
      !/^\d{4}/.test(company)
    ) {
      return { role, company };
    }
  }
  const atMatch = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return { role: atMatch[1].trim(), company: atMatch[2].trim() };
  }
  return null;
}

/** Fix common OpenResume misassignments (bullets → company, merged role/company). */
function sanitizeExperience(exp: Experience): Experience {
  let company = exp.company?.trim() || null;
  let role = exp.role?.trim() || null;
  let description = exp.description?.trim() || null;

  if (company && isBulletLine(company)) {
    const bullet = stripBullet(company);
    description = description ? `${description} ${bullet}` : bullet;
    company = null;
  }

  if (role) {
    const split = splitRoleCompany(role);
    if (split) {
      role = split.role;
      if (!company || isBulletLine(company)) {
        company = split.company;
      }
    }
  }

  if (company && isBulletLine(company)) {
    const bullet = stripBullet(company);
    description = description ? `${description} ${bullet}` : bullet;
    company = null;
  }

  return {
    ...exp,
    company,
    role,
    description: description || null,
  };
}

function parseDegreeFields(degree: string): {
  degree: string | null;
  percentage: string | null;
} {
  if (!degree?.trim()) return { degree: null, percentage: null };
  const cgpa = degree.match(/(\d+\.?\d*)\s*(?:CGPA|GPA)/i);
  const pct = degree.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
  const clean = degree
    .replace(/,?\s*\d+\.?\d*\s*(?:CGPA|GPA).*/i, "")
    .replace(/,?\s*\d{1,3}(?:\.\d+)?\s*%.*/i, "")
    .trim();
  return {
    degree: clean || degree.trim(),
    percentage: cgpa
      ? `${cgpa[1]} CGPA`
      : pct
        ? `${pct[1]}%`
        : null,
  };
}

/** Map OpenResume Resume → Applywise Profile */
export function openResumeToProfile(resume: Resume): Partial<Profile> {
  const { profile, workExperiences, educations, projects, skills } = resume;
  const nameParts = splitName(profile.name || "");
  const loc = parseLocation(profile.location || "");

  const experiences = workExperiences
    .filter((w) => w.company || w.jobTitle)
    .map((w) => {
      const { from, to } = splitDateRange(w.date);
      const raw: Experience = {
        company: w.company?.trim() || null,
        role: w.jobTitle?.trim() || null,
        from,
        to,
        type: null,
        location: null,
        description: w.descriptions?.join(" ").trim() || null,
      };
      return sanitizeExperience(raw);
    })
    .filter((e) => e.role && e.company);

  const education = educations
    .filter((e) => e.school || e.degree)
    .map((e) => {
      const { from, to } = splitDateRange(e.date);
      const parsed = parseDegreeFields(e.degree || "");
      return {
        degree: parsed.degree,
        institution: e.school?.trim() || null,
        from,
        to,
        percentage: e.gpa?.trim() || parsed.percentage,
        stream: null,
      };
    });

  const mappedProjects = projects
    .filter((p) => p.project)
    .map((p) => ({
      name: p.project?.trim() || null,
      techStack: null,
      description: p.descriptions?.join(" ").trim() || null,
      url: null,
      duration: p.date?.trim() || null,
    }));

  const featured = skills.featuredSkills
    .map((s) => s.skill?.trim())
    .filter(Boolean);
  const skillBullets = skills.descriptions?.join(", ") || "";
  const primarySkills =
    [...featured, skillBullets].filter(Boolean).join(", ").trim() || null;

  const url = profile.url?.trim() || "";
  const linkedin = /linkedin/i.test(url) ? normalizeUrl(url) : null;
  const github = /github/i.test(url) ? normalizeUrl(url) : null;
  const portfolio =
    url && !linkedin && !github ? normalizeUrl(url) : null;

  return {
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    fullName: profile.name?.trim() || null,
    email: profile.email?.trim().toLowerCase() || null,
    phone: normalizePhone(profile.phone),
    linkedin,
    github,
    portfolio,
    city: loc.city,
    state: loc.state,
    country: loc.country,
    summary: profile.summary?.trim() || null,
    currentDesignation: experiences[0]?.role || null,
    currentCompany: experiences[0]?.company || null,
    primarySkills,
    experiences,
    education,
    projects: mappedProjects,
    certifications: [],
    achievements: [],
  };
}
