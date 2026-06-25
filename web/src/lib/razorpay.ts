import { createHmac, timingSafeEqual } from "crypto";

/**
 * Minimal Razorpay integration over the REST API (no SDK dependency).
 * Credits are granted via the webhook (`payment.captured`), which is the
 * source of truth; the client callback is only used for UX.
 */

const ORDERS_URL = "https://api.razorpay.com/v1/orders";

export function getRazorpayKeyId(): string {
  const id = process.env.RAZORPAY_KEY_ID;
  if (!id) throw new Error("RAZORPAY_KEY_ID is not configured");
  return id;
}

function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET is not configured");
  return secret;
}

function getWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  return secret;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

/** Create a Razorpay order. `amountPaise` is the charge in paise (INR * 100). */
export async function createRazorpayOrder(options: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const auth = Buffer.from(
    `${getRazorpayKeyId()}:${getRazorpayKeySecret()}`
  ).toString("base64");

  const res = await fetch(ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: options.amountPaise,
      currency: "INR",
      receipt: options.receipt,
      notes: options.notes ?? {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return (await res.json()) as RazorpayOrder;
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Verify a Razorpay webhook payload against the configured webhook secret. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", getWebhookSecret())
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verify the client-side checkout callback signature (order_id|payment_id). */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = createHmac("sha256", getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}
