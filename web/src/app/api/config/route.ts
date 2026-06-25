import { NextResponse } from "next/server";
import { corsHeaders, withCors } from "@/lib/cors";
import { ACTION_CONFIG, CREDIT_PACKS } from "@/lib/credits";

/**
 * Public, cacheable runtime config for the extension. Lets us change pricing,
 * limits, announcements, the minimum supported version, and feature kill
 * switches by redeploying the web app — without shipping a new extension build.
 *
 * Announcement / minVersion / kill switches are env-driven so they can be
 * flipped from Vercel project settings.
 */
export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const limits = Object.fromEntries(
    Object.entries(ACTION_CONFIG).map(([key, cfg]) => [
      key,
      { label: cfg.label, dailyFree: cfg.dailyFree, cost: cfg.cost },
    ])
  );

  const res = NextResponse.json({
    minVersion: process.env.EXT_MIN_VERSION || "1.6.0",
    announcement: process.env.EXT_ANNOUNCEMENT || null,
    featureFlags: {
      payments: process.env.EXT_DISABLE_PAYMENTS !== "true",
      resumeBuilder: true,
    },
    pricing: CREDIT_PACKS,
    limits,
  });

  // Edge/CDN cache for a few minutes; safe because this is non-personalized.
  res.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  return withCors(request, res);
}
