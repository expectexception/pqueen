import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { ShippingEngine } from "@/lib/shipping/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (signature) {
      const isValid = verifyRazorpayWebhookSignature({
        rawBody,
        signature,
      });

      if (!isValid) {
        console.warn("[Razorpay Webhook Warning]: Invalid signature verification.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const event = payload.event;
    console.log("[Razorpay Webhook Event Received]:", event);

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const orderEntity = payload.payload?.order?.entity || {};
      const razorpayOrderId = orderEntity.id || paymentEntity.order_id;

      if (razorpayOrderId) {
        const existingOrder = await prisma.order.findFirst({
          where: {
            OR: [
              { razorpayOrderId: razorpayOrderId },
              { orderNumber: razorpayOrderId },
              { orderNumber: `PQN-${razorpayOrderId}` },
            ],
          },
        });

        if (existingOrder) {
          await prisma.order.update({
            where: { id: existingOrder.id },
            data: {
              status: "PROCESSING",
              paymentStatus: "PAID",
              paymentMethod: "ONLINE",
              ...(paymentEntity.id ? { razorpayPaymentId: paymentEntity.id } : {}),
            },
          });

          try {
            await ShippingEngine.getInstance().autoFulfillOrder(existingOrder.id);
          } catch (fulfillErr: any) {
            console.warn("[Razorpay Webhook AutoFulfill Warning]:", fulfillErr.message);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (err: any) {
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
