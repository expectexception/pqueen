import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * iThink Logistics Automated Tracking Webhook Listener
 * Receives real-time push events from iThink Logistics when a package milestone changes:
 * - PICKED UP
 * - IN TRANSIT / REACHED AT DESTINATION HUB
 * - OUT FOR DELIVERY
 * - DELIVERED
 * - RTO / RETURNED / CANCELLED
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("[iThink Logistics Webhook Event Received]:", JSON.stringify(body).slice(0, 500));

    // iThink webhook payload can deliver single object or array or nested data
    const eventData = body.data || body.shipment || body;
    const waybill = eventData.awb_number || eventData.waybill || eventData.awb || body.awb_number || body.waybill;
    const orderRef = eventData.order_id || eventData.order_number || eventData.order || body.order_id || body.order_number;
    const statusRaw = String(eventData.current_status || eventData.status || body.current_status || body.status || "").toUpperCase();
    const courierName = eventData.logistic_name || eventData.courier_name || body.logistic_name;
    const trackingUrl = eventData.tracking_url || (waybill ? `https://my.ithinklogistics.com/track?awb=${waybill}` : undefined);
    const location = eventData.location || eventData.scan_location || "";
    const scanRemark = eventData.remark || eventData.status_description || eventData.activity || statusRaw;

    if (!waybill && !orderRef) {
      return NextResponse.json({ success: false, message: "No AWB or Order ID found in webhook payload" }, { status: 400 });
    }

    // Find the corresponding order in our database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(waybill ? [{ awbNumber: String(waybill).trim() }] : []),
          ...(orderRef ? [{ orderNumber: String(orderRef).trim() }] : []),
          ...(orderRef ? [{ ithinkOrderId: String(orderRef).trim() }] : [])
        ]
      },
      include: {
        customer: true,
        items: true
      }
    });

    if (!order) {
      console.warn(`[iThink Webhook]: Order not found for AWB: ${waybill}, OrderRef: ${orderRef}`);
      return NextResponse.json({ success: true, message: "Webhook acknowledged, order not matched in store DB" });
    }

    // Map iThink milestone status to website OrderStatus
    let newOrderStatus: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" = order.status as any;
    let newShippingStatus = order.shippingStatus || "PROCESSING";

    if (
      statusRaw.includes("DELIVERED") ||
      statusRaw.includes("COMPLETED") ||
      statusRaw === "DL"
    ) {
      newOrderStatus = "DELIVERED";
      newShippingStatus = "DELIVERED";
    } else if (
      statusRaw.includes("OUT FOR DELIVERY") ||
      statusRaw.includes("DISPATCH") ||
      statusRaw.includes("TRANSIT") ||
      statusRaw.includes("PICKED") ||
      statusRaw.includes("SHIPPED") ||
      statusRaw.includes("MANIFEST")
    ) {
      newOrderStatus = "SHIPPED";
      newShippingStatus = statusRaw.includes("OUT FOR DELIVERY") ? "OUT_FOR_DELIVERY" : "IN_TRANSIT";
    } else if (
      statusRaw.includes("CANCEL") ||
      statusRaw.includes("CANCELLED")
    ) {
      newOrderStatus = "CANCELLED";
      newShippingStatus = "CANCELLED";
    } else if (
      statusRaw.includes("RTO") ||
      statusRaw.includes("RETURN") ||
      statusRaw.includes("UNDELIVERED")
    ) {
      newOrderStatus = "RETURNED";
      newShippingStatus = "RTO_IN_TRANSIT";
    }

    // Update Order in database
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newOrderStatus,
        shippingStatus: newShippingStatus,
        ...(newOrderStatus === "DELIVERED" && !order.deliveredAt ? { deliveredAt: new Date() } : {}),
        ...(waybill && !order.awbNumber ? { awbNumber: String(waybill) } : {}),
        ...(courierName && !order.courierName ? { courierName: String(courierName) } : {}),
        ...(trackingUrl ? { trackingUrl: String(trackingUrl) } : {})
      }
    });

    // Send customer milestone notification if status updated to SHIPPED or DELIVERED
    if (order.customer?.email && (newOrderStatus !== order.status || newOrderStatus === "SHIPPED" || newOrderStatus === "DELIVERED")) {
      sendOrderStatusUpdateEmail({
        email: order.customer.email,
        name: order.customer.name || order.shippingName,
        orderNumber: order.orderNumber,
        status: newOrderStatus,
        carrier: courierName || order.courierName || "iThink Logistics",
        awb: waybill || order.awbNumber || undefined,
        trackingUrl: trackingUrl || order.trackingUrl || undefined
      }).catch((e) => console.warn("[Webhook Customer Email Alert Error]:", e.message));
    }

    return NextResponse.json({
      success: true,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      shippingStatus: updatedOrder.shippingStatus,
      awbNumber: updatedOrder.awbNumber
    });
  } catch (err: any) {
    console.error("[iThink Webhook Handler Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Support GET for webhook health checks
export async function GET() {
  return NextResponse.json({
    success: true,
    service: "iThink Logistics Tracking Webhook Listener",
    status: "ACTIVE",
    timestamp: new Date().toISOString()
  });
}
