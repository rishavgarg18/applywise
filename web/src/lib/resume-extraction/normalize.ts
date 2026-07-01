import type { Education, Experience, Profile } from "../types";

const MONTHS: Record<string, string> = {
  jan: "Jan", january: "Jan",
  feb: "Feb", february: "Feb",
  mar: "Mar", march: "Mar",
  apr: "Apr", april: "Apr",
  may: "May",
  jun: "Jun", june: "Jun",
  jul: "Jul", july: "Jul",
  aug: "Aug", august: "Aug",
  sep: "Sep", sept: "Sep", september: "Sep",
  oct: "Oct", october: "Oct",
  nov: "Nov", november: "Nov",
  dec: "Dec", december: "Dec",
};

export function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^(present|current|now|ongoing)$/i.test(t)) return "Present";

  const mmYyyy = t.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (mmYyyy) {
    const m = parseInt(mmYyyy[1], 10);
    const names = Object.values(MONTHS);
    if (m >= 1 && m <= 12) return `${names[m - 1]} ${mmYyyy[2]}`;
  }

  const monYyyy = t.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monYyyy) {
    const mon = MONTHS[monYyyy[1].toLowerCase()];
    if (mon) return `${mon} ${monYyyy[2]}`;
  }

  if (/^\d{4}$/.test(t)) return t;
  return t;
}

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.length < 8) return raw.trim();
  return raw.replace(/\s+/g, " ").trim();
}

export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const u = raw.trim();
  if (!u) return null;
  return u.startsWith("http") ? u : `https://${u}`;
}

function normalizeExperience(exp: Experience): Experience {
  return {
    ...exp,
    from: normalizeDate(exp.from),
    to: normalizeDate(exp.to),
    company: exp.company?.trim() || null,
    role: exp.role?.trim() || null,
    location: exp.location?.trim() || null,
    description: exp.description?.trim() || null,
  };
}

function normalizeEducation(edu: Education): Education {
  let percentage = edu.percentage?.trim() || null;
  if (!percentage && edu.degree) {
    const cgpa = edu.degree.match(/(\d+\.?\d*)\s*(?:CGPA|GPA)/i);
    const pct = edu.degree.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
    if (cgpa) percentage = `${cgpa[1]} CGPA`;
    else if (pct) percentage = `${pct[1]}%`;
  }
  return {
    ...edu,
    degree: edu.degree?.replace(/,?\s*\d+\.?\d*\s*(?:CGPA|GPA).*/i, "").trim() || null,
    institution: edu.institution?.trim() || null,
    from: normalizeDate(edu.from),
    to: normalizeDate(edu.to),
    percentage,
    stream: edu.stream?.trim() || null,
  };
}

function computeTotalExperience(experiences: Experience[]): string | null {
  let totalMonths = 0;
  const now = new Date();

  for (const exp of experiences) {
    if (!exp.from) continue;
    const from = parseDateToMonths(exp.from);
    const to = exp.to && !/^present$/i.test(exp.to)
      ? parseDateToMonths(exp.to)
      : now.getFullYear() * 12 + now.getMonth();
    if (from != null && to != null && to >= from) {
      totalMonths += to - from;
    }
  }

  if (totalMonths <= 0) return null;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  if (months === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}+ years`;
}

function parseDateToMonths(dateStr: string): number | null {
  const yOnly = dateStr.match(/^(\d{4})$/);
  if (yOnly) return parseInt(yOnly[1], 10) * 12;

  const monYyyy = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monYyyy) {
    const mon = Object.keys(MONTHS).find(
      (k) => MONTHS[k] === MONTHS[monYyyy[1].toLowerCase()] || k === monYyyy[1].toLowerCase()
    );
    const monthIdx = mon ? Object.values(MONTHS).indexOf(MONTHS[mon]) : -1;
    if (monthIdx >= 0) return parseInt(monYyyy[2], 10) * 12 + monthIdx;
    return parseInt(monYyyy[2], 10) * 12;
  }

  const mmYyyy = dateStr.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (mmYyyy) return parseInt(mmYyyy[2], 10) * 12 + (parseInt(mmYyyy[1], 10) - 1);

  return null;
}

export function normalizeProfile(profile: Partial<Profile>): Partial<Profile> {
  const experiences = (profile.experiences || []).map(normalizeExperience);
  const education = (profile.education || []).map(normalizeEducation);

  const out: Partial<Profile> = {
    ...profile,
    email: profile.email?.trim().toLowerCase() || null,
    phone: normalizePhone(profile.phone),
    linkedin: normalizeUrl(profile.linkedin),
    github: normalizeUrl(profile.github),
    portfolio: normalizeUrl(profile.portfolio),
    fullName: profile.fullName?.trim() || null,
    firstName: profile.firstName?.trim() || null,
    lastName: profile.lastName?.trim() || null,
    primarySkills: profile.primarySkills?.replace(/\s+/g, " ").trim() || null,
    experiences,
    education,
    certifications: profile.certifications || [],
    projects: profile.projects || [],
    achievements: profile.achievements || [],
  };

  if (!out.totalExperience && experiences.length) {
    out.totalExperience = computeTotalExperience(experiences);
  }
  if (!out.currentDesignation && experiences[0]?.role) {
    out.currentDesignation = experiences[0].role;
  }
  if (!out.currentCompany && experiences[0]?.company) {
    out.currentCompany = experiences[0].company;
  }

  return out;
}
