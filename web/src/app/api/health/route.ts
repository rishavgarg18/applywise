import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    AUTH_URL: process.env.AUTH_URL || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
    DATABASE_HOST: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/\/\/.*@/, "//***@").split("?")[0]
      : null,
  };

  let database: string | Record<string, string> = "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch (err) {
    database =
      err instanceof Error
        ? { error: err.message, name: err.name }
        : { error: "failed" };
  }

  const ok =
    checks.AUTH_SECRET &&
    checks.GOOGLE_CLIENT_ID &&
    checks.GOOGLE_CLIENT_SECRET &&
    checks.DATABASE_URL &&
    database === "ok";

  return NextResponse.json(
    { ok, checks, database },
    { status: ok ? 200 : 503 }
  );
}
