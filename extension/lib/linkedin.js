function buildLinkedInPeopleSearchUrl(company, role) {
  const keywords = [role, company].filter(Boolean).join(' ');
  const params = new URLSearchParams({
    keywords: keywords || 'hiring manager',
    origin: 'GLOBAL_SEARCH_HEADER'
  });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

function buildLinkedInCompanyPeopleUrl(company) {
  const q = encodeURIComponent(company || '');
  return `https://www.linkedin.com/search/results/people/?keywords=${q}&origin=GLOBAL_SEARCH_HEADER`;
}

function seniorTitleKeywords(role) {
  if (!role) return ['Manager', 'Lead', 'Director', 'Head', 'Senior'];
  const base = role.replace(/\s+(I{1,3}|1|2|3|IV|4|V|5)\b/gi, '').trim();
  return [
    `Senior ${base}`,
    `Lead ${base}`,
    `${base} Manager`,
    `Head of ${base.split(' ').slice(-1)[0] || base}`,
    'Engineering Manager',
    'Hiring Manager',
    'Talent Acquisition',
    'Recruiter'
  ];
}

function scorePersonForReferral(person, company, role) {
  const hay = `${person.title || ''} ${person.name || ''}`.toLowerCase();
  const companyL = (company || '').toLowerCase();
  const roleL = (role || '').toLowerCase();
  let score = 0;
  if (companyL && hay.includes(companyL.split(' ')[0])) score += 3;
  if (roleL) {
    const roleWords = roleL.split(/\s+/).filter((w) => w.length > 3);
    roleWords.forEach((w) => { if (hay.includes(w)) score += 2; });
  }
  if (/manager|lead|head|director|vp|recruiter|talent|hiring/i.test(hay)) score += 2;
  if (/senior|sr\.?/i.test(hay) && roleL) score += 1;
  return score;
}

function rankLinkedInPeople(people, company, role) {
  return [...people]
    .map((p) => ({ ...p, score: scorePersonForReferral(p, company, role) }))
    .sort((a, b) => b.score - a.score);
}
