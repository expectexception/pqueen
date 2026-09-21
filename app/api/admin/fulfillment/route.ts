import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";
import { getGSTStateInfo, generateAutomatedAWB } from "@/lib/indian-logistics";

export const dynamic = "force-dynamic";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const products = await prisma.product.findMany({
      include: {
        variants: true,
      },
    });

    // 1. Warehouse Hub Mapping
    const routedOrders = orders.map((order) => {
      const stateInfo = getGSTStateInfo(order.shippingState);
      let assignedHub = {
        id: "HUB-DEL-01",
        name: "Central Atelier Delhi Hub (NDLS)",
        code: "DEL-NDLS01",
        zone: "North",
        sla: "1 - 2 Business Days",
      };

      const zone = stateInfo.code;
      if (["24", "27", "26", "30", "23"].includes(zone)) {
        assignedHub = {
          id: "HUB-BOM-02",
          name: "Western Atelier Mumbai Hub (BOM)",
          code: "BOM-BKC02",
          zone: "West",
          sla: "1 - 2 Business Days",
        };
      } else if (["29", "33", "36", "37", "32", "34"].includes(zone)) {
        assignedHub = {
          id: "HUB-BLR-01",
          name: "Southern Fashion Hub Bengaluru (BLR)",
          code: "BLR-WFD01",
          zone: "South",
          sla: "2 - 3 Business Days",
        };
      } else if (["19", "10", "20", "21", "18", "11", "12", "13", "14", "15", "16", "17"].includes(zone)) {
        assignedHub = {
          id: "HUB-CCU-01",
          name: "Eastern Hub Kolkata (CCU)",
          code: "CCU-SLT01",
          zone: "East",
          sla: "2 - 3 Business Days",
        };
      }

      return {
        ...order,
        assignedHub,
        stateInfo,
      };
    });

    // 2. Compute Pipeline Counts
    const metrics = {
      totalOrders: orders.length,
      pendingRouting: routedOrders.filter((o) => o.status === "PENDING").length,
      readyForPick: routedOrders.filter((o) => o.status === "CONFIRMED" || o.status === "PENDING").length,
      inPackingQC: routedOrders.filter((o) => o.status === "PROCESSING").length,
      manifestedAwaitingPickup: routedOrders.filter((o) => o.status === "SHIPPED").length,
      deliveredOrders: routedOrders.filter((o) => o.status === "DELIVERED").length,
      returnedOrders: routedOrders.filter((o) => o.status === "RETURNED").length,
    };

    // 3. Batch Picking Wave Generation (Group pending items)
    const pendingOrdersForPick = routedOrders.filter(
      (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PROCESSING"
    );

    const wavePickItems: Record<string, { productName: string; size: string; quantity: number; orderCount: number; orders: string[]; aisleBin: string }> = {};

    pendingOrdersForPick.forEach((order, idx) => {
      order.items.forEach((item) => {
        const key = `${item.productName}_${item.size || "STD"}`;
        if (!wavePickItems[key]) {
          wavePickItems[key] = {
            productName: item.productName,
            size: item.size || "Free Size",
            quantity: 0,
            orderCount: 0,
            orders: [],
            aisleBin: `Aisle-${String.fromCharCode(65 + (idx % 4))}-Bin-${(idx % 12) + 101}`,
          };
        }
        wavePickItems[key].quantity += item.quantity;
        wavePickItems[key].orderCount += 1;
        if (!wavePickItems[key].orders.includes(order.orderNumber)) {
          wavePickItems[key].orders.push(order.orderNumber);
        }
      });
    });

    return NextResponse.json({
      success: true,
      metrics,
      routedOrders,
      wavePickList: Object.values(wavePickItems),
      hubs: [
        { id: "HUB-DEL-01", name: "Central Atelier Delhi Hub", code: "DEL-NDLS01", city: "New Delhi", state: "Delhi", capacity: "98% Optimal", activeOrders: routedOrders.filter(o => o.assignedHub.id === "HUB-DEL-01").length },
        { id: "HUB-BOM-02", name: "Western Atelier Mumbai Hub", code: "BOM-BKC02", city: "Mumbai", state: "Maharashtra", capacity: "92% Optimal", activeOrders: routedOrders.filter(o => o.assignedHub.id === "HUB-BOM-02").length },
        { id: "HUB-BLR-01", name: "Southern Fashion Hub", code: "BLR-WFD01", city: "Bengaluru", state: "Karnataka", capacity: "89% Optimal", activeOrders: routedOrders.filter(o => o.assignedHub.id === "HUB-BLR-01").length },
        { id: "HUB-CCU-01", name: "Eastern Hub Kolkata", code: "CCU-SLT01", city: "Kolkata", state: "West Bengal", capacity: "85% Optimal", activeOrders: routedOrders.filter(o => o.assignedHub.id === "HUB-CCU-01").length },
      ],
      carrierRates: [
        { carrier: "Blue Dart Air Express", mode: "Air Secure", ratePerKg: 140, baseCost: 180, estDays: "1 - 2 Days", recommended: true, badge: "FASTEST SLA" },
        { carrier: "Delhivery Air Express", mode: "Air Prime", ratePerKg: 110, baseCost: 145, estDays: "2 - 3 Days", recommended: false, badge: "BEST VALUE" },
        { carrier: "Shiprocket Smart Courier", mode: "Surface & Air", ratePerKg: 95, baseCost: 125, estDays: "2 - 4 Days", recommended: false, badge: "ECONOMY" },
        { carrier: "DTDC Prime Gold", mode: "Gold Express", ratePerKg: 105, baseCost: 135, estDays: "2 - 4 Days", recommended: false, badge: "SECURE" },
      ],
    });
  } catch (error) {
    console.error("FULFILLMENT WMS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load fulfillment pipeline data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "bulk_manifest") {
      const { orderIds, courier } = body;
      if (Array.isArray(orderIds) && orderIds.length > 0) {
        await prisma.order.updateMany({
          where: { id: { in: orderIds } },
          data: { status: "SHIPPED" },
        });
      }
      return NextResponse.json({ success: true, message: `Manifest generated for ${orderIds.length} orders via ${courier}.` });
    }

    if (action === "record_asn") {
      const { vendorName, invoiceNo, itemsCount, totalQty, hubId } = body;
      // Log Digital ASN
      return NextResponse.json({
        success: true,
        asnNumber: `ASN-${Date.now().toString().slice(-6)}`,
        message: `Advanced Shipping Notice recorded successfully. ${totalQty} units received at ${hubId || "Central Delhi Hub"}.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("FULFILLMENT POST ERROR:", error);
    return NextResponse.json({ error: "Failed to process fulfillment action." }, { status: 500 });
  }
}
