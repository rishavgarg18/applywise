import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { listContacts, saveContacts } from "@/lib/db-contacts";
import { corsHeaders, withCors } from "@/lib/cors";
import type { ContactSuggestion } from "@/lib/types";

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

  const contacts = await listContacts(user.id);
  return withCors(request, NextResponse.json({ contacts }));
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return withCors(
      request,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const body = await request.json();
  const incoming = (body.contacts || []) as Omit<ContactSuggestion, "id">[];
  const contacts = await saveContacts(user.id, incoming);
  return withCors(request, NextResponse.json({ contacts }));
}
