const SECTION_HEADERS = {
  summary: [/professional summary/i, /^summary$/i, /^about(\s+me)?$/i, /^profile$/i],
  skills: [/technical skills/i, /^skills$/i, /core competencies/i, /technologies/i],
  experience: [/professional experience/i, /work experience/i, /^experience$/i, /employment history/i],
  education: [/^education$/i, /academic background/i, /qualifications/i],
  projects: [/^projects$/i, /personal projects/i, /key projects/i],
  certifications: [/certifications?/i, /licenses?/i]
};

const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const DATE_RANGE = new RegExp(
  `(${MONTH}\\s+\\d{4}|\\d{4})\\s*[-–—]\\s*(Present|${MONTH}\\s+\\d{4}|\\d{4})`,
  'i'
);

function normalizeUrl(url) {
  if (!url) return null;
  const u = url.trim();
  return u.startsWith('http') ? u : `https://${u}`;
}

function isSectionHeader(line) {
  const t = line.trim();
  return Object.values(SECTION_HEADERS).some((patterns) =>
    patterns.some((p) => p.test(t))
  );
}

function parseSections(lines) {
  const sections = {};
  let current = '_header';
  const buckets = { _header: [] };

  for (const line of lines) {
    let matched = null;
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

  for (const [key, arr] of Object.entries(buckets)) {
    if (key !== '_header') sections[key] = arr.join('\n');
  }
  return { header: buckets._header, sections };
}

function splitCompanyLocation(line) {
  if (!line) return { company: null, location: null };
  const cleaned = line.replace(/\s+/g, ' ').trim();

  const merged = cleaned.match(
    /^(.+?(?:Limited|Ltd\.?|Inc\.?|LLC|Technologies|Technology|Services|Corp\.?|Company|Group))([A-Z][a-z].+)$/
  );
  if (merged) {
    return { company: merged[1].trim(), location: merged[2].trim() };
  }

  const commaParts = cleaned.split(/,\s*/);
  if (commaParts.length >= 2) {
    const location = commaParts.slice(-2).join(', ');
    const company = commaParts.slice(0, -2).join(', ') || commaParts[0];
    if (commaParts.length === 2 && commaParts[1].length < 30) {
      return { company: commaParts[0].trim(), location: commaParts[1].trim() };
    }
    return { company: company.trim(), location };
  }

  return { company: cleaned, location: null };
}

function parseExperiences(text) {
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const experiences = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const combined = line.match(
      new RegExp(`^(.+?)\\s*[–—-]\\s*(.+?)\\s+${DATE_RANGE.source}`, 'i')
    );
    if (combined) {
      const description = [];
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j];
        if (DATE_RANGE.test(next) && /[–—-]/.test(next)) break;
        if (isSectionHeader(next)) break;
        if (/^[•\-\*●]/.test(next)) {
          description.push(next.replace(/^[•\-\*●]\s*/, ''));
        }
      }
      experiences.push({
        company: combined[2].trim(),
        role: combined[1].trim(),
        from: combined[3],
        to: combined[4],
        type: null,
        location: null,
        description: description.join(' ').trim() || null
      });
      continue;
    }

    const roleDate = line.match(
      new RegExp(`^(.+?)\\s+${DATE_RANGE.source}$`, 'i')
    );
    if (!roleDate) continue;

    const prev = i > 0 ? lines[i - 1] : '';
    const { company, location } = splitCompanyLocation(prev);
    const description = [];

    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j];
      if (DATE_RANGE.test(next) && next.match(new RegExp(`^.+\\s+${DATE_RANGE.source}$`, 'i'))) break;
      if (isSectionHeader(next)) break;
      if (/^[•\-\*●]/.test(next)) {
        description.push(next.replace(/^[•\-\*●]\s*/, ''));
      } else if (description.length && next.length > 20) {
        description[description.length - 1] += ' ' + next;
      }
    }

    experiences.push({
      company: company || null,
      role: roleDate[1].trim(),
      from: roleDate[2],
      to: roleDate[3],
      type: null,
      location,
      description: description.join(' ').trim() || null
    });
  }

  return experiences;
}

function parseEducation(text) {
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const degreeMatch = line.match(
      /(B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E\.?|M\.?\s*E\.?|MBA|B\.?\s*Sc|B\.?\s*Com|B\.?\s*A|Ph\.?\s*D|Diploma)[^–—-]*/i
    );
    if (!degreeMatch) continue;

    const yearMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
    const cgpaMatch = line.match(/(\d+\.?\d*)\s*(?:CGPA|GPA|%)/i);

    let institution = null;
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      if (/institution|university|college|institute|group of/i.test(lines[j]) || lines[j].length > 8) {
        institution = lines[j].replace(/\d+\.?\d*\s*(?:CGPA|GPA).*/i, '').trim();
        break;
      }
    }
    if (!institution && i + 1 < lines.length && !DATE_RANGE.test(lines[i + 1])) {
      institution = lines[i + 1].replace(/\d+\.?\d*\s*(?:CGPA|GPA).*/i, '').trim();
    }

    entries.push({
      degree: degreeMatch[0].trim(),
      institution,
      from: yearMatch?.[1] || null,
      to: yearMatch?.[2] || null,
      percentage: cgpaMatch ? `${cgpaMatch[1]} CGPA` : null,
      stream: null
    });
  }

  return entries;
}

function parseProjects(text) {
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const projects = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 4 || /^[•\-\*]/.test(line)) continue;
    if (DATE_RANGE.test(line)) continue;

    const desc = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^[•\-\*●]/.test(lines[j])) {
        desc.push(lines[j].replace(/^[•\-\*●]\s*/, ''));
      } else if (desc.length === 0 && lines[j].length > 15) {
        desc.push(lines[j]);
      } else if (desc.length > 0) {
        break;
      }
    }

    if (desc.length || line.length > 10) {
      projects.push({
        name: line,
        techStack: null,
        description: desc.join(' ').trim() || null,
        url: null,
        duration: null
      });
    }
  }

  return projects.slice(0, 8);
}

function cleanSkillsText(text) {
  if (!text) return null;
  return text
    .replace(/\n/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim() || null;
}

function extractProfileFromText(resumeText) {
  const text = (resumeText || '').replace(/\r/g, '');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/i)?.[0] || null;
  const phone = text.match(/(?:\+?\d{1,3}[-.\s]?)?\d{5,}[\d\s-]{4,}/)?.[0]?.replace(/\s+/g, ' ').trim() || null;
  const linkedin = normalizeUrl(text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0]);
  const github = normalizeUrl(text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0]);

  let fullName = null;
  for (const line of lines.slice(0, 8)) {
    if (isSectionHeader(line)) continue;
    if (line.includes('@') || /linkedin|github|http/i.test(line)) continue;
    if (/^\+?\d[\d\s\-()]{7,}/.test(line)) continue;
    if (line.includes(',') && line.length < 40) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 5 && line.length < 50 && /^[A-Za-z]/.test(line)) {
      fullName = line;
      break;
    }
  }

  const nameParts = fullName ? fullName.split(/\s+/) : [];
  let city = null;
  let state = null;
  let country = null;

  for (const line of lines.slice(0, 12)) {
    if (line.includes('@') || /linkedin|github/i.test(line)) continue;
    const parts = line.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.length < 40 && !p.includes('@'))) {
      city = parts[0];
      if (parts.length === 2) country = parts[1];
      else { state = parts[1]; country = parts[2] || parts[parts.length - 1]; }
      break;
    }
  }

  const { sections } = parseSections(lines);
  const experiences = parseExperiences(sections.experience);
  const education = parseEducation(sections.education);
  const projects = parseProjects(sections.projects);
  const summary = sections.summary?.replace(/\s+/g, ' ').trim() || null;
  const primarySkills = cleanSkillsText(sections.skills);

  const expYears = text.match(/(\d+\+?)\s*years?\s+(?:of\s+)?experience/i);
  const programmingMatch = primarySkills?.match(/(?:Programming|Languages)[^:]*:([^,\n]+)/i);

  return {
    firstName: nameParts[0] || null,
    lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : null,
    fullName,
    email,
    phone,
    city,
    state,
    country,
    linkedin,
    github,
    currentDesignation: experiences[0]?.role || null,
    currentCompany: experiences[0]?.company || null,
    totalExperience: expYears ? `${expYears[1]} years` : null,
    summary,
    primarySkills,
    programmingLanguages: programmingMatch?.[1]?.trim() || null,
    experiences,
    education,
    certifications: [],
    projects,
    achievements: []
  };
}

function profileHasContent(profile) {
  if (!profile) return false;
  const hasContact = profile.fullName && (profile.email || profile.phone);
  const hasExp = (profile.experiences || []).some(
    (e) => e.company && e.role && !/^[•\-\*●]\s/.test((e.company || '').trim())
  );
  const hasEdu = (profile.education || []).some((e) => e.degree || e.institution);
  const hasSkills = profile.primarySkills && profile.primarySkills.length >= 8;
  return !!(hasContact && (hasExp || hasEdu || hasSkills));
}
