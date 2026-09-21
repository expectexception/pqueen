import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShippingEngine } from "@/lib/shipping/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET || "pqn-cron-secure-key";

    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron token" }, { status: 401 });
    }

    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        createdAt: { gte: cutoffTime },
      },
      take: 20,
      orderBy: { createdAt: "asc" },
    });

    const results = [];

    for (const order of pendingOrders) {
      try {
        const fulfillRes = await ShippingEngine.getInstance().autoFulfillOrder(order.id);
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: fulfillRes.success,
          courier: fulfillRes.courierSelected?.courierName,
          awb: fulfillRes.shipment?.awbNumber,
          pickupBooked: Boolean(fulfillRes.pickup?.success),
        });
      } catch (err: any) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ordersScanned: pendingOrders.length,
      fulfilledCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error: any) {
    console.error("[Automated Cron Fulfill Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Cron execution failed" },
      { status: 500 }
    );
  }
}
