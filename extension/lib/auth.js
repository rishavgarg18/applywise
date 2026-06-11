const Auth = {
  async signIn() {
    const redirectUri = chrome.identity.getRedirectURL();
    const params = new URLSearchParams({
      client_id: Config.GOOGLE_CLIENT_ID,
      response_type: 'token',
      redirect_uri: redirectUri,
      scope: 'openid email profile'
    });

    let redirectUrl;
    try {
      redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        interactive: true
      });
    } catch (err) {
      if (err?.message?.includes('did not approve')) {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error(
        'Google sign-in failed. Add this redirect URI in Google Cloud Console: ' + redirectUri
      );
    }

    const hash = new URL(redirectUrl).hash.replace(/^#/, '');
    const token = new URLSearchParams(hash).get('access_token');
    if (!token) throw new Error('Google sign-in was cancelled or failed.');

    const session = await Api.exchangeGoogleToken(token);
    const user = session.user;

    await Storage.setAuthUser(user);
    await Storage.setUserId(user.email);
    return user;
  },

  async signOut() {
    await Api.setToken(null);
    await Storage.setAuthUser(null);
    await Storage.setUserId(null);
  },

  async getUser() {
    await Storage.init();
    return Storage.getAuthUser();
  }
};
