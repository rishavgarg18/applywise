import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { corsHeaders, withCors } from "@/lib/cors";
import { getUserDataBundle } from "@/lib/db-user-data";
import { searchJobs } from "@/lib/jobs/search";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return withCors(
      request,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const { searchParams } = new URL(request.url);
  const bundle = await getUserDataBundle(user.id);

  const result = await searchJobs(bundle.profile, bundle.settings, {
    q: searchParams.get("q") || undefined,
    location: searchParams.get("location") || undefined,
    page: Number(searchParams.get("page") || "1"),
    remote: searchParams.get("remote") === "true",
    type: searchParams.get("type") || undefined,
  });

  return withCors(request, NextResponse.json(result));
}
