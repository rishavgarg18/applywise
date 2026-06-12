import type { NextRequest } from "next/server";
import { handlers } from "@/auth";

export const runtime = "nodejs";

type AuthHandler = (req: NextRequest) => Promise<Response>;

async function withLogging(handler: AuthHandler, req: NextRequest) {
  try {
    return await handler(req);
  } catch (error) {
    console.error("[auth] route error:", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  return withLogging(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return withLogging(handlers.POST, req);
}
