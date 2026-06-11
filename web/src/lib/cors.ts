const ALLOWED_ORIGIN_PREFIXES = ["chrome-extension://", "moz-extension://"];

export function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (origin === process.env.AUTH_URL) return true;
  if (process.env.NODE_ENV === "development" && origin.startsWith("http://localhost")) {
    return true;
  }
  return ALLOWED_ORIGIN_PREFIXES.some((prefix) => origin.startsWith(prefix));
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = isAllowedOrigin(origin);

  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors(request: Request, response: Response) {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    if (value) response.headers.set(key, value);
  }
  return response;
}
