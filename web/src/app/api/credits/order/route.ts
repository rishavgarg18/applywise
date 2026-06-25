import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/api-auth";
import { corsHeaders, withCors } from "@/lib/cors";
import { getCreditPack } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/razorpay";

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

  const body = await request.json().catch(() => ({}));
  const pack = getCreditPack(body.packId as string);
  if (!pack) {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid pack" }, { status: 400 })
    );
  }

  try {
    const order = await createRazorpayOrder({
      amountPaise: pack.amount * 100,
      receipt: `credits_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { userId: user.id, packId: pack.id, credits: String(pack.credits) },
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        razorpayOrderId: order.id,
        packId: pack.id,
        amount: pack.amount,
        credits: pack.credits,
        status: "created",
      },
    });

    return withCors(
      request,
      NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId(),
        pack: { id: pack.id, label: pack.label, credits: pack.credits },
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create order";
    return withCors(request, NextResponse.json({ error: message }, { status: 500 }));
  }
}
