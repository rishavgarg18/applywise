import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { getUserResume } from "@/lib/db-user-data";
import { corsHeaders, withCors } from "@/lib/cors";

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

  const data = await getUserResume(user.id);
  return withCors(request, NextResponse.json(data));
}
