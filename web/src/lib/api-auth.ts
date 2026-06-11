import { createHash, randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiToken() {
  return randomBytes(32).toString("base64url");
}

export async function createApiToken(userId: string, name = "extension") {
  const token = generateApiToken();
  const tokenHash = hashToken(token);

  await prisma.apiToken.create({
    data: {
      userId,
      tokenHash,
      name,
    },
  });

  return token;
}

export async function verifyApiToken(token: string): Promise<AuthUser | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;

  await prisma.apiToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: record.user.id,
    email: record.user.email,
    name: record.user.name,
    image: record.user.image,
  };
}

export async function getRequestUser(
  request: Request
): Promise<AuthUser | null> {
  const session = await auth();
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    }
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyApiToken(authHeader.slice(7));
  }

  return null;
}

export async function upsertUserFromGoogle(info: {
  email: string;
  name?: string | null;
  picture?: string | null;
}) {
  return prisma.user.upsert({
    where: { email: info.email },
    create: {
      email: info.email,
      name: info.name ?? null,
      image: info.picture ?? null,
      emailVerified: new Date(),
    },
    update: {
      name: info.name ?? undefined,
      image: info.picture ?? undefined,
    },
  });
}
