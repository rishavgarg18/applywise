const Api = {
  async getToken() {
    const stored = await chrome.storage.local.get('apiToken');
    return stored.apiToken || null;
  },

  async setToken(token) {
    if (token) {
      await chrome.storage.local.set({ apiToken: token });
    } else {
      await chrome.storage.local.remove('apiToken');
    }
  },

  async request(path, options = {}) {
    const token = await this.getToken();
    if (!token) throw new Error('Not signed in');

    const baseUrl = (Config.API_BASE_URL || '').replace(/\/$/, '');
    let res;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch {
      throw new Error(
        `Cannot reach ${baseUrl}. Check API_BASE_URL in extension/lib/config.js`
      );
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      if (data.code) err.code = data.code;
      if (data.action) err.action = data.action;
      if (data.resetAt) err.resetAt = data.resetAt;
      if (typeof data.credits === 'number') err.credits = data.credits;
      throw err;
    }
    return data;
  },

  async exchangeGoogleToken(accessToken) {
    const baseUrl = (Config.API_BASE_URL || '').replace(/\/$/, '');
    let res;
    try {
      res = await fetch(`${baseUrl}/api/auth/extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
    } catch {
      throw new Error(
        `Cannot reach ${baseUrl}. Set API_BASE_URL in extension/lib/config.js to your deployed web app.`
      );
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Sign-in failed');
    await this.setToken(data.apiToken);
    return data;
  },

  // Public runtime config (announcements, min version, pricing, feature flags).
  // No auth required.
  async getConfig() {
    const baseUrl = (Config.API_BASE_URL || '').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/api/config`);
    if (!res.ok) throw new Error('Could not load config');
    return res.json();
  },

  async getUserData() {
    return this.request('/api/user');
  },

  async patchUserData(updates) {
    return this.request('/api/user', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async clearUserData() {
    return this.request('/api/user', { method: 'DELETE' });
  },

  async ai(action, params) {
    return this.request('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ action, ...params }),
    });
  },
};
