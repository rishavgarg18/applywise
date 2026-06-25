let currentUserId = null;

const Storage = {
  KEYS: {
    AUTH_USER: 'authUser',
    PROFILE: 'profile',
    RESUME_FILENAME: 'resumeFilename',
    SETTINGS: 'settings',
    ONBOARDING_DONE: 'onboardingDone'
  },

  DEFAULT_SETTINGS: {
    highlightFilled: true,
    autoCoverLetter: false,
    provider: 'gemini',
    rulesFirst: true
  },

  DEFAULT_PROFILE: {
    firstName: null, lastName: null, fullName: null, email: null, phone: null,
    alternatePhone: null, city: null, state: null, country: null, pinCode: null,
    dateOfBirth: null, gender: null, linkedin: null, github: null, portfolio: null,
    currentDesignation: null, currentCompany: null, totalExperience: null,
    currentCTC: null, expectedCTC: null, noticePeriod: null, preferredLocations: null,
    workMode: null, summary: null, primarySkills: null, secondarySkills: null,
    programmingLanguages: null, spokenLanguages: null, fathersName: null,
    maritalStatus: null, nationality: null, category: null, differentlyAbled: null,
    permanentAddress: null, currentAddress: null,
    experiences: [], education: [], certifications: [], projects: [], achievements: []
  },

  scopedKey(key) {
    return currentUserId ? `${key}_${currentUserId}` : key;
  },

  async init() {
    const stored = await chrome.storage.local.get(this.KEYS.AUTH_USER);
    const user = stored[this.KEYS.AUTH_USER];
    if (user?.email) {
      currentUserId = user.email;
    }
  },

  async setUserId(userId) {
    currentUserId = userId;
  },

  async getAuthUser() {
    return (await chrome.storage.local.get(this.KEYS.AUTH_USER))[this.KEYS.AUTH_USER] || null;
  },

  async setAuthUser(user) {
    if (user) {
      await chrome.storage.local.set({ [this.KEYS.AUTH_USER]: user });
    } else {
      await chrome.storage.local.remove(this.KEYS.AUTH_USER);
    }
  },

  async getRemoteData() {
    return Api.getUserData();
  },

  async get(key) {
    const data = await Api.getUserData();
    switch (key) {
      case this.KEYS.PROFILE:
        return data.profile;
      case this.KEYS.SETTINGS:
        return data.settings;
      case this.KEYS.ONBOARDING_DONE:
        return data.onboardingDone;
      case this.KEYS.RESUME_FILENAME:
        return data.resumeFilename;
      default:
        return null;
    }
  },

  async set(key, value) {
    switch (key) {
      case this.KEYS.PROFILE:
        await Api.patchUserData({ profile: value });
        break;
      case this.KEYS.SETTINGS:
        await Api.patchUserData({ settings: value });
        break;
      case this.KEYS.ONBOARDING_DONE:
        await Api.patchUserData({ onboardingDone: Boolean(value) });
        break;
      case this.KEYS.RESUME_FILENAME:
        await Api.patchUserData({ resumeFilename: value });
        break;
      default:
        break;
    }
  },

  async getAll() {
    const data = await Api.getUserData();
    return {
      profile: data.profile ? { ...this.DEFAULT_PROFILE, ...data.profile } : null,
      settings: { ...this.DEFAULT_SETTINGS, ...(data.settings || {}) },
      onboardingDone: data.onboardingDone,
      resumeFilename: data.resumeFilename,
      usage: data.usage || null
    };
  },

  async getSettings() {
    const data = await Api.getUserData();
    return { ...this.DEFAULT_SETTINGS, ...(data.settings || {}) };
  },

  async getProfile() {
    const data = await Api.getUserData();
    return data.profile ? { ...this.DEFAULT_PROFILE, ...data.profile } : null;
  },

  async clearAll() {
    await Api.clearUserData();
  }
};
