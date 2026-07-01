export const CONTACT_PROMPT = `Extract contact and identity information from this resume.
Return ONLY valid JSON matching the schema. Use null for missing fields.

Rules:
- fullName: candidate's full name from the header
- Split firstName and lastName when possible
- email, phone: exact values from resume
- city, state, country: from address line if present
- linkedin, github, portfolio: full URLs
- currentDesignation, currentCompany: most recent job
- totalExperience: e.g. "5 years" if stated on resume
- Indian resumes: extract pinCode, nationality when present`;

export const EXPERIENCE_PROMPT = `Extract ALL work experience from this resume into the experiences array.
Return ONLY valid JSON with an "experiences" key.

Rules:
- Include EVERY job: full-time, part-time, internships, freelance, contracts
- Preserve bullet-point descriptions joined as a single description string
- Dates: use "Mon YYYY" format (e.g. "Jan 2020") or "Present" for current roles
- Also accept "01/2020", "2020" formats — normalize to Mon YYYY when possible
- Indian formats: "Designation at Company, City", company on line above role
- Order: most recent first
- Do not skip any employment entry`;

export const EDUCATION_PROMPT = `Extract ALL education entries from this resume into the education array.
Return ONLY valid JSON with an "education" key.

Rules:
- Include degrees: B.Tech, B.E., M.Tech, MBA, B.Sc, M.Sc, Ph.D, Diploma, 12th, 10th
- institution: college/university/school name
- percentage field: store CGPA (e.g. "8.5 CGPA"), GPA, or percentage (e.g. "72%")
- stream: branch/major when present (e.g. "Computer Science")
- Dates: from/to years or Mon YYYY
- Indian formats: "Academic Details", degree on one line, institution on next`;

export const SKILLS_PROMPT = `Extract skills, projects, certifications, summary, and achievements from this resume.
Return ONLY valid JSON matching the schema.

Rules:
- primarySkills: comma-separated main technical/professional skills
- programmingLanguages: languages only, comma-separated
- secondarySkills: soft skills or secondary tech
- summary: professional summary/objective paragraph
- projects: name, techStack, description, url, duration
- certifications: name, issuer, date
- achievements: array of achievement strings
- Do not invent information not in the resume`;
