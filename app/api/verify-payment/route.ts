import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { ShippingEngine } from "@/lib/shipping/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Accept standard razorpay parameter names or camelCase
    const razorpayOrderId = body.razorpay_order_id || body.order_id || body.orderId;
    const razorpayPaymentId = body.razorpay_payment_id || body.payment_id || body.paymentId;
    const signature = body.razorpay_signature || body.signature;
    const internalOrderId = body.internalOrderId || body.systemOrderId;

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required verification fields (orderId, paymentId, or signature).",
        },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature verification failed. Transaction cannot be verified.",
        },
        { status: 400 }
      );
    }

    // Find and update matching order in database
    let matchedOrder = null;
    if (internalOrderId) {
      matchedOrder = await prisma.order.findUnique({
        where: { id: internalOrderId },
      });
    }

    if (!matchedOrder) {
      matchedOrder = await prisma.order.findFirst({
        where: {
          OR: [
            { razorpayOrderId: razorpayOrderId },
            { orderNumber: razorpayOrderId },
            { orderNumber: `PQN-${razorpayOrderId}` },
          ],
        },
      });
    }

    let fulfillmentResult: any = null;

    if (matchedOrder) {
      await prisma.order.update({
        where: { id: matchedOrder.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "ONLINE",
          razorpayPaymentId,
          razorpayOrderId,
          status: "PROCESSING",
        },
      });

      // Automatically push order to iThink Logistics API v3 & generate live AWB
      try {
        fulfillmentResult = await ShippingEngine.getInstance().autoFulfillOrder(matchedOrder.id);
      } catch (fErr: any) {
        console.warn("[Post-Payment AutoFulfill Warning]:", fErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully and order pushed to logistics.",
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      order: matchedOrder ? {
        id: matchedOrder.id,
        orderNumber: matchedOrder.orderNumber,
      } : undefined,
      fulfillment: fulfillmentResult ? {
        success: fulfillmentResult.success,
        awbNumber: fulfillmentResult.shipment?.awbNumber,
        courierName: fulfillmentResult.shipment?.courierName,
        labelUrl: fulfillmentResult.shipment?.labelUrl,
        trackingUrl: fulfillmentResult.shipment?.trackingUrl,
      } : undefined,
    });
  } catch (error: any) {
    console.error("RAZORPAY VERIFY PAYMENT ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to verify payment signature.",
      },
      { status: 500 }
    );
  }
}
