// Runs on Applywise web pages only. Relays import requests to the extension background.

const WEB = 'applywise-web';
const EXT = 'applywise-extension';

window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== WEB) return;

  if (data.type === 'PING_EXTENSION') {
    window.postMessage({ source: EXT, type: 'PONG' }, '*');
    return;
  }

  if (data.type === 'IMPORT_LINKEDIN') {
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'IMPORT_LINKEDIN_PEOPLE',
        company: data.company || '',
        role: data.role || '',
      });
      window.postMessage({ source: EXT, type: 'IMPORT_LINKEDIN_RESULT', ...result }, '*');
    } catch (err) {
      window.postMessage(
        {
          source: EXT,
          type: 'IMPORT_LINKEDIN_RESULT',
          success: false,
          error: err?.message || 'Import failed',
        },
        '*'
      );
    }
  }
});
