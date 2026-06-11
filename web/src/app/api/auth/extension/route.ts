import { NextResponse } from "next/server";
import {
  createApiToken,
  upsertUserFromGoogle,
} from "@/lib/api-auth";
import { corsHeaders, withCors } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const accessToken = body.accessToken as string | undefined;

  if (!accessToken) {
    return withCors(
      request,
      NextResponse.json({ error: "Missing access token" }, { status: 400 })
    );
  }

  const googleRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!googleRes.ok) {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid Google token" }, { status: 401 })
    );
  }

  const info = await googleRes.json();
  if (!info.email) {
    return withCors(
      request,
      NextResponse.json({ error: "Google account has no email" }, { status: 400 })
    );
  }

  const user = await upsertUserFromGoogle({
    email: info.email,
    name: info.name,
    picture: info.picture,
  });

  const apiToken = await createApiToken(user.id, "extension");

  return withCors(
    request,
    NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        picture: user.image,
      },
      apiToken,
    })
  );
}
