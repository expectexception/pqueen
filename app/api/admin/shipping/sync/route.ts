import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShippingEngine } from "@/lib/shipping/engine";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Sync active orders tracking status with iThink Logistics API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId || body.id;

    const engine = ShippingEngine.getInstance();
    const ithinkAdapter = engine.getAdapter("ithink");

    // SINGLE ORDER MANUAL PUSH / RESYNC TO ITHINK LOGISTICS
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true, items: true }
      });

      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found in records" }, { status: 404 });
      }

      const isCod = (order.paymentMethod || "").toUpperCase() === "COD";

      const shipmentResult = await engine.createShipment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toISOString(),
        customer: {
          name: order.shippingName || order.customer?.name || "Valued Customer",
          email: order.customer?.email || "concierge@pqnpartyqueen.com",
          phone: order.shippingPhone || order.customer?.phone || "9958907429",
          addressLine1: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          pincode: order.shippingPincode,
          country: "India"
        },
        items: order.items.map((it: any, idx: number) => ({
          name: it.productName || "Luxury Garment",
          sku: it.productId ? it.productId.slice(0, 12) : `SKU-${idx + 1}`,
          quantity: it.quantity,
          unitPrice: Number(it.price)
        })),
        isCod,
        codAmount: isCod ? Number(order.totalAmount) : 0,
        invoiceValue: Number(order.totalAmount),
        providerId: "ithink",
        courierName: body.courierName || "Delhivery Surface & Express (iThink)"
      });

      if (!shipmentResult.success || !shipmentResult.awbNumber) {
        const errorMsg = shipmentResult.error || 'iThink Logistics rejected the shipment creation request.';
        const failedOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: { customer: true, items: true }
        });
        return NextResponse.json({
          success: false,
          error: errorMsg,
          order: failedOrder
        }, { status: 400 });
      }

      const awbNumber = shipmentResult.awbNumber;
      const courierName = shipmentResult.courierName || "Delhivery";
      const trackingUrl = shipmentResult.trackingUrl || `https://www.ithinklogistics.co.in/postship/tracking/${awbNumber}`;
      const shippingLabelUrl = shipmentResult.labelUrl || `https://my.ithinklogistics.com/print_label?awb=${awbNumber}`;
      const ithinkOrderId = shipmentResult.shipmentId || `ITHINK-${order.orderNumber}`;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SHIPPED",
          shippingStatus: "MANIFESTED",
          shippingError: null,
          awbNumber,
          courierName,
          trackingUrl,
          shippingLabelUrl,
          ithinkOrderId
        },
        include: {
          customer: true,
          items: true
        }
      });

      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} successfully pushed to iThink Logistics. Assigned AWB: ${awbNumber} (${courierName})`,
        awbNumber,
        courierName,
        trackingUrl,
        shippingLabelUrl,
        ithinkOrderId,
        order: updatedOrder
      });
    }

    // BULK TRACKING SYNC FOR ACTIVE ORDERS
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PROCESSING", "SHIPPED"] },
        awbNumber: { not: null }
      },
      include: {
        customer: true
      },
      take: 50
    });

    const results = [];

    for (const order of activeOrders) {
      if (!order.awbNumber) continue;

      try {
        const tracking = await ithinkAdapter?.trackShipment(order.awbNumber, order.ithinkOrderId || undefined);

        if (tracking) {
          const rawStatus = (tracking.currentStatus || "").toUpperCase();
          let newStatus: "PROCESSING" | "SHIPPED" | "DELIVERED" | "RETURNED" = order.status as any;

          if (rawStatus.includes("DELIVERED") || rawStatus === "DL") {
            newStatus = "DELIVERED";
          } else if (rawStatus.includes("OUT FOR DELIVERY") || rawStatus.includes("TRANSIT") || rawStatus.includes("SHIPPED") || rawStatus.includes("PICKED")) {
            newStatus = "SHIPPED";
          } else if (rawStatus.includes("RTO") || rawStatus.includes("RETURN")) {
            newStatus = "RETURNED";
          }

          if (newStatus !== order.status) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: newStatus,
                shippingStatus: rawStatus,
                ...(newStatus === "DELIVERED" && !order.deliveredAt ? { deliveredAt: new Date() } : {}),
                courierName: tracking.courierName || order.courierName
              }
            });

            if (order.customer?.email) {
              sendOrderStatusUpdateEmail({
                email: order.customer.email,
                name: order.customer.name || order.shippingName,
                orderNumber: order.orderNumber,
                status: newStatus,
                carrier: tracking.courierName || order.courierName || "iThink Logistics",
                awb: order.awbNumber,
                trackingUrl: order.trackingUrl || `https://my.ithinklogistics.com/track?awb=${order.awbNumber}`
              }).catch(() => {});
            }
          }

          results.push({
            orderNumber: order.orderNumber,
            awbNumber: order.awbNumber,
            previousStatus: order.status,
            currentStatus: newStatus,
            carrierStatus: tracking.statusText
          });
        }
      } catch (trackErr: any) {
        console.warn(`Failed to sync tracking for ${order.orderNumber}:`, trackErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: results.length,
      orders: results
    });
  } catch (err: any) {
    console.error("[Tracking Sync Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
