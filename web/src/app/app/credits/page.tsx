"use client";

import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserData } from "@/components/providers/user-data-provider";
import { CREDIT_PACKS } from "@/lib/credits";
import { Check, Coins, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name?: string; email?: string };
  theme: { color: string };
  handler: (response: Record<string, string>) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CreditsPage() {
  const { usage, session, loaded, refresh } = useUserData();
  const [busyPack, setBusyPack] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadRazorpay();
  }, []);

  const buy = useCallback(
    async (packId: string) => {
      setBusyPack(packId);
      setMessage(null);
      try {
        const ok = await loadRazorpay();
        if (!ok) throw new Error("Could not load the payment gateway. Try again.");

        const res = await fetch("/api/credits/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not start checkout.");

        const rzp = new window.Razorpay!({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Applywise",
          description: `${data.pack.label} — ${data.pack.credits} credits`,
          order_id: data.orderId,
          prefill: {
            name: session?.user?.name ?? undefined,
            email: session?.user?.email ?? undefined,
          },
          theme: { color: "#6d5efc" },
          handler: async () => {
            // Credits are granted by the webhook; poll a few times so the UI
            // reflects the new balance even if the webhook lands a moment later.
            setMessage({
              type: "success",
              text: "Payment received! Adding your credits…",
            });
            for (let i = 0; i < 6; i++) {
              await new Promise((r) => setTimeout(r, 1500));
              await refresh();
            }
          },
          modal: {
            ondismiss: () => setBusyPack(null),
          },
        });
        rzp.open();
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        setBusyPack(null);
      }
    },
    [refresh, session]
  );

  if (!loaded) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Credits"
        description="Buy credits to keep generating once your daily free limit is used up. Credits never expire."
      />

      <Card className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-dim text-accent">
            <Coins className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted">Credit balance</p>
            <p className="text-2xl font-semibold">{usage?.credits ?? 0}</p>
          </div>
        </div>
        <div className="text-right text-sm text-muted">
          <p>Free today</p>
          <p className="text-foreground">
            {usage
              ? Object.values(usage.actions)
                  .map((a) => `${a.label.split(" ")[0]} ${a.freeRemaining}/${a.dailyFree}`)
                  .join(" · ")
              : "—"}
          </p>
        </div>
      </Card>

      {message && (
        <div
          className={`mb-6 rounded-md border p-3 text-sm ${
            message.type === "success"
              ? "border-accent/30 bg-accent-dim text-accent"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <Card
            key={pack.id}
            className={`relative flex flex-col ${pack.popular ? "border-accent" : ""}`}
          >
            {pack.popular && (
              <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                <Sparkles className="h-3 w-3" /> Popular
              </span>
            )}
            <h3 className="font-medium">{pack.label}</h3>
            <p className="mt-2 text-3xl font-semibold">
              {pack.credits}
              <span className="ml-1 text-sm font-normal text-muted">credits</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              ₹{pack.amount} · ₹{(pack.amount / pack.credits).toFixed(2)} per credit
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-accent" /> {pack.credits} premium
                generations
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-accent" /> UPI / cards / netbanking
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-accent" /> Never expires
              </li>
            </ul>
            <Button
              className="mt-5 w-full"
              variant={pack.popular ? "primary" : "outline"}
              onClick={() => buy(pack.id)}
              disabled={busyPack !== null}
            >
              {busyPack === pack.id ? "Opening checkout…" : `Buy for ₹${pack.amount}`}
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        Payments are processed securely by Razorpay. Each premium action (resume
        parse, cover letter, referral message, ATS analysis) uses your daily free
        allowance first, then 1 credit.
      </p>
    </>
  );
}
