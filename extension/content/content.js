const JOB_SITES = [
  'naukri.com',
  'linkedin.com',
  'internshala.com',
  'indeed.co',
  'indeed.com',
  'unstop.com',
  'wellfound.com',
  'angel.co',
  'cutshort.io',
  'shine.com',
  'workindia.in'
];

let toastEl = null;
let fabEl = null;

function isJobSite() {
  const host = location.hostname.replace(/^www\./, '');
  return JOB_SITES.some((site) => host.includes(site));
}

function countFormFields() {
  return document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select').length;
}

function shouldShowFab() {
  return isJobSite() || countFormFields() >= 3;
}

function getFieldLabel(el) {
  const parts = [];

  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) parts.push(label.textContent.trim());
  }

  if (el.getAttribute('aria-label')) parts.push(el.getAttribute('aria-label'));
  if (el.placeholder) parts.push(el.placeholder);
  if (el.name) parts.push(el.name.replace(/[_-]/g, ' '));
  if (el.id) parts.push(el.id.replace(/[_-]/g, ' '));

  for (const attr of el.attributes) {
    if (attr.name.startsWith('data-') && attr.value.length < 80) {
      parts.push(attr.value.replace(/[_-]/g, ' '));
    }
  }

  let parent = el.parentElement;
  for (let i = 0; i < 3 && parent; i++) {
    const legend = parent.querySelector('legend');
    if (legend) parts.push(legend.textContent.trim());
    const labelish = parent.querySelector('label, span, p');
    if (labelish && labelish !== el && labelish.textContent.trim().length < 100) {
      parts.push(labelish.textContent.trim());
    }
    parent = parent.parentElement;
  }

  const unique = [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
  return unique[0] || el.name || el.id || el.type || 'field';
}

function scanFields() {
  const elements = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select'
  );

  const fields = [];
  const seen = new Set();

  elements.forEach((el) => {
    if (el.offsetParent === null && el.type !== 'hidden') {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
    }

    const label = getFieldLabel(el);
    const key = `${label}::${el.tagName}::${el.name || el.id}`;
    if (seen.has(key)) return;
    seen.add(key);

    fields.push({
      label,
      type: el.type || el.tagName.toLowerCase(),
      name: el.name || '',
      id: el.id || '',
      selector: buildSelector(el)
    });
  });

  return { fields, elements: [...elements] };
}

function buildSelector(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  if (el.name) {
    const tag = el.tagName.toLowerCase();
    const named = document.querySelectorAll(`${tag}[name="${CSS.escape(el.name)}"]`);
    if (named.length === 1) return `${tag}[name="${CSS.escape(el.name)}"]`;
  }
  return null;
}

function findElement(field, allElements) {
  if (field.selector) {
    const el = document.querySelector(field.selector);
    if (el) return el;
  }
  if (field.id) {
    const el = document.getElementById(field.id);
    if (el) return el;
  }
  if (field.name) {
    const els = document.querySelectorAll(`[name="${CSS.escape(field.name)}"]`);
    if (els.length === 1) return els[0];
  }

  for (const el of allElements) {
    if (getFieldLabel(el) === field.label) return el;
  }
  return null;
}

function setNativeValue(el, value) {
  if (el.tagName === 'SELECT') {
    setSelectValue(el, value);
    return;
  }

  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

function setSelectValue(select, value) {
  const norm = String(value).toLowerCase().trim();
  let best = null;
  let bestScore = 0;

  for (const opt of select.options) {
    const text = opt.text.toLowerCase().trim();
    const val = opt.value.toLowerCase().trim();
    if (text === norm || val === norm) {
      best = opt;
      break;
    }
    if (text.includes(norm) || norm.includes(text)) {
      const score = Math.min(text.length, norm.length);
      if (score > bestScore) {
        bestScore = score;
        best = opt;
      }
    }
  }

  if (best) {
    select.value = best.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function extractJobDescription() {
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="description__text"]',
    '[class*="jd-"]',
    '[id*="job-description"]',
    '[data-testid*="job-description"]',
    '[data-testid*="description"]',
    '.jobs-description',
    '.jobs-box__html-content',
    '#job-details',
    '.job-details',
    '[class*="posting-description"]',
    'article'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim().length > 100) {
      return el.textContent.trim().replace(/\s+/g, ' ').slice(0, 4000);
    }
  }

  const meta = document.querySelector('meta[name="description"]')?.content
    || document.querySelector('meta[property="og:description"]')?.content;
  return meta?.replace(/\s+/g, ' ').slice(0, 2000) || '';
}

function extractJobTitle() {
  const selectors = [
    'h1[class*="job-title"]',
    'h1[class*="jobTitle"]',
    '.job-title',
    '.jobs-unified-top-card__job-title',
    '[data-testid="job-title"]',
    '[class*="posting-headline"] h1',
    'h1'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text && text.length > 2 && text.length < 150) return text;
  }

  const og = document.querySelector('meta[property="og:title"]')?.content;
  if (og) return og.split('|')[0].split('–')[0].trim();
  return document.title?.split('|')[0].split('–')[0].trim() || '';
}

function extractCompanyName() {
  const selectors = [
    '[class*="company-name"]',
    '[class*="companyName"]',
    '.jobs-unified-top-card__company-name',
    '[data-testid="company-name"]',
    'a[class*="company"]',
    '[class*="employer-name"]',
    '[class*="org-name"]'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text && text.length > 1 && text.length < 100) return text;
  }

  const title = document.title || '';
  const atMatch = title.match(/\bat\s+([^|–\-]+)/i);
  if (atMatch) return atMatch[1].trim();

  const og = document.querySelector('meta[property="og:title"]')?.content || '';
  const ogAt = og.match(/\bat\s+([^|–\-]+)/i);
  if (ogAt) return ogAt[1].trim();

  return '';
}

function extractJobContext() {
  const jobTitle = extractJobTitle();
  const companyName = extractCompanyName();
  const jobDescription = extractJobDescription();

  return {
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    jobDescription: jobDescription || null,
    pageUrl: location.href,
    pageTitle: document.title || null
  };
}

function isLinkedInPage() {
  return /linkedin\.com/i.test(location.hostname);
}

function queryAllDeep(root, selector, max = 500) {
  const results = [];
  const visited = new Set();

  function walk(node) {
    if (!node || results.length >= max || visited.has(node)) return;
    visited.add(node);

    if (node.querySelectorAll) {
      node.querySelectorAll(selector).forEach((el) => {
        if (results.length < max) results.push(el);
      });
    }

    const children = node.children ? [...node.children] : [];
    children.forEach(walk);

    if (node.shadowRoot) walk(node.shadowRoot);
  }

  walk(root);
  return results;
}

function normalizeLinkedInProfileUrl(href) {
  try {
    const url = new URL(href, location.origin);
    const match = url.pathname.match(/\/in\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    return `https://www.linkedin.com/in/${match[1]}/`;
  } catch {
    return null;
  }
}

function cleanLinkedInPersonName(raw) {
  if (!raw) return '';
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.'-]/g, '')
    .trim()
    .slice(0, 80);
}

function extractLinkedInPersonName(link) {
  const hidden = link.querySelector('span[aria-hidden="true"]');
  if (hidden?.textContent?.trim()) return cleanLinkedInPersonName(hidden.textContent.trim());

  const aria = link.getAttribute('aria-label') || '';
  const fromAria = aria.match(/(?:View|Open)\s+(.+?)(?:'s|\s+profile)/i);
  if (fromAria) return cleanLinkedInPersonName(fromAria[1].trim());

  const spans = [...link.querySelectorAll('span')]
    .map((s) => s.textContent.trim())
    .filter((t) => t.length > 1 && t.length < 80 && !/^(•|·|\d)/.test(t));
  if (spans.length) return cleanLinkedInPersonName(spans[0]);

  const line = link.textContent.replace(/\s+/g, ' ').trim().split(/[•·|]/)[0].trim();
  return cleanLinkedInPersonName(line);
}

function extractLinkedInPersonMeta(container, nameLink) {
  const lines = [];
  const walker = container.querySelectorAll('p, span, div');

  walker.forEach((el) => {
    if (el === nameLink || nameLink.contains(el)) return;
    if (el.querySelector('a[href*="/in/"]') && el !== nameLink.parentElement) return;
    const t = el.textContent.replace(/\s+/g, ' ').trim();
    if (!t || t.length < 4 || t.length > 220) return;
    if (/^(connect|message|follow|pending|mutual|view profile|premium)$/i.test(t)) return;
    if (/^\d+(st|nd|rd|th)?\+?\s*(connection|follower)/i.test(t)) return;
    if (/^status is/i.test(t)) return;
    if (lines.includes(t)) return;
    lines.push(t);
  });

  const title = lines.find((t) => /@| at |engineer|manager|developer|lead|senior|director|recruiter/i.test(t))
    || lines[0]
    || '';
  const location = lines.find((t) => t !== title && /,|india|remote|area|region/i.test(t)) || '';

  return { title, location };
}

function isLinkedInProfileLink(link) {
  if (!link?.href?.includes('/in/')) return false;
  if (link.closest('nav, header, [role="navigation"], .global-nav, #global-nav')) return false;
  const profileUrl = normalizeLinkedInProfileUrl(link.href);
  if (!profileUrl) return false;
  const name = extractLinkedInPersonName(link);
  if (!name || name.length < 2) return false;
  if (/^(connect|message|you|me|home|search)$/i.test(name)) return false;
  return true;
}

function scrapeLinkedInPeople() {
  if (!isLinkedInPage()) return [];

  const root = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  const seen = new Set();
  const people = [];

  function addPerson(entry) {
    if (!entry.profileUrl || seen.has(entry.profileUrl)) return;
    if (!entry.name || entry.name.length < 2) return;
    seen.add(entry.profileUrl);
    people.push(entry);
  }

  const containers = root.querySelectorAll(
    'div[role="listitem"], li[role="presentation"], [data-chameleon-result-urn], .reusable-search__result-container, .entity-result'
  );

  containers.forEach((container) => {
    const links = [...container.querySelectorAll('a[href*="/in/"]')].filter(isLinkedInProfileLink);
    if (!links.length) return;

    const nameLink = links.reduce((best, link) => {
      const name = extractLinkedInPersonName(link);
      return name.length > extractLinkedInPersonName(best).length ? link : best;
    }, links[0]);

    const profileUrl = normalizeLinkedInProfileUrl(nameLink.href);
    const name = extractLinkedInPersonName(nameLink);
    const meta = extractLinkedInPersonMeta(container, nameLink);
    addPerson({ name, title: meta.title, location: meta.location, profileUrl });
  });

  const profileLinks = queryAllDeep(root, 'a[href*="/in/"]', 200);
  profileLinks.forEach((link) => {
    if (!isLinkedInProfileLink(link)) return;
    const profileUrl = normalizeLinkedInProfileUrl(link.href);
    const container = link.closest('div[role="listitem"]')
      || link.closest('li')
      || link.closest('[data-chameleon-result-urn]')
      || link.closest('[componentkey]')
      || link.parentElement?.parentElement?.parentElement;
    const name = extractLinkedInPersonName(link);
    const meta = container ? extractLinkedInPersonMeta(container, link) : { title: '', location: '' };
    addPerson({ name, title: meta.title, location: meta.location, profileUrl });
  });

  return people.slice(0, 25);
}

function parseLinkedInSearchContext() {
  if (!location.pathname.includes('/search/results/people')) return null;
  const keywords = new URLSearchParams(location.search).get('keywords') || '';
  if (!keywords.trim()) return null;

  const parts = keywords.split(/\s*-\s*/).map((s) => s.trim()).filter(Boolean);
  let jobTitle = null;
  let companyName = null;

  if (parts.length >= 2) {
    const tail = parts[parts.length - 1];
    const m = tail.match(/^(.+?)\s+([A-Za-z][\w.&-]+)$/);
    if (m) {
      jobTitle = m[1].trim();
      companyName = m[2].trim();
    }
  }

  if (!companyName) {
    const tokens = keywords.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, '')).filter((w) => w.length > 2);
    const counts = {};
    tokens.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    const repeated = Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1])[0];
    if (repeated) {
      companyName = repeated[0].charAt(0).toUpperCase() + repeated[0].slice(1);
      jobTitle = jobTitle || keywords.replace(new RegExp(companyName, 'ig'), '').replace(/\s*-\s*/g, ' ').trim();
    }
  }

  return {
    jobTitle: jobTitle || null,
    companyName: companyName || null,
    jobDescription: null,
    pageUrl: location.href,
    pageTitle: document.title || null
  };
}

function showToast(message, isError = false) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'applywise-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.className = isError ? 'applywise-toast error' : 'applywise-toast success';
  toastEl.style.display = 'block';
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 3500);
}

async function runAutofill(highlight = true) {
  const { fields, elements } = scanFields();
  if (fields.length === 0) {
    showToast('No form fields found on this page', true);
    return { filled: 0, total: 0 };
  }

  const jobDescription = extractJobDescription();

  let mapping = {};
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'MAP_FIELDS',
      fields,
      jobDescription
    });
    if (response?.success) mapping = response.mapping || {};
    else throw new Error(response?.error || 'Mapping failed');
  } catch (err) {
    showToast(`Autofill error: ${err.message}`, true);
    return { filled: 0, total: fields.length };
  }

  let filled = 0;
  for (const field of fields) {
    const value = mapping[field.label];
    if (value == null || value === '') continue;

    const el = findElement(field, elements);
    if (!el || el.disabled || el.readOnly) continue;

    try {
      setNativeValue(el, String(value));
      filled++;
      if (highlight) {
        el.classList.add('applywise-highlight');
        setTimeout(() => el.classList.remove('applywise-highlight'), 3000);
      }
    } catch {
      /* skip unfilled field */
    }
  }

  showToast(`✅ Filled ${filled} of ${fields.length} fields`);
  return { filled, total: fields.length };
}

function createFab() {
  if (fabEl || !shouldShowFab()) return;

  fabEl = document.createElement('button');
  fabEl.id = 'applywise-fab';
  fabEl.title = 'Applywise — Autofill this page';
  fabEl.innerHTML = '⚡';
  fabEl.addEventListener('click', async () => {
    fabEl.disabled = true;
    fabEl.classList.add('loading');
    try {
      const result = await runAutofill(true);
      fabEl.textContent = result.filled > 0 ? '✅' : '❌';
      setTimeout(() => {
        fabEl.textContent = '⚡';
        fabEl.disabled = false;
        fabEl.classList.remove('loading');
      }, 3000);
    } catch {
      fabEl.textContent = '❌';
      setTimeout(() => {
        fabEl.textContent = '⚡';
        fabEl.disabled = false;
        fabEl.classList.remove('loading');
      }, 3000);
    }
  });

  document.body.appendChild(fabEl);
}

if (!globalThis.__applywiseContentLoaded) {
  globalThis.__applywiseContentLoaded = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'AUTOFILL') {
      runAutofill(message.highlight !== false)
        .then((result) => sendResponse({ success: true, ...result }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
    if (message.type === 'GET_JOB_CONTEXT') {
      const linkedInCtx = isLinkedInPage() ? parseLinkedInSearchContext() : null;
      sendResponse({ success: true, context: linkedInCtx || extractJobContext() });
      return false;
    }
    if (message.type === 'GET_LINKEDIN_PEOPLE') {
      const people = scrapeLinkedInPeople();
      sendResponse({
        success: true,
        people,
        onLinkedIn: isLinkedInPage(),
        onPeopleSearch: location.pathname.includes('/search/results/people')
      });
      return false;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFab);
  } else {
    createFab();
  }

  const observer = new MutationObserver(() => {
    if (!fabEl && shouldShowFab()) createFab();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
