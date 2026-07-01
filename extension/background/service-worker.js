importScripts(
  '../lib/config.js',
  '../lib/api.js',
  '../lib/parse-json.js',
  '../lib/storage.js',
  '../lib/auth.js',
  '../lib/text-extract.js',
  '../lib/fallback.js',
  '../lib/linkedin.js',
  '../lib/linkedin-import.js',
  '../lib/ai.js'
);

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Applywise] OAuth redirect URI:', chrome.identity.getRedirectURL());
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({
      success: false,
      error: err.message,
      code: err.code,
      action: err.action,
      resetAt: err.resetAt,
      credits: err.credits
    });
  });
  return true;
});

async function handleMessage(message) {
  await Storage.init();
  switch (message.type) {
    case 'EXTRACT_PDF': {
      const { profile, warning, qualityScore } = await extractProfile({
        base64: message.base64,
        resumeText: message.resumeText
      });
      await Storage.set(Storage.KEYS.PROFILE, profile);
      if (message.filename) await Storage.set(Storage.KEYS.RESUME_FILENAME, message.filename);
      return { success: true, profile, warning, qualityScore };
    }
    case 'MAP_FIELDS': {
      const profile = await Storage.getProfile();
      const settings = await Storage.getSettings();
      if (!profile) throw new Error('Upload your resume first.');
      const mapping = await mapFields({
        fields: message.fields,
        profile,
        jobDescription: message.jobDescription,
        autoCoverLetter: settings.autoCoverLetter,
        rulesFirst: settings.rulesFirst
      });
      return { success: true, mapping };
    }
    case 'GENERATE_COVER_LETTER': {
      const profile = await Storage.getProfile();
      if (!profile) throw new Error('Upload your resume first.');
      const result = await generateCoverLetter({
        profile,
        jobContext: message.jobContext || {}
      });
      return { success: true, ...result };
    }
    case 'GENERATE_REFERRAL_MESSAGE': {
      const profile = await Storage.getProfile();
      if (!profile) throw new Error('Upload your resume first.');
      const result = await generateReferralMessage({
        profile,
        jobContext: message.jobContext || {},
        person: message.person || {}
      });
      return { success: true, ...result };
    }
    case 'GET_AUTH': {
      const user = await Auth.getUser();
      return { success: true, user };
    }
    case 'SIGN_IN': {
      const user = await Auth.signIn();
      return { success: true, user };
    }
    case 'SIGN_OUT':
      await Auth.signOut();
      return { success: true };
    case 'GET_DATA':
      return { success: true, data: await Storage.getAll() };
    case 'SAVE_PROFILE':
      await Storage.set(Storage.KEYS.PROFILE, message.profile);
      return { success: true };
    case 'SAVE_SETTINGS': {
      const current = await Storage.getSettings();
      await Storage.set(Storage.KEYS.SETTINGS, { ...current, ...message.settings });
      return { success: true };
    }
    case 'SET_ONBOARDING_DONE':
      await Storage.set(Storage.KEYS.ONBOARDING_DONE, true);
      return { success: true };
    case 'CLEAR_ALL':
      await Storage.clearAll();
      return { success: true };
    case 'IMPORT_LINKEDIN_PEOPLE':
      return importLinkedInPeople(message.company || '', message.role || '');
    case 'GET_CREDITS': {
      const data = await Api.getUserData();
      return { success: true, usage: data.usage || null };
    }
    case 'OPEN_BUY_PAGE': {
      const base = (Config.API_BASE_URL || '').replace(/\/$/, '');
      await chrome.tabs.create({ url: `${base}/app/credits` });
      return { success: true };
    }
    default:
      throw new Error(`Unknown message: ${message.type}`);
  }
}
