import type { Profile } from "./types";

const SECTION_HEADERS = {
  summary: [/professional summary/i, /^summary$/i, /^about(\s+me)?$/i, /^profile$/i],
  skills: [
    /technical skills/i,
    /^skills$/i,
    /core competencies/i,
    /technologies/i,
    /technical proficiency/i,
    /core skills/i,
    /key skills/i,
  ],
  experience: [
    /professional experience/i,
    /work experience/i,
    /^experience$/i,
    /employment history/i,
    /career history/i,
    /^employment$/i,
    /professional background/i,
  ],
  education: [
    /^education$/i,
    /academic background/i,
    /academic details/i,
    /educational qualification/i,
    /qualifications/i,
  ],
  projects: [/^projects$/i, /personal projects/i, /key projects/i],
  certifications: [/certifications?/i, /licenses?/i],
};

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DATE_END = new RegExp(
  `(${MONTH}\\s+\\d{4}|\\d{4})\\s*[-–—]\\s*(Present|${MONTH}\\s+\\d{4}|\\d{4})\\s*$`,
  "i"
);

function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  return u.startsWith("http") ? u : `https://${u}`;
}

function isSectionHeader(line: string) {
  return Object.values(SECTION_HEADERS).some((patterns) =>
    patterns.some((p) => p.test(line.trim()))
  );
}

function parseSections(lines: string[]) {
  const buckets: Record<string, string[]> = { _header: [] };
  let current = "_header";

  for (const line of lines) {
    let matched: string | null = null;
    for (const [key, patterns] of Object.entries(SECTION_HEADERS)) {
      if (patterns.some((p) => p.test(line.trim()))) {
        matched = key;
        break;
      }
    }
    if (matched) {
      current = matched;
      if (!buckets[current]) buckets[current] = [];
      continue;
    }
    if (!buckets[current]) buckets[current] = [];
    buckets[current].push(line);
  }

  const sections: Record<string, string> = {};
  for (const [key, arr] of Object.entries(buckets)) {
    if (key !== "_header") sections[key] = arr.join("\n");
  }
  return sections;
}

function splitCompanyLocation(line: string) {
  if (!line) return { company: null as string | null, location: null as string | null };
  const cleaned = line.replace(/\s+/g, " ").trim();

  const merged = cleaned.match(
    /^(.+?(?:Limited|Ltd\.?|Inc\.?|LLC|Technologies|Technology|Services|Corp\.?|Company|Group))([A-Z][a-z].+)$/
  );
  if (merged) {
    return { company: merged[1].trim(), location: merged[2].trim() };
  }

  const commaParts = cleaned.split(/,\s*/);
  if (commaParts.length >= 2) {
    if (commaParts.length === 2 && commaParts[1].length < 30) {
      return { company: commaParts[0].trim(), location: commaParts[1].trim() };
    }
    const location = commaParts.slice(-2).join(", ");
    const company = commaParts.slice(0, -2).join(", ") || commaParts[0];
    return { company: company.trim(), location };
  }

  return { company: cleaned, location: null };
}

function parseExperiences(text: string) {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const experiences: Profile["experiences"] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const combined = line.match(
      new RegExp(`^(.+?)\\s*[–—-]\\s*(.+?)\\s+${DATE_END.source}`, "i")
    );
    if (combined) {
      const description: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j];
        if (DATE_END.test(next) && /[–—-]/.test(next)) break;
        if (isSectionHeader(next)) break;
        if (/^[•\-\*●]/.test(next)) {
          description.push(next.replace(/^[•\-\*●]\s*/, ""));
        }
      }
      experiences.push({
        company: combined[2].trim(),
        role: combined[1].trim(),
        from: combined[3],
        to: combined[4],
        type: null,
        location: null,
        description: description.join(" ").trim() || null,
      });
      continue;
    }

    const roleDate = line.match(
      new RegExp(`^(.+?)\\s+${DATE_END.source}$`, "i")
    );
    if (!roleDate) continue;

    const prev = i > 0 ? lines[i - 1] : "";
    const { company, location } = splitCompanyLocation(prev);
    const description: string[] = [];

    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j];
      if (DATE_END.test(next) && /[–—-]/.test(next)) break;
      if (isSectionHeader(next)) break;
      if (/^[•\-\*●]/.test(next)) {
        description.push(next.replace(/^[•\-\*●]\s*/, ""));
      } else if (description.length && next.length > 20) {
        description[description.length - 1] += " " + next;
      }
    }

    experiences.push({
      company: company || null,
      role: roleDate[1].trim(),
      from: roleDate[2],
      to: roleDate[3],
      type: null,
      location,
      description: description.join(" ").trim() || null,
    });
  }

  return experiences;
}

function parseEducation(text: string) {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const entries: Profile["education"] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const degreeMatch = line.match(
      /(B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E\.?|M\.?\s*E\.?|MBA|B\.?\s*Sc|B\.?\s*Com|B\.?\s*A|Ph\.?\s*D|Diploma|12th|10th|XII|X)[^–—-]*/i
    );

    const yearOnLine = line.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
    const cgpaMatch = line.match(/(\d+\.?\d*)\s*(?:CGPA|GPA|%)/i);

    if (degreeMatch) {
      let institution: string | null = null;
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (
          /institution|university|college|institute|group of/i.test(lines[j]) ||
          (lines[j].length > 8 && !DATE_END.test(lines[j]))
        ) {
          institution = lines[j]
            .replace(/\d+\.?\d*\s*(?:CGPA|GPA).*/i, "")
            .trim();
          break;
        }
      }
      const prev = i > 0 ? lines[i - 1] : "";
      if (!institution && /college|university|institute|school/i.test(prev)) {
        institution = prev.replace(/\s+\w{3}\s+\d{4}\s*[-–—].*/i, "").trim();
      }

      entries.push({
        degree: degreeMatch[0].replace(/,?\s*CGPA.*/i, "").trim(),
        institution,
        from: yearOnLine?.[1] || null,
        to: yearOnLine?.[2] || null,
        percentage: cgpaMatch ? `${cgpaMatch[1]} CGPA` : null,
        stream: null,
      });
      continue;
    }

    if (yearOnLine && /college|university|institute/i.test(line)) {
      const next = lines[i + 1] || "";
      const nextDegree = next.match(
        /(B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E\.?|MBA|B\.?\s*Sc|Diploma)[^–—-]*/i
      );
      const nextCgpa = next.match(/(\d+\.?\d*)\s*(?:CGPA|GPA)/i);
      if (nextDegree) {
        entries.push({
          degree: nextDegree[0].replace(/,?\s*CGPA.*/i, "").trim(),
          institution: line.replace(/\s+\w{3}\s+\d{4}\s*[-–—].*/i, "").trim(),
          from: yearOnLine[1],
          to: yearOnLine[2],
          percentage: nextCgpa ? `${nextCgpa[1]} CGPA` : null,
          stream: null,
        });
      }
    }
  }

  return entries;
}

function parseProjects(text: string) {
  if (!text) return [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const projects: Profile["projects"] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isSectionHeader(line)) break;
    if (line.length < 4 || /^[•\-\*]/.test(line)) continue;
    if (DATE_END.test(line)) continue;

    const isNumbered = /^\d+\.\s/.test(line);
    const isTitle =
      line.length > 10 &&
      /^[A-Z0-9]/.test(line) &&
      !/^Tech:/i.test(line);

    if (!isNumbered && !isTitle) continue;

    const name = line.replace(/^\d+\.\s*/, "");
    const desc: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^[•\-\*●]/.test(lines[j])) {
        desc.push(lines[j].replace(/^[•\-\*●]\s*/, ""));
      } else if (desc.length === 0 && lines[j].length > 15) {
        desc.push(lines[j]);
      } else if (desc.length > 0) break;
    }
    projects.push({
      name,
      techStack: null,
      description: desc.join(" ").trim() || null,
      url: null,
      duration: null,
    });
  }

  return projects.slice(0, 8);
}

function cleanSkillsText(text: string | undefined): string | null {
  if (!text) return null;
  return (
    text
      .replace(/\n/g, ", ")
      .replace(/\s+/g, " ")
      .replace(/,\s*,/g, ",")
      .trim() || null
  );
}

export function parseResumeText(resumeText: string): Partial<Profile> {
  const text = resumeText.replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/i)?.[0] || null;
  const phone =
    text.match(/(?:\+?\d{1,3}[-.\s]?)?\d{5,}[\d\s-]{4,}/)?.[0]?.replace(/\s+/g, " ").trim() ||
    null;
  const linkedin = normalizeUrl(
    text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0]
  );
  const github = normalizeUrl(
    text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0]
  );

  let fullName: string | null = null;
  for (const line of lines.slice(0, 8)) {
    if (isSectionHeader(line)) continue;
    if (line.includes("@") || /linkedin|github|http/i.test(line)) continue;
    if (/^\+?\d[\d\s\-()]{7,}/.test(line)) continue;
    if (line.includes(",") && line.length < 40) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 5 && line.length < 50 && /^[A-Za-z]/.test(line)) {
      fullName = line;
      break;
    }
  }

  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const sections = parseSections(lines);

  let city: string | null = null;
  let state: string | null = null;
  let country: string | null = null;
  for (const line of lines.slice(0, 12)) {
    if (line.includes("@") || /linkedin|github/i.test(line)) continue;
    const parts = line.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.length < 40 && !p.includes("@"))) {
      city = parts[0];
      if (parts.length === 2) country = parts[1];
      else {
        state = parts[1];
        country = parts[2] || parts[parts.length - 1];
      }
      break;
    }
  }

  const experiences = parseExperiences(sections.experience || "");
  const education = parseEducation(sections.education || "");
  const projects = parseProjects(sections.projects || "");
  const primarySkills = cleanSkillsText(sections.skills);
  const expYears = text.match(/(\d+\+?)\s*years?\s+(?:of\s+)?experience/i);
  const programmingMatch = primarySkills?.match(
    /(?:Programming|Languages)[^:]*:([^,\n]+)/i
  );

  return {
    firstName: nameParts[0] || null,
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
    fullName,
    email,
    phone,
    linkedin,
    github,
    city,
    state,
    country,
    currentDesignation: experiences[0]?.role || null,
    currentCompany: experiences[0]?.company || null,
    totalExperience: expYears ? `${expYears[1]} years` : null,
    summary: sections.summary?.replace(/\s+/g, " ").trim() || null,
    primarySkills,
    programmingLanguages: programmingMatch?.[1]?.trim() || null,
    experiences,
    education,
    projects,
    certifications: [],
    achievements: [],
  };
}
