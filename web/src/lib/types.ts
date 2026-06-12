export interface Experience {
  company: string | null;
  role: string | null;
  from: string | null;
  to: string | null;
  type: string | null;
  location: string | null;
  description: string | null;
}

export interface Education {
  degree: string | null;
  institution: string | null;
  from: string | null;
  to: string | null;
  percentage: string | null;
  stream: string | null;
}

export interface Certification {
  name: string | null;
  issuer: string | null;
  date: string | null;
  expiry: string | null;
  id: string | null;
  url: string | null;
}

export interface Project {
  name: string | null;
  techStack: string | null;
  description: string | null;
  url: string | null;
  duration: string | null;
}

export interface Profile {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  currentDesignation: string | null;
  currentCompany: string | null;
  totalExperience: string | null;
  currentCTC: string | null;
  expectedCTC: string | null;
  noticePeriod: string | null;
  preferredLocations: string | null;
  workMode: string | null;
  summary: string | null;
  primarySkills: string | null;
  secondarySkills: string | null;
  programmingLanguages: string | null;
  spokenLanguages: string | null;
  fathersName: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  category: string | null;
  differentlyAbled: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  achievements: string[];
}

export interface Settings {
  highlightFilled: boolean;
  autoCoverLetter: boolean;
  provider: string;
  rulesFirst: boolean;
  preferredWorkMode: string;
  minSalary: string;
  targetRoles: string;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface TrackedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  description: string;
  status: ApplicationStatus;
  matchScore: number;
  savedAt: string;
  appliedAt?: string;
  notes?: string;
}

export interface JobPreferences {
  roles: string[];
  locations: string[];
  workMode: string;
  minSalary: string;
  dealbreakers: string[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  remote: boolean;
  description: string;
  skills: string[];
  postedAt: string;
  logo: string;
  url: string;
}

export interface JobList {
  id: string;
  title: string;
  description: string;
  icon: string;
  jobIds: string[];
}

export type UserDataBundle = {
  profile: Profile | null;
  settings: Settings;
  preferences: JobPreferences;
  trackedJobs: TrackedJob[];
  savedMatches: string[];
  resumeFilename: string | null;
  resumePdfBase64: string | null;
  onboardingDone: boolean;
};

export interface ContactSuggestion {
  id: string;
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  relevance: number;
  location?: string;
}
