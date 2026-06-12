import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

async function syncUser(email: string, name?: string | null, image?: string | null) {
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: name ?? null,
      image: image ?? null,
      emailVerified: new Date(),
    },
    update: {
      name: name ?? undefined,
      image: image ?? undefined,
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  debug: process.env.AUTH_DEBUG === "true",
  logger: {
    error(error) {
      console.error("[auth] error:", error);
      if (error instanceof Error && error.cause) {
        console.error("[auth] cause:", error.cause);
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        console.error("[auth] signIn: no email from Google");
        return false;
      }
      try {
        await syncUser(user.email, user.name, user.image);
        console.log("[auth] signIn ok:", user.email);
        return true;
      } catch (error) {
        console.error("[auth] signIn db error:", error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      const email =
        (token.email as string | undefined) ||
        (profile?.email as string | undefined);

      if (account && email) {
        try {
          const dbUser = await syncUser(
            email,
            (profile?.name as string | undefined) ?? token.name,
            (profile?.picture as string | undefined) ?? (token.picture as string | undefined)
          );
          token.sub = dbUser.id;
        } catch (error) {
          console.error("[auth] jwt db error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
