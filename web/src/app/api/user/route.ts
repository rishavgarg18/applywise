import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import {
  addTrackedJob,
  clearUserData,
  getUserDataBundle,
  removeTrackedJob,
  toggleSavedMatch,
  updateTrackedJob,
  updateUserData,
} from "@/lib/db-user-data";
import { corsHeaders, withCors } from "@/lib/cors";
import type { Profile, Settings, TrackedJob } from "@/lib/types";

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

  const data = await getUserDataBundle(user.id);
  return withCors(request, NextResponse.json(data));
}

export async function PATCH(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return withCors(
      request,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  const body = await request.json();

  if (body.addTrackedJob) {
    await addTrackedJob(user.id, body.addTrackedJob as TrackedJob);
  } else if (body.updateTrackedJob) {
    const { id, updates } = body.updateTrackedJob as {
      id: string;
      updates: Partial<TrackedJob>;
    };
    await updateTrackedJob(user.id, id, updates);
  } else if (body.removeTrackedJob) {
    await removeTrackedJob(user.id, body.removeTrackedJob as string);
  } else if (body.toggleSavedMatch) {
    await toggleSavedMatch(user.id, body.toggleSavedMatch as string);
  } else {
    await updateUserData(user.id, {
      ...(body.profile !== undefined ? { profile: body.profile as Profile } : {}),
      ...(body.settings !== undefined
        ? { settings: body.settings as Settings }
        : {}),
      ...(body.preferences !== undefined ? { preferences: body.preferences } : {}),
      ...(body.trackedJobs !== undefined ? { trackedJobs: body.trackedJobs } : {}),
      ...(body.savedMatches !== undefined
        ? { savedMatches: body.savedMatches }
        : {}),
      ...(body.resumeFilename !== undefined
        ? { resumeFilename: body.resumeFilename }
        : {}),
      ...(body.resumePdfBase64 !== undefined
        ? { resumePdfBase64: body.resumePdfBase64 }
        : {}),
      ...(body.onboardingDone !== undefined
        ? { onboardingDone: body.onboardingDone }
        : {}),
    });
  }

  const data = await getUserDataBundle(user.id);
  return withCors(request, NextResponse.json(data));
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return withCors(
      request,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  await clearUserData(user.id);
  return withCors(request, NextResponse.json({ success: true }));
}
