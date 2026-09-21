import { NextResponse } from "next/server";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { amount, currency = "INR", receipt, notes } = body;

    const config = await getRazorpayConfig();

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json(
        { error: "A valid order amount is required." },
        { status: 400 }
      );
    }

    // Ensure amount is in paise (minimum 100 paise = ₹1.00)
    let amountInPaise = Number(amount);
    if (body.amountInRupees) {
      amountInPaise = Math.round(Number(body.amountInRupees) * 100);
    }

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Minimum order amount is ₹1.00 (100 paise)." },
        { status: 400 }
      );
    }

    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency: (currency || "INR").toUpperCase(),
      receipt: receipt || `order_rcpt_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: order.key_id || config.keyId,
      mode: config.mode,
      is_mock: Boolean(order.is_mock),
    });
  } catch (error: any) {
    console.error("RAZORPAY CREATE ORDER ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create payment gateway order.",
      },
      { status: 500 }
    );
  }
}

