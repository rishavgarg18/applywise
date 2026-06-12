// Find LinkedIn tab and read people from people-search results.

async function findLinkedInTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.url?.includes('linkedin.com')) return active;

  const tabs = await chrome.tabs.query({ url: '*://*.linkedin.com/*' });
  const peopleTab = tabs.find((t) => t.url?.includes('/search/results/people'));
  return peopleTab || tabs[0] || null;
}

async function readPeopleFromTab(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'GET_LINKEDIN_PEOPLE' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js'],
    });
    return chrome.tabs.sendMessage(tabId, { type: 'GET_LINKEDIN_PEOPLE' });
  }
}

async function importLinkedInPeople(company, role) {
  const tab = await findLinkedInTab();
  if (!tab?.id) {
    return { success: false, error: 'Open LinkedIn people search in a tab first.' };
  }

  const response = await readPeopleFromTab(tab.id);
  if (!response?.onLinkedIn) {
    return { success: false, error: 'Switch to a LinkedIn tab and try again.' };
  }
  if (!response?.onPeopleSearch) {
    return {
      success: false,
      error: 'Open a LinkedIn People search (not Jobs), scroll results, then import.',
    };
  }
  if (!response?.people?.length) {
    return {
      success: false,
      error: 'No profiles found. Scroll LinkedIn to load more, then try again.',
    };
  }

  const people = rankLinkedInPeople(response.people, company, role);
  return { success: true, people };
}
