let currentProfile = null;
let currentQualityScore = null;
let currentStep = 1;
let currentJobContext = null;
let lastKnownJobContext = null;
let currentCoverLetter = '';
let linkedInPeople = [];
let currentUsage = null;

function isOutOfCredits(err) {
  return err?.code === 'OUT_OF_CREDITS' || /out of (free )?credits/i.test(err?.message || '');
}

function showParseOverlay(statusText) {
  const overlay = document.getElementById('parse-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  document.body.classList.add('parse-locked');
  updateParseOverlayStatus(statusText || 'Reading PDF…');
}

function hideParseOverlay() {
  const overlay = document.getElementById('parse-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.classList.remove('parse-locked');
}

function updateParseOverlayStatus(text) {
  const el = document.getElementById('parse-overlay-status');
  if (el && text) el.textContent = text;
}

async function refreshCredits() {
  try {
    const res = await sendMessage({ type: 'GET_CREDITS' });
    if (res?.success && res.usage) {
      currentUsage = res.usage;
      renderCredits();
    }
  } catch {
    /* ignore — credits are non-critical for the rest of the UI */
  }
}

function renderCredits() {
  const bar = document.getElementById('credits-bar');
  if (!bar || !currentUsage) return;
  const actions = currentUsage.actions || {};
  const chips = Object.keys(actions)
    .map((key) => {
      const a = actions[key];
      const short = (a.label || key).split(' ')[0];
      const low = a.freeRemaining === 0;
      return `<span class="credit-chip${low ? ' low' : ''}">${esc(short)} ${a.freeRemaining}/${a.dailyFree}</span>`;
    })
    .join('');
  const buyBtn = paymentsEnabled()
    ? '<button class="btn-text" id="buy-credits" type="button">Buy</button>'
    : '';
  bar.innerHTML = `
    <div class="credits-row">
      <span class="credits-balance">⚡ ${currentUsage.credits} credits</span>
      ${buyBtn}
    </div>
    <div class="credit-chips">${chips}</div>
  `;
  bar.querySelector('#buy-credits')?.addEventListener('click', openBuyPage);
}

async function openBuyPage() {
  await sendMessage({ type: 'OPEN_BUY_PAGE' });
}

// Renders an out-of-credits message with a Buy button into a status element.
function showOutOfCredits(statusEl, err) {
  const label = err?.action ? `${err.action.replace(/([A-Z])/g, ' $1').toLowerCase()}` : 'this';
  statusEl.classList.remove('hidden');
  statusEl.className = 'status error';
  const cta = paymentsEnabled()
    ? ' <button class="btn-text" data-buy-credits type="button">Buy credits</button>'
    : ' Come back tomorrow when your free limit resets.';
  statusEl.innerHTML = `Out of free credits for ${esc(label)} today.${cta}`;
  statusEl.querySelector('[data-buy-credits]')?.addEventListener('click', openBuyPage);
  refreshCredits();
}

function isUsefulJobContext(ctx) {
  if (!ctx) return false;
  const title = (ctx.jobTitle || '').trim();
  const badTitles = /^(search|people|linkedin|home|feed|jobs)$/i;
  return !!(ctx.companyName || (title && !badTitles.test(title)));
}

function mergeJobContext(base, extra) {
  if (!base) return extra;
  if (!extra) return base;
  return {
    ...base,
    ...extra,
    jobTitle: extra.jobTitle || base.jobTitle,
    companyName: extra.companyName || base.companyName,
    jobDescription: extra.jobDescription || base.jobDescription
  };
}

const PROFILE_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'alternatePhone', label: 'Alternate Phone', type: 'tel' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'pinCode', label: 'PIN Code' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'linkedin', label: 'LinkedIn', type: 'url' },
  { key: 'github', label: 'GitHub', type: 'url' },
  { key: 'portfolio', label: 'Portfolio', type: 'url' },
  { key: 'currentDesignation', label: 'Current Designation' },
  { key: 'currentCompany', label: 'Current Company' },
  { key: 'totalExperience', label: 'Total Experience' },
  { key: 'currentCTC', label: 'Current CTC (LPA)' },
  { key: 'expectedCTC', label: 'Expected CTC (LPA)' },
  { key: 'noticePeriod', label: 'Notice Period (days)' },
  { key: 'preferredLocations', label: 'Preferred Locations' },
  { key: 'workMode', label: 'Work Mode' },
  { key: 'summary', label: 'Professional Summary', textarea: true },
  { key: 'primarySkills', label: 'Primary Skills' },
  { key: 'secondarySkills', label: 'Secondary Skills / Tools' },
  { key: 'programmingLanguages', label: 'Programming Languages' },
  { key: 'spokenLanguages', label: 'Spoken Languages' },
  { key: 'fathersName', label: "Father's Name" },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'category', label: 'Category' },
  { key: 'differentlyAbled', label: 'Differently Abled' },
  { key: 'permanentAddress', label: 'Permanent Address', textarea: true },
  { key: 'currentAddress', label: 'Current Address', textarea: true }
];

// Repeatable resume sections. Each becomes an add/edit/delete editor in the
// Profile tab so a mis-parsed resume can be fixed or built from scratch.
const SECTION_SCHEMAS = [
  {
    key: 'experiences',
    title: 'Experience',
    singular: 'Experience',
    fields: [
      { key: 'role', label: 'Role' },
      { key: 'company', label: 'Company' },
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
      { key: 'type', label: 'Type' },
      { key: 'location', label: 'Location' },
      { key: 'description', label: 'Description', textarea: true }
    ]
  },
  {
    key: 'education',
    title: 'Education',
    singular: 'Education',
    fields: [
      { key: 'degree', label: 'Degree' },
      { key: 'institution', label: 'Institution' },
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
      { key: 'percentage', label: 'Score / %' },
      { key: 'stream', label: 'Stream' }
    ]
  },
  {
    key: 'projects',
    title: 'Projects',
    singular: 'Project',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'techStack', label: 'Tech Stack' },
      { key: 'description', label: 'Description', textarea: true },
      { key: 'url', label: 'URL' },
      { key: 'duration', label: 'Duration' }
    ]
  },
  {
    key: 'certifications',
    title: 'Certifications',
    singular: 'Certification',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'issuer', label: 'Issuer' },
      { key: 'date', label: 'Date' },
      { key: 'expiry', label: 'Expiry' },
      { key: 'id', label: 'Credential ID' },
      { key: 'url', label: 'URL' }
    ]
  }
];

function emptySectionItem(schema) {
  const item = {};
  schema.fields.forEach((f) => { item[f.key] = null; });
  return item;
}

let serverConfig = null;

async function init() {
  loadServerConfig();
  const auth = await sendMessage({ type: 'GET_AUTH' });

  if (!auth.user) {
    showLogin();
    bindEvents();
    return;
  }

  renderAccount(auth.user);
  await continueAfterAuth();
  bindEvents();
}

function versionLessThan(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return true;
    if ((pa[i] || 0) > (pb[i] || 0)) return false;
  }
  return false;
}

// Fetches server-driven config so announcements, the minimum supported version,
// and feature kill switches can change without shipping a new extension build.
async function loadServerConfig() {
  try {
    serverConfig = await Api.getConfig();
  } catch {
    return;
  }

  const el = document.getElementById('app-announcement');
  if (!el) return;

  const currentVersion = chrome.runtime.getManifest().version;
  if (serverConfig.minVersion && versionLessThan(currentVersion, serverConfig.minVersion)) {
    el.textContent = 'A newer version of Applywise is required. Please update from the Chrome Web Store.';
    el.className = 'announcement warn';
  } else if (serverConfig.announcement) {
    el.textContent = serverConfig.announcement;
    el.className = 'announcement';
  } else {
    el.className = 'announcement hidden';
  }
}

function paymentsEnabled() {
  return !serverConfig || serverConfig.featureFlags?.payments !== false;
}

async function continueAfterAuth() {
  const data = await sendMessage({ type: 'GET_DATA' });
  const store = data.data || {};

  if (store.onboardingDone && store.profile) {
    currentProfile = { ...Storage.DEFAULT_PROFILE, ...store.profile };
    showApp(store);
  } else if (store.profile) {
    currentProfile = { ...Storage.DEFAULT_PROFILE, ...store.profile };
    goToStep(2);
    showOnboarding();
    renderReviewPreview();
  } else {
    showOnboarding();
  }
}

function showLogin() {
  document.getElementById('login').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');
}

function renderAccount(user) {
  const nameEl = document.getElementById('account-name');
  const emailEl = document.getElementById('account-email');
  const avatarEl = document.getElementById('account-avatar');

  if (!user) return;

  nameEl.textContent = user.name || user.email;
  emailEl.textContent = user.email;

  if (user.picture) {
    avatarEl.src = user.picture;
    avatarEl.classList.remove('hidden');
  } else {
    avatarEl.classList.add('hidden');
  }
}

async function handleGoogleSignIn() {
  const btn = document.getElementById('google-signin');
  const statusEl = document.getElementById('login-status');

  btn.disabled = true;
  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Opening Google sign-in...';
  statusEl.className = 'status';

  try {
    const result = await sendMessage({ type: 'SIGN_IN' });
    if (!result.success) throw new Error(result.error || 'Sign-in failed');

    document.getElementById('login').classList.add('hidden');
    renderAccount(result.user);
    await continueAfterAuth();
  } catch (err) {
    statusEl.textContent = err.message || 'Could not sign in with Google';
    statusEl.className = 'status error';
  } finally {
    btn.disabled = false;
  }
}

async function handleSignOut() {
  if (!confirm('Sign out of Applywise?')) return;
  await sendMessage({ type: 'SIGN_OUT' });
  location.reload();
}

function showOnboarding() {
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp(store) {
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  currentProfile = { ...Storage.DEFAULT_PROFILE, ...store.profile };
  if (store.usage) {
    currentUsage = store.usage;
    renderCredits();
  }
  refreshCredits();
  renderHome();
  renderProfileForm();
  loadJobPageContext();
  document.getElementById('resume-name').textContent = store.resumeFilename || 'Resume uploaded';
  const settings = { ...Storage.DEFAULT_SETTINGS, ...store.settings };
  document.getElementById('toggle-highlight').checked = settings.highlightFilled;
  document.getElementById('toggle-cover-letter').checked = settings.autoCoverLetter;
  document.getElementById('toggle-rules-first').checked = settings.rulesFirst !== false;
}

function goToStep(step) {
  currentStep = step;
  document.querySelectorAll('.step').forEach((el) => {
    el.classList.toggle('hidden', parseInt(el.dataset.step) !== step);
  });
  document.querySelectorAll('.dot').forEach((el) => {
    el.classList.toggle('active', parseInt(el.dataset.dot) === step);
  });
}

function bindEvents() {
  document.getElementById('google-signin')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('sign-out-btn')?.addEventListener('click', handleSignOut);
  document.getElementById('resume-upload').addEventListener('change', handleResumeUpload);
  document.getElementById('finish-onboarding').addEventListener('click', finishOnboarding);
  document.getElementById('autofill-btn').addEventListener('click', triggerAutofill);
  document.getElementById('replace-resume').addEventListener('click', () => {
    document.getElementById('hidden-resume-input').click();
  });
  document.getElementById('hidden-resume-input').addEventListener('change', handleResumeReplace);
  document.getElementById('settings-resume').addEventListener('change', handleResumeReplace);

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('save-profile').addEventListener('click', saveProfileFromForm);
  document.getElementById('profile-form').addEventListener('click', handleProfileFormClick);
  document.getElementById('start-manual')?.addEventListener('click', startManualProfile);
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('clear-data').addEventListener('click', clearAllData);
  document.getElementById('refresh-job').addEventListener('click', loadJobPageContext);
  document.getElementById('regenerate-cover').addEventListener('click', () => generateCoverLetterForPage());
  document.getElementById('copy-cover-letter').addEventListener('click', copyCoverLetter);
  document.getElementById('refresh-linkedin').addEventListener('click', loadLinkedInTab);
  document.getElementById('open-li-search').addEventListener('click', openLinkedInSearch);
  document.getElementById('scrape-li-people').addEventListener('click', scrapeLinkedInFromTab);

  const uploadZone = document.getElementById('upload-zone');
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = '#4fffb0'; });
  uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) processPdfFile(file, 'extract-status');
  });

  // Refresh credit balance when the popup regains focus (e.g. after the user
  // completes a purchase in the web tab).
  window.addEventListener('focus', refreshCredits);
}

async function startManualProfile() {
  currentProfile = { ...Storage.DEFAULT_PROFILE };
  await sendMessage({ type: 'SAVE_PROFILE', profile: currentProfile });
  await sendMessage({ type: 'SET_ONBOARDING_DONE' });
  const data = await sendMessage({ type: 'GET_DATA' });
  showApp(data.data);
  switchTab('profile');
}

async function handleResumeUpload(e) {
  const file = e.target.files[0];
  if (file) await processPdfFile(file, 'extract-status');
}

async function handleResumeReplace(e) {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('autofill-status');
  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Extracting...';
  statusEl.className = 'status';
  try {
    await processPdfFile(file, 'autofill-status', true);
    const data = await sendMessage({ type: 'GET_DATA' });
    showApp(data.data);
    statusEl.textContent = 'Resume updated!';
    statusEl.className = 'status success';
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'status error';
  }
}

async function processPdfFile(file, statusId, stayOnApp = false) {
  const statusEl = document.getElementById(statusId);
  showParseOverlay('Reading PDF…');
  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Reading PDF...';
  statusEl.className = 'status';

  try {
    if (!file.type.includes('pdf')) {
      statusEl.textContent = 'Please upload a PDF file';
      statusEl.className = 'status error';
      throw new Error('Please upload a PDF file');
    }

    let resumeText = "";
    let textWarning = "";
    try {
      resumeText = await extractTextFromPdfFile(file);
    } catch {
      textWarning = "Could not read PDF text locally — using server-side parsing.";
    }

    updateParseOverlayStatus('Extracting profile with AI…');
    statusEl.textContent = 'Extracting profile...';

    const base64 = await fileToBase64(file);
    const result = await sendMessage({
      type: 'EXTRACT_PDF',
      base64,
      resumeText: resumeText || undefined,
      filename: file.name
    });

    if (!result.success) {
      if (isOutOfCredits(result)) {
        showOutOfCredits(statusEl, result);
        throw new Error(result.error);
      }
      statusEl.textContent = result.error || 'Extraction failed';
      statusEl.className = 'status error';
      throw new Error(result.error);
    }

    currentProfile = { ...Storage.DEFAULT_PROFILE, ...result.profile };
    currentQualityScore = result.qualityScore ?? null;
    refreshCredits();
    statusEl.textContent = [result.warning, textWarning].filter(Boolean).join(' ') || 'Profile extracted!';
    statusEl.className = (result.warning || textWarning) ? 'status' : 'status success';

    if (!stayOnApp) {
      renderReviewPreview();
      goToStep(2);
    }
  } finally {
    hideParseOverlay();
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderReviewPreview() {
  const el = document.getElementById('review-preview');
  const p = currentProfile;
  const expCount = (p.experiences || []).length;
  const eduCount = (p.education || []).length;
  const score = currentQualityScore;
  const scoreHtml = score != null
    ? `<span class="quality-badge ${score >= 70 ? 'good' : score >= 50 ? 'ok' : 'low'}">${score}% complete</span>`
    : '';
  const expList = (p.experiences || []).slice(0, 4).map((e) =>
  `<div class="exp-row">${esc(e.role || '—')} @ ${esc(e.company || '—')}</div>`
  ).join('');
  const eduList = (p.education || []).slice(0, 3).map((e) =>
  `<div class="exp-row">${esc(e.degree || '—')} — ${esc(e.institution || '—')}</div>`
  ).join('');
  el.innerHTML = `
    <div class="review-header">${scoreHtml}</div>
    <strong>${esc(p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—')}</strong><br>
    ${esc(p.email || '—')} · ${esc(p.phone || '—')}<br>
    ${esc(p.currentDesignation || '—')} @ ${esc(p.currentCompany || '—')}<br>
    Skills: ${esc(p.primarySkills || '—')}<br>
    <span class="muted">${expCount} experience · ${eduCount} education · ${(p.projects || []).length} projects</span>
    ${expList ? `<div class="review-section"><strong>Experience</strong>${expList}</div>` : ''}
    ${eduList ? `<div class="review-section"><strong>Education</strong>${eduList}</div>` : ''}
  `;
}

async function finishOnboarding() {
  await sendMessage({ type: 'SET_ONBOARDING_DONE' });
  const data = await sendMessage({ type: 'GET_DATA' });
  showApp(data.data);
}

function renderCopyRow(label, value) {
  if (value == null || value === '') return '';
  const str = String(value);
  return `
    <div class="copy-row">
      <div class="copy-row-label">${esc(label)}</div>
      <div class="copy-row-value">${esc(str)}</div>
      <button class="copy-btn" type="button" data-copy="${encodeURIComponent(str)}" title="Copy">⧉</button>
    </div>`;
}

function bindCopyButtons(root) {
  root.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = decodeURIComponent(btn.dataset.copy || '');
      await navigator.clipboard.writeText(text);
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 1200);
    });
  });
}

function renderHome() {
  const p = currentProfile;
  document.getElementById('preview-name').textContent =
    p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—';
  document.getElementById('preview-role').textContent = p.currentDesignation || '—';
  document.getElementById('preview-company').textContent = p.currentCompany || '—';

  const basicRows = PROFILE_FIELDS
    .map((f) => renderCopyRow(f.label, p[f.key]))
    .filter(Boolean)
    .join('');

  const expBlocks = (p.experiences || []).map((exp, i) => {
    const allText = [
      exp.role && `Role: ${exp.role}`,
      exp.company && `Company: ${exp.company}`,
      (exp.from || exp.to) && `Duration: ${exp.from || ''} – ${exp.to || ''}`,
      exp.location && `Location: ${exp.location}`,
      exp.description && `Description: ${exp.description}`
    ].filter(Boolean).join('\n');

    return `
      <div class="exp-block">
        <div class="exp-block-header">
          <span>Experience ${i + 1}</span>
          ${allText ? `<button class="copy-btn copy-btn-sm" type="button" data-copy="${encodeURIComponent(allText)}" title="Copy all">Copy all</button>` : ''}
        </div>
        ${renderCopyRow('Role', exp.role)}
        ${renderCopyRow('Company', exp.company)}
        ${renderCopyRow('Duration', exp.from || exp.to ? `${exp.from || ''} – ${exp.to || ''}` : null)}
        ${renderCopyRow('Location', exp.location)}
        ${renderCopyRow('Description', exp.description)}
      </div>`;
  }).join('');

  const eduBlocks = (p.education || []).map((edu, i) => `
    <div class="exp-block">
      <div class="exp-block-header"><span>Education ${i + 1}</span></div>
      ${renderCopyRow('Degree', edu.degree)}
      ${renderCopyRow('Institution', edu.institution)}
      ${renderCopyRow('Years', edu.from || edu.to ? `${edu.from || ''} – ${edu.to || ''}` : null)}
      ${renderCopyRow('Score', edu.percentage)}
      ${renderCopyRow('Stream', edu.stream)}
    </div>
  `).join('');

  const projectBlocks = (p.projects || []).map((proj, i) => `
    <div class="exp-block">
      <div class="exp-block-header"><span>Project ${i + 1}</span></div>
      ${renderCopyRow('Name', proj.name)}
      ${renderCopyRow('Tech Stack', proj.techStack)}
      ${renderCopyRow('Description', proj.description)}
    </div>
  `).join('');

  const container = document.getElementById('copy-fields');
  container.innerHTML = `
    <div class="copy-section">
      <h4 class="copy-section-title">Basic Info</h4>
      ${basicRows || '<p class="muted">No basic fields extracted.</p>'}
    </div>
    ${expBlocks ? `<div class="copy-section"><h4 class="copy-section-title">Experience</h4>${expBlocks}</div>` : ''}
    ${eduBlocks ? `<div class="copy-section"><h4 class="copy-section-title">Education</h4>${eduBlocks}</div>` : ''}
    ${projectBlocks ? `<div class="copy-section"><h4 class="copy-section-title">Projects</h4>${projectBlocks}</div>` : ''}
  `;

  bindCopyButtons(container);
}

function renderJobContext(ctx) {
  const el = document.getElementById('job-context');
  if (!ctx || (!ctx.jobTitle && !ctx.companyName && !ctx.jobDescription)) {
    el.innerHTML = '<span class="muted">No job details found on this page. Try a job listing or application form.</span>';
    return;
  }
  el.innerHTML = `
    ${ctx.jobTitle ? `<div class="job-line"><strong>Role:</strong> ${esc(ctx.jobTitle)}</div>` : ''}
    ${ctx.companyName ? `<div class="job-line"><strong>Company:</strong> ${esc(ctx.companyName)}</div>` : ''}
    ${ctx.jobDescription ? `<div class="job-line jd-preview"><strong>JD:</strong> ${esc(ctx.jobDescription.slice(0, 220))}${ctx.jobDescription.length > 220 ? '…' : ''}</div>` : ''}
  `;
}

async function getActiveTabJobContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    return null;
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_CONTEXT' });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] });
    return await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_CONTEXT' });
  }
}

async function loadJobPageContext() {
  const jobEl = document.getElementById('job-context');
  const coverEl = document.getElementById('cover-letter-text');
  jobEl.textContent = 'Reading job page...';

  try {
    const response = await getActiveTabJobContext();
    if (!response?.success) throw new Error('No context');

    currentJobContext = response.context;
    if (isUsefulJobContext(currentJobContext)) lastKnownJobContext = currentJobContext;
    renderJobContext(currentJobContext);
    if (!currentCoverLetter) {
      coverEl.textContent = 'Click Generate to create a cover letter with Gemini.';
      coverEl.className = 'cover-letter-body muted';
    }
  } catch {
    currentJobContext = null;
    jobEl.innerHTML = '<span class="muted">Open a job listing page to auto-detect role &amp; JD.</span>';
    if (!currentCoverLetter) {
      coverEl.textContent = 'Open a job page, then click Generate.';
      coverEl.className = 'cover-letter-body muted';
    }
  }
}

async function generateCoverLetterForPage() {
  const coverEl = document.getElementById('cover-letter-text');
  if (!currentProfile) return;

  coverEl.textContent = 'Generating...';
  coverEl.className = 'cover-letter-body muted';

  try {
    const result = await sendMessage({
      type: 'GENERATE_COVER_LETTER',
      jobContext: currentJobContext || {}
    });

    if (!result.success) {
      if (isOutOfCredits(result)) {
        coverEl.innerHTML = `Out of free cover letters today. <button class="btn-text" data-buy-credits type="button">Buy credits</button>`;
        coverEl.className = 'cover-letter-body muted';
        coverEl.querySelector('[data-buy-credits]')?.addEventListener('click', openBuyPage);
        refreshCredits();
        return;
      }
      throw new Error(result.error);
    }

    currentCoverLetter = result.letter || '';
    coverEl.textContent = currentCoverLetter;
    coverEl.className = 'cover-letter-body';
    coverEl.title = 'Generated by Gemini';
    refreshCredits();
  } catch (err) {
    coverEl.textContent = formatGeminiError(err);
    coverEl.className = 'cover-letter-body muted';
  }
}

function formatGeminiError(err) {
  const msg = err?.message || 'Could not generate cover letter.';
  if (err?.status === 429 || msg.includes('429')) {
    return 'Gemini quota exceeded. Wait for your limit to reset, then click Generate again.';
  }
  if (err?.status === 503 || msg.includes('503')) {
    return 'Gemini is busy. Try again in a moment.';
  }
  if (msg.startsWith('Gemini API error')) return 'Gemini unavailable. Check your API key or try again later.';
  return msg;
}

async function copyCoverLetter() {
  if (!currentCoverLetter) return showBriefStatus('No cover letter yet');
  await navigator.clipboard.writeText(currentCoverLetter);
  showBriefStatus('Cover letter copied!');
}

function renderProfileForm() {
  const form = document.getElementById('profile-form');
  const p = currentProfile;

  const fieldsHtml = PROFILE_FIELDS.map((f) => {
    const val = p[f.key] ?? '';
    if (f.textarea) {
      return `<div class="field-group"><label>${f.label}</label><textarea name="${f.key}">${esc(val)}</textarea></div>`;
    }
    return `<div class="field-group"><label>${f.label}</label><input type="${f.type || 'text'}" name="${f.key}" value="${escAttr(val)}"></div>`;
  }).join('');

  const sectionsHtml = SECTION_SCHEMAS.map(renderSectionEditor).join('');

  const achievementsVal = (p.achievements || []).join('\n');
  const achievementsHtml = `
    <div class="form-section">
      <h3 class="form-section-title">Achievements</h3>
      <div class="field-group">
        <label>One per line</label>
        <textarea name="achievements" placeholder="Won national hackathon 2024&#10;Published research paper">${esc(achievementsVal)}</textarea>
      </div>
    </div>`;

  form.innerHTML = `
    <h3 class="form-section-title">Basic Info</h3>
    ${fieldsHtml}
    ${sectionsHtml}
    ${achievementsHtml}
  `;
}

function renderSectionItem(schema, item, index) {
  const inputs = schema.fields.map((f) => {
    const val = item?.[f.key] ?? '';
    const name = `${schema.key}.${index}.${f.key}`;
    if (f.textarea) {
      return `<div class="field-group"><label>${f.label}</label><textarea name="${name}">${esc(val)}</textarea></div>`;
    }
    return `<div class="field-group"><label>${f.label}</label><input type="text" name="${name}" value="${escAttr(val)}"></div>`;
  }).join('');

  return `
    <div class="section-card editable" data-section="${schema.key}" data-index="${index}">
      <div class="section-card-head">
        <span class="section-card-title">${esc(schema.singular)} ${index + 1}</span>
        <button type="button" class="btn-text danger-text" data-remove="${schema.key}" data-index="${index}">Remove</button>
      </div>
      ${inputs}
    </div>`;
}

function renderSectionEditor(schema) {
  const items = currentProfile[schema.key] || [];
  const itemsHtml = items.length
    ? items.map((item, i) => renderSectionItem(schema, item, i)).join('')
    : `<p class="muted">No ${schema.title.toLowerCase()} added yet.</p>`;

  return `
    <div class="form-section" data-section-block="${schema.key}">
      <div class="form-section-head">
        <h3 class="form-section-title">${esc(schema.title)}</h3>
        <button type="button" class="btn-text add-text" data-add="${schema.key}">+ Add</button>
      </div>
      <div class="section-items" data-items="${schema.key}">${itemsHtml}</div>
    </div>`;
}

// Read every input in the form back into currentProfile. Called before any
// re-render (add/remove) so in-progress edits are never lost, and on save.
function syncFormToProfile() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  PROFILE_FIELDS.forEach((f) => {
    const input = form.querySelector(`[name="${f.key}"]`);
    if (input) currentProfile[f.key] = input.value.trim() || null;
  });

  SECTION_SCHEMAS.forEach((schema) => {
    const items = currentProfile[schema.key] || [];
    items.forEach((item, i) => {
      schema.fields.forEach((f) => {
        const input = form.querySelector(`[name="${schema.key}.${i}.${f.key}"]`);
        if (input) item[f.key] = input.value.trim() || null;
      });
    });
  });

  const achInput = form.querySelector('[name="achievements"]');
  if (achInput) {
    currentProfile.achievements = achInput.value
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }
}

function handleProfileFormClick(e) {
  const addKey = e.target.dataset.add;
  const removeKey = e.target.dataset.remove;
  if (!addKey && !removeKey) return;

  e.preventDefault();
  syncFormToProfile();

  if (addKey) {
    const schema = SECTION_SCHEMAS.find((s) => s.key === addKey);
    if (!currentProfile[addKey]) currentProfile[addKey] = [];
    currentProfile[addKey].push(emptySectionItem(schema));
  } else if (removeKey) {
    const index = parseInt(e.target.dataset.index, 10);
    if (Array.isArray(currentProfile[removeKey])) {
      currentProfile[removeKey].splice(index, 1);
    }
  }

  renderProfileForm();
}

async function saveProfileFromForm() {
  syncFormToProfile();
  const btn = document.getElementById('save-profile');
  if (btn) btn.disabled = true;
  try {
    await sendMessage({ type: 'SAVE_PROFILE', profile: currentProfile });
    renderHome();
    renderReviewPreview();
    showBriefStatus('Profile saved!');
  } catch (err) {
    showBriefStatus(err.message || 'Could not save profile');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function saveSettings() {
  await sendMessage({
    type: 'SAVE_SETTINGS',
    settings: {
      provider: 'gemini',
      highlightFilled: document.getElementById('toggle-highlight').checked,
      autoCoverLetter: document.getElementById('toggle-cover-letter').checked,
      rulesFirst: document.getElementById('toggle-rules-first').checked
    }
  });
  showBriefStatus('Settings saved!');
}

async function clearAllData() {
  if (!confirm('Delete all data including your profile?')) return;
  await sendMessage({ type: 'CLEAR_ALL' });
  location.reload();
}

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab').forEach((t) => t.classList.add('hidden'));
  document.getElementById(`tab-${tab}`).classList.remove('hidden');
  if (tab === 'linkedin') loadLinkedInTab();
}

function scorePersonForReferral(person, company, role) {
  const hay = `${person.title || ''} ${person.name || ''}`.toLowerCase();
  const companyL = (company || '').toLowerCase();
  const roleL = (role || '').toLowerCase();
  let score = 0;
  if (companyL && hay.includes(companyL.split(' ')[0])) score += 3;
  if (roleL) {
    roleL.split(/\s+/).filter((w) => w.length > 3).forEach((w) => { if (hay.includes(w)) score += 2; });
  }
  if (/manager|lead|head|director|vp|recruiter|talent|hiring/i.test(hay)) score += 2;
  if (/senior|sr\.?/i.test(hay) && roleL) score += 1;
  return score;
}

function buildLinkedInSearchUrl(company, role) {
  const baseRole = (role || '').replace(/\s+(I{1,3}|1|2|3|IV|4)\b/gi, '').trim();
  const seniorHint = baseRole ? `Senior ${baseRole}` : 'Hiring Manager';
  const keywords = [seniorHint, baseRole, company].filter(Boolean).join(' ');
  const params = new URLSearchParams({ keywords: keywords || 'hiring manager', origin: 'GLOBAL_SEARCH_HEADER' });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

function renderLinkedInContext() {
  const el = document.getElementById('linkedin-context');
  const ctx = currentJobContext;
  if (!ctx?.companyName && !ctx?.jobTitle) {
    el.innerHTML = '<span class="muted">Open a job listing first so we know the company and role.</span>';
    return;
  }
  el.innerHTML = `
    ${ctx.jobTitle ? `<div class="job-line"><strong>Role:</strong> ${esc(ctx.jobTitle)}</div>` : ''}
    ${ctx.companyName ? `<div class="job-line"><strong>Company:</strong> ${esc(ctx.companyName)}</div>` : ''}
    <div class="job-line muted">We rank people in the same role or senior to you for referral outreach.</div>
  `;
}

function renderLinkedInPeople() {
  const list = document.getElementById('linkedin-people-list');
  const company = currentJobContext?.companyName;
  const role = currentJobContext?.jobTitle;

  if (!linkedInPeople.length) {
    list.innerHTML = '<p class="muted">No people loaded. Search on LinkedIn, then click “Load from LinkedIn tab”.</p>';
    return;
  }

  const ranked = [...linkedInPeople]
    .map((p) => ({ ...p, score: scorePersonForReferral(p, company, role) }))
    .sort((a, b) => b.score - a.score);

  list.innerHTML = ranked.map((p, i) => `
    <div class="linkedin-person-card" data-idx="${i}">
      <h5>${esc(p.name)}${p.score > 0 ? `<span class="linkedin-score">match ${p.score}</span>` : ''}</h5>
      <div class="person-meta">${esc(p.title || '—')}${p.location ? `<br>${esc(p.location)}` : ''}</div>
      <div class="linkedin-person-actions">
        <button class="btn secondary btn-sm li-connect" data-idx="${i}" type="button">Connect</button>
        <button class="btn secondary btn-sm li-message" data-idx="${i}" type="button">Message</button>
        <button class="btn primary btn-sm li-both" data-idx="${i}" type="button">Connect + Message</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.li-connect').forEach((btn) => {
    btn.addEventListener('click', () => handleLinkedInAction(ranked[parseInt(btn.dataset.idx)], 'connect', btn));
  });
  list.querySelectorAll('.li-message').forEach((btn) => {
    btn.addEventListener('click', () => handleLinkedInAction(ranked[parseInt(btn.dataset.idx)], 'message', btn));
  });
  list.querySelectorAll('.li-both').forEach((btn) => {
    btn.addEventListener('click', () => handleLinkedInAction(ranked[parseInt(btn.dataset.idx)], 'both', btn));
  });
}

async function loadLinkedInTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onLinkedIn = activeTab?.url?.includes('linkedin.com');

  if (onLinkedIn && activeTab?.id) {
    try {
      let response;
      try {
        response = await chrome.tabs.sendMessage(activeTab.id, { type: 'GET_JOB_CONTEXT' });
      } catch {
        await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['content/content.js'] });
        response = await chrome.tabs.sendMessage(activeTab.id, { type: 'GET_JOB_CONTEXT' });
      }
      if (response?.success && isUsefulJobContext(response.context)) {
        currentJobContext = mergeJobContext(lastKnownJobContext, response.context);
        lastKnownJobContext = currentJobContext;
      } else if (lastKnownJobContext) {
        currentJobContext = lastKnownJobContext;
      }
    } catch {
      if (lastKnownJobContext) currentJobContext = lastKnownJobContext;
    }
  } else if (!isUsefulJobContext(currentJobContext)) {
    try {
      const response = await getActiveTabJobContext();
      if (response?.success && isUsefulJobContext(response.context)) {
        currentJobContext = response.context;
        lastKnownJobContext = currentJobContext;
      }
    } catch { /* keep existing */ }
  }

  renderLinkedInContext();
  renderLinkedInPeople();
}

async function openLinkedInSearch() {
  const url = buildLinkedInSearchUrl(currentJobContext?.companyName, currentJobContext?.jobTitle);
  await chrome.tabs.create({ url });
  showBriefStatus('Opened LinkedIn people search');
}

async function findLinkedInTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.url?.includes('linkedin.com')) return active;

  const inWindow = await chrome.tabs.query({ currentWindow: true, url: '*://*.linkedin.com/*' });
  if (inWindow.length) return inWindow[0];

  const any = await chrome.tabs.query({ url: '*://*.linkedin.com/*' });
  return any[0] || null;
}

async function scrapeLinkedInFromTab() {
  const list = document.getElementById('linkedin-people-list');
  list.innerHTML = '<p class="muted">Loading people from LinkedIn tab…</p>';

  try {
    const tab = await findLinkedInTab();
    if (!tab?.id) {
      list.innerHTML = '<p class="muted">Open LinkedIn people search first, then try again.</p>';
      return;
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_LINKEDIN_PEOPLE' });
    } catch {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] });
      response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_LINKEDIN_PEOPLE' });
    }

    if (!response?.onLinkedIn) {
      list.innerHTML = '<p class="muted">Switch to your LinkedIn people search tab, then click Load again.</p>';
      return;
    }

    if (!response?.onPeopleSearch) {
      list.innerHTML = '<p class="muted">Open a LinkedIn <strong>People</strong> search (not Jobs), then click Load again.</p>';
      return;
    }

    if (!response?.success || !response.people?.length) {
      list.innerHTML = '<p class="muted">No profiles found yet. Scroll the LinkedIn results to load more, then click Load again.</p>';
      return;
    }

    linkedInPeople = response.people;
    renderLinkedInPeople();
    showBriefStatus(`Loaded ${linkedInPeople.length} people`);
  } catch (err) {
    list.innerHTML = `<p class="muted">${esc(err.message || 'Could not read LinkedIn tab')}</p>`;
  }
}

async function handleLinkedInAction(person, action, btn) {
  if (!person?.profileUrl) return;

  const originalText = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating…';
  }

  try {
    const result = await sendMessage({
      type: 'GENERATE_REFERRAL_MESSAGE',
      jobContext: currentJobContext || {},
      person: { name: person.name, title: person.title }
    });

    if (!result.success) {
      if (isOutOfCredits(result)) {
        showBriefStatus('Out of free referral messages today — tap Buy in the header.');
        refreshCredits();
        return;
      }
      throw new Error(result.error);
    }

    const note = result.message || '';
    refreshCredits();
    await navigator.clipboard.writeText(note);
    await chrome.tabs.create({ url: person.profileUrl });

    const hints = {
      connect: 'Referral note copied — click Connect on their profile and paste.',
      message: 'Referral message copied — click Message on their profile and paste.',
      both: 'Referral note copied — connect first, then message with the same text.'
    };
    showBriefStatus(hints[action] || 'Copied!');
  } catch (err) {
    showBriefStatus(err.message || 'Could not generate referral message');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

async function triggerAutofill() {
  const btn = document.getElementById('autofill-btn');
  const status = document.getElementById('autofill-status');
  btn.disabled = true;
  status.classList.remove('hidden');
  status.textContent = 'Filling...';
  status.className = 'status';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || tab.url?.startsWith('chrome://')) {
      throw new Error('Open a job application page first.');
    }

    const settings = await sendMessage({ type: 'GET_DATA' });
    const highlight = settings.data?.settings?.highlightFilled !== false;

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL', highlight });
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/content.css']
      });
      response = await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL', highlight });
    }

    if (response?.success) {
      status.textContent = `✅ Filled ${response.filled} fields`;
      status.className = 'status success';
    } else {
      status.textContent = response?.error || 'Could not autofill. Try reloading the page.';
      status.className = 'status error';
    }
  } catch (err) {
    status.textContent = err.message || 'Open a job page first, then try again.';
    status.className = 'status error';
  }

  btn.disabled = false;
}

function showStatus(id, msg, isError) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.textContent = msg;
  el.className = isError ? 'status error' : 'status';
}

function showBriefStatus(msg) {
  const status = document.getElementById('autofill-status');
  status.classList.remove('hidden');
  status.textContent = msg;
  status.className = 'status success';
  setTimeout(() => status.classList.add('hidden'), 2000);
}

function sendMessage(msg) {
  return chrome.runtime.sendMessage(msg);
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

init();
