import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantCredits } from "@/lib/credits";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook. Source of truth for credit grants.
 * Configure in Razorpay Dashboard with the `payment.captured` event pointing at
 * <AUTH_URL>/api/razorpay/webhook and the RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Acknowledge anything that isn't a successful capture so Razorpay stops retrying.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ received: true });
  }

  // Atomically claim this order (only flips once), then grant credits.
  const claim = await prisma.payment.updateMany({
    where: { razorpayOrderId: orderId, status: { not: "paid" } },
    data: { status: "paid", razorpayPaymentId: paymentId },
  });

  if (claim.count === 1) {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });
    if (payment) await grantCredits(payment.userId, payment.credits);
  }

  return NextResponse.json({ received: true });
}
