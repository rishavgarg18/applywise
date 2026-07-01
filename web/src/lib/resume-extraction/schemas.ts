export const CONTACT_SCHEMA = {
  type: "object",
  properties: {
    firstName: { type: "string", nullable: true },
    lastName: { type: "string", nullable: true },
    fullName: { type: "string", nullable: true },
    email: { type: "string", nullable: true },
    phone: { type: "string", nullable: true },
    alternatePhone: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    state: { type: "string", nullable: true },
    country: { type: "string", nullable: true },
    pinCode: { type: "string", nullable: true },
    linkedin: { type: "string", nullable: true },
    github: { type: "string", nullable: true },
    portfolio: { type: "string", nullable: true },
    currentDesignation: { type: "string", nullable: true },
    currentCompany: { type: "string", nullable: true },
    totalExperience: { type: "string", nullable: true },
    nationality: { type: "string", nullable: true },
  },
};

export const EXPERIENCE_SCHEMA = {
  type: "object",
  properties: {
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string", nullable: true },
          role: { type: "string", nullable: true },
          from: { type: "string", nullable: true },
          to: { type: "string", nullable: true },
          type: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
        },
      },
    },
  },
};

export const EDUCATION_SCHEMA = {
  type: "object",
  properties: {
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: { type: "string", nullable: true },
          institution: { type: "string", nullable: true },
          from: { type: "string", nullable: true },
          to: { type: "string", nullable: true },
          percentage: { type: "string", nullable: true },
          stream: { type: "string", nullable: true },
        },
      },
    },
  },
};

export const SKILLS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", nullable: true },
    primarySkills: { type: "string", nullable: true },
    secondarySkills: { type: "string", nullable: true },
    programmingLanguages: { type: "string", nullable: true },
    spokenLanguages: { type: "string", nullable: true },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          techStack: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          url: { type: "string", nullable: true },
          duration: { type: "string", nullable: true },
        },
      },
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          issuer: { type: "string", nullable: true },
          date: { type: "string", nullable: true },
          expiry: { type: "string", nullable: true },
          id: { type: "string", nullable: true },
          url: { type: "string", nullable: true },
        },
      },
    },
    achievements: {
      type: "array",
      items: { type: "string" },
    },
  },
};
