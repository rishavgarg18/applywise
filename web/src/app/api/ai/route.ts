import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { corsHeaders, withCors } from "@/lib/cors";
import * as gemini from "@/lib/gemini-server";
import type { Profile } from "@/lib/types";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
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
  const { action, ...params } = body;

  try {
    let result: unknown;

    switch (action) {
      case "extractProfileFromPdf":
        result = await gemini.extractProfileFromPdf(params.base64Pdf as string);
        break;
      case "extractProfileFromText":
        result = await gemini.extractProfileFromText(params.resumeText as string);
        break;
      case "generateCoverLetter":
        result = await gemini.generateCoverLetter(
          params.profile as Profile,
          params.jobTitle as string,
          params.company as string,
          params.jobDescription as string
        );
        break;
      case "generateEmail":
        result = await gemini.generateEmail(
          params.profile as Profile,
          params.type as "networking" | "followup" | "thankyou",
          params.recipientName as string,
          params.recipientTitle as string,
          params.company as string,
          params.jobTitle as string,
          params.context as string
        );
        break;
      case "analyzeATS":
        result = await gemini.analyzeATS(
          params.profile as Profile,
          params.jobDescription as string
        );
        break;
      case "tailorResumeSection":
        result = await gemini.tailorResumeSection(
          params.profile as Profile,
          params.jobDescription as string,
          params.section as "summary" | "skills" | "experience"
        );
        break;
      case "generateInterviewQuestion":
        result = await gemini.generateInterviewQuestion(
          params.profile as Profile,
          params.jobTitle as string,
          params.company as string
        );
        break;
      case "generateNetworkingMessage":
        result = await gemini.generateNetworkingMessage(
          params.profile as Profile,
          params.personName as string,
          params.personTitle as string,
          params.company as string,
          params.jobTitle as string
        );
        break;
      case "mapFieldsWithAi":
        result = await gemini.mapFieldsWithAi(
          params.fields as { label: string; name: string; type: string }[],
          params.profile as Profile,
          params.jobDescription as string,
          Boolean(params.autoCoverLetter)
        );
        break;
      case "generateReferralMessage":
        result = await gemini.generateReferralMessage(
          params.profile as Profile,
          (params.jobContext as Record<string, string>) || {},
          (params.person as Record<string, string>) || {}
        );
        break;
      default:
        return withCors(
          request,
          NextResponse.json({ error: "Unknown action" }, { status: 400 })
        );
    }

    return withCors(request, NextResponse.json({ result }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return withCors(request, NextResponse.json({ error: message }, { status: 500 }));
  }
}
