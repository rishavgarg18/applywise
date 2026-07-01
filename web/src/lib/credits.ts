import { prisma } from "@/lib/prisma";

/**
 * Credit + daily-free-allowance system.
 *
 * Two buckets are consumed in order for each metered action:
 *   1. A per-action daily free allowance that resets at IST midnight.
 *   2. Purchased credits (User.credits), spent only once the daily free
 *      allowance for that action is exhausted.
 *
 * Enforcement lives entirely server-side (see /api/ai) so the client can never
 * grant itself usage. All numbers below are config and safe to tune.
 */

export type MeteredAction = "resumeParse" | "coverLetter" | "referral" | "ats";

export const ACTION_CONFIG: Record<
  MeteredAction,
  { label: string; dailyFree: number; cost: number }
> = {
  resumeParse: { label: "Resume parse", dailyFree: 2, cost: 1 },
  coverLetter: { label: "Cover letter", dailyFree: 3, cost: 1 },
  referral: { label: "Referral message", dailyFree: 5, cost: 1 },
  ats: { label: "ATS analysis", dailyFree: 3, cost: 1 },
};

/** Maps /api/ai action names to a metered bucket. Anything absent is free. */
export const API_ACTION_TO_METERED: Record<string, MeteredAction> = {
  extractProfile: "resumeParse",
  generateCoverLetter: "coverLetter",
  generateReferralMessage: "referral",
  analyzeATS: "ats",
};

export type CreditPack = {
  id: string;
  label: string;
  credits: number;
  amount: number; // INR rupees
  popular?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", label: "Starter", credits: 50, amount: 49 },
  { id: "plus", label: "Plus", credits: 120, amount: 99, popular: true },
  { id: "pro", label: "Pro", credits: 300, amount: 199 },
];

export function getCreditPack(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === packId);
}

/** Today's calendar day in IST as YYYY-MM-DD. */
export function istDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
}

/** ISO timestamp of the next IST midnight (when the free allowance resets). */
export function nextResetIso(date = new Date()): string {
  const [y, m, d] = istDateString(date).split("-").map(Number);
  // IST midnight = UTC of (next day 00:00) minus the 5h30m offset.
  const utcMs = Date.UTC(y, m - 1, d + 1, 0, 0, 0) - 5.5 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export type ConsumeResult =
  | { allowed: true; source: "free" | "credit"; freeRemaining: number; credits: number }
  | { allowed: false; reason: "OUT_OF_CREDITS"; dailyLimit: number; credits: number; resetAt: string };

/**
 * Atomically consume one unit for `action`. Tries the daily free allowance
 * first, then purchased credits. Returns whether it was allowed and which
 * bucket was used (so a failed downstream call can be refunded precisely).
 */
export async function consume(
  userId: string,
  action: MeteredAction
): Promise<ConsumeResult> {
  const { dailyFree, cost } = ACTION_CONFIG[action];
  const date = istDateString();

  return prisma.$transaction(async (tx) => {
    const usage = await tx.dailyUsage.findUnique({
      where: { userId_date_action: { userId, date, action } },
    });
    const used = usage?.count ?? 0;

    if (used < dailyFree) {
      await tx.dailyUsage.upsert({
        where: { userId_date_action: { userId, date, action } },
        create: { userId, date, action, count: 1 },
        update: { count: { increment: 1 } },
      });
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });
      return {
        allowed: true,
        source: "free",
        freeRemaining: dailyFree - used - 1,
        credits: user?.credits ?? 0,
      };
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    const credits = user?.credits ?? 0;

    if (credits >= cost) {
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
      });
      return {
        allowed: true,
        source: "credit",
        freeRemaining: 0,
        credits: credits - cost,
      };
    }

    return {
      allowed: false,
      reason: "OUT_OF_CREDITS",
      dailyLimit: dailyFree,
      credits,
      resetAt: nextResetIso(),
    };
  });
}

/** Reverse a previous consume() when the downstream action fails. */
export async function refund(
  userId: string,
  action: MeteredAction,
  source: "free" | "credit"
): Promise<void> {
  const { cost } = ACTION_CONFIG[action];
  const date = istDateString();

  if (source === "free") {
    await prisma.dailyUsage
      .update({
        where: { userId_date_action: { userId, date, action } },
        data: { count: { decrement: 1 } },
      })
      .catch(() => {
        /* row may not exist if the day rolled over; ignore */
      });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: cost } },
  });
}

export type UsageSnapshot = {
  credits: number;
  resetAt: string;
  actions: Record<
    MeteredAction,
    { label: string; used: number; dailyFree: number; freeRemaining: number }
  >;
};

/** Read-only view of a user's credits and today's usage, for UI display. */
export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const date = istDateString();
  const [user, rows] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }),
    prisma.dailyUsage.findMany({ where: { userId, date } }),
  ]);

  const usedByAction = new Map<string, number>();
  for (const row of rows) usedByAction.set(row.action, row.count);

  const actions = {} as UsageSnapshot["actions"];
  for (const key of Object.keys(ACTION_CONFIG) as MeteredAction[]) {
    const { label, dailyFree } = ACTION_CONFIG[key];
    const used = usedByAction.get(key) ?? 0;
    actions[key] = {
      label,
      used,
      dailyFree,
      freeRemaining: Math.max(0, dailyFree - used),
    };
  }

  return {
    credits: user?.credits ?? 0,
    resetAt: nextResetIso(),
    actions,
  };
}

/** Grant purchased credits (idempotency handled by the caller). */
export async function grantCredits(userId: string, amount: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  });
}
