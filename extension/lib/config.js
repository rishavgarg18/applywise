// For local dev, change API_BASE_URL to http://localhost:3000
//
// IMPORTANT (publishing): this should point at a STABLE domain. The current
// value is a Vercel project URL — if the project is ever renamed, every
// installed extension breaks (extensions are slow/hard to update). Before the
// public launch, move the web app to a custom domain (e.g. https://applywise.app)
// and set it here, in manifest.json (content_scripts + externally_connectable),
// and in the web app's AUTH_URL. Keep this domain forever.
const Config = {
  API_BASE_URL: 'https://applywise-drab.vercel.app',
  GOOGLE_CLIENT_ID:
    '573807823899-cdel0cm7dqmv7k44er56d2je9gfgqp60.apps.googleusercontent.com',
};
