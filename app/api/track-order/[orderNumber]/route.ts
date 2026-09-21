import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAutomatedAWB, getGSTStateInfo } from "@/lib/indian-logistics";
import { evaluateReturnEligibility } from "@/lib/return-policy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const cleanNum = (orderNumber || "").trim().toUpperCase();

    // Look up by orderNumber or ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: cleanNum },
          { orderNumber: `PQN-${cleanNum}` },
          { id: cleanNum },
        ],
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: `No shipment found matching Reference #${cleanNum}. Please check your order reference number.` },
        { status: 404 }
      );
    }

    const stateInfo = getGSTStateInfo(order.shippingState);
    const fallbackAwbData = generateAutomatedAWB("Blue Dart Express", order.orderNumber);

    const orderObj = order as any;
    const awb = orderObj.awbNumber || fallbackAwbData.awb;
    const carrier = orderObj.courierName || fallbackAwbData.carrier;
    const trackingUrl = orderObj.trackingUrl || (awb ? `https://ithinklogistics.com/track?awb=${awb}` : fallbackAwbData.trackingUrl);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: (order as any).shippingStatus || order.status,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        shippingName: order.shippingName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPincode: order.shippingPincode,
        stateCode: stateInfo.code,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        itemsCount: (order.items || []).reduce((s: number, it: any) => s + it.quantity, 0),
        items: (order.items || []).map((it: any) => ({
          productName: it.productName,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          price: Number(it.price),
        })),
        logistics: {
          carrier: carrier,
          awb: awb,
          trackingUrl: trackingUrl,
          hubCode: fallbackAwbData.hubCode,
          estimatedDays: fallbackAwbData.estimatedDays,
        },
        deliveredAt: order.deliveredAt,
        returnEligibility: evaluateReturnEligibility(order),
      },
    });
  } catch (error) {
    console.error("TRACK ORDER API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to query live shipment tracker." },
      { status: 500 }
    );
  }
}
