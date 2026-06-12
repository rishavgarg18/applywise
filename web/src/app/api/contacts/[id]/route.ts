import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { deleteContact } from "@/lib/db-contacts";
import { corsHeaders, withCors } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestUser(request);
  if (!user) {
    return withCors(
      request,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const { id } = await params;
  await deleteContact(user.id, id);
  return withCors(request, NextResponse.json({ success: true }));
}
